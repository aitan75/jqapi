package org.aitan.jqapi.visualization.lint;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser.Barrier;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser.Location;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;

/**
 * Educational, non-blocking circuit diagnostics. One pass over the levels, O(gates + qubits),
 * never allocates a state vector and never changes the circuit. See docs/manual/openqasm.md.
 */
public final class CircuitLinter {
    public static final String REDUNDANT_HADAMARD = "QED001";
    public static final String REUSE_AFTER_MEASUREMENT = "QED002";
    public static final String UNUSED_QUBITS = "QED003";
    /** Diagnostics beyond this count are dropped; the parser caps input at 10,000 operations. */
    public static final int MAX_DIAGNOSTICS = 100;

    public enum Severity { INFO, WARNING }

    /**
     * @param levels    involved level indexes, in order (empty for whole-circuit findings)
     * @param locations source positions of those levels; empty for CircuitSpec-only callers
     */
    public record Diagnostic(String rule, Severity severity, List<Integer> levels, List<Integer> qubits,
                             List<Location> locations, String message, String suggestion) {
        public Diagnostic {
            levels = List.copyOf(levels);
            qubits = List.copyOf(qubits);
            locations = List.copyOf(locations);
        }
    }

    private final CircuitSpec spec;
    private final List<Location> levelLocations;
    private final List<String> names;
    private final Set<String> disabled;
    private final List<Diagnostic> diagnostics = new ArrayList<>();

    private CircuitLinter(CircuitSpec spec, List<Location> levelLocations, List<String> names, Set<String> disabled) {
        this.spec = Objects.requireNonNull(spec, "spec");
        this.levelLocations = levelLocations;
        this.names = names;
        this.disabled = Set.copyOf(disabled);
    }

    public static List<Diagnostic> lint(CircuitSpec spec) {
        return lint(spec, Set.of());
    }

    /** Lints a spec; locations point at levels only. {@code disabledRules} holds rule IDs to skip. */
    public static List<Diagnostic> lint(CircuitSpec spec, Set<String> disabledRules) {
        var names = new ArrayList<String>();
        for (int q = 0; q < spec.numQubits(); q++) names.add("q[" + q + "]");
        return new CircuitLinter(spec, List.of(), names, disabledRules).run(List.of());
    }

    /** Lints parsed OpenQASM, reporting source lines, register names and respecting barriers. */
    public static List<Diagnostic> lint(OpenQasmParser.Program program, Set<String> disabledRules) {
        return new CircuitLinter(program.spec(), program.levelLocations(), program.qubitNames(), disabledRules)
                .run(program.barriers());
    }

    /** One line per diagnostic plus an indented hint, for terminals and logs. */
    public static String format(List<Diagnostic> diagnostics) {
        var out = new StringBuilder();
        for (Diagnostic d : diagnostics) {
            String where = !d.locations().isEmpty() ? "line " + d.locations().getFirst().line() + ":" + d.locations().getFirst().column()
                    : !d.levels().isEmpty() ? "level " + d.levels().getFirst() : "circuit";
            out.append(where).append(' ').append(d.rule()).append(' ').append(d.severity().name().toLowerCase())
                    .append(": ").append(d.message()).append("\n  hint: ").append(d.suggestion()).append('\n');
        }
        return out.toString();
    }

    private List<Diagnostic> run(List<Barrier> barriers) {
        int n = spec.numQubits();
        Integer[] pendingHadamard = new Integer[n];
        Integer[] measuredAt = new Integer[n];
        boolean[] used = new boolean[n];
        boolean anyOperation = false;
        int barrier = 0;
        for (int level = 0; level < spec.levels().size(); level++) {
            for (; barrier < barriers.size() && barriers.get(barrier).beforeLevel() == level; barrier++) {
                for (int q : barriers.get(barrier).qubits()) { pendingHadamard[q] = null; used[q] = true; anyOperation = true; }
            }
            for (GateSpec gate : spec.levels().get(level).gates()) {
                anyOperation = true;
                var operands = new ArrayList<>(gate.controls());
                operands.addAll(gate.targets());
                for (int q : operands) used[q] = true;
                // CircuitSpecs.toSpec already drops runtime identity padding, so a remaining
                // IDENTITY was written explicitly: it counts as usage but changes no state.
                if (gate.kind() == GateKind.IDENTITY && gate.condition() == null) continue;
                hadamard(gate, operands, level, pendingHadamard);
                reuse(gate, operands, level, measuredAt);
            }
        }
        for (; barrier < barriers.size(); barrier++) {
            for (int q : barriers.get(barrier).qubits()) { used[q] = true; anyOperation = true; }
        }
        if (anyOperation) unused(used);
        return List.copyOf(diagnostics);
    }

    private void hadamard(GateSpec gate, List<Integer> operands, int level, Integer[] pending) {
        boolean plainH = gate.kind() == GateKind.H && gate.controls().isEmpty() && gate.condition() == null;
        if (!plainH) {
            for (int q : operands) pending[q] = null;
            return;
        }
        for (int q : gate.targets()) {
            if (pending[q] == null) {
                pending[q] = level;
                continue;
            }
            report(REDUNDANT_HADAMARD, Severity.WARNING, List.of(pending[q], level), List.of(q),
                    "Two H gates on " + names.get(q) + " cancel out (H·H = I) with no operation on that qubit in between.",
                    "If unintended, remove the H on " + names.get(q) + " at both positions, keeping any other qubit those "
                            + "gates act on. The identity holds for the ideal circuit; under a noise model, removing gates "
                            + "can change the noisy results.");
            pending[q] = null;
        }
    }

    private void reuse(GateSpec gate, List<Integer> operands, int level, Integer[] measuredAt) {
        if (gate.kind() == GateKind.RESET || gate.kind() == GateKind.MEASUREMENT) {
            for (int q : gate.targets()) measuredAt[q] = gate.kind() == GateKind.RESET ? null : level;
            return;
        }
        // Classically conditioned gates are feed-forward or active reset, not premature measurement.
        if (gate.condition() != null) return;
        for (int q : operands) {
            if (measuredAt[q] == null) continue;
            report(REUSE_AFTER_MEASUREMENT, Severity.INFO, List.of(measuredAt[q], level), List.of(q),
                    names.get(q) + " is measured before this quantum operation. Check whether collapsing its state "
                            + "here is intentional: measurement removes superposition and entanglement.",
                    "If you wanted coherence preserved, move the measurement later. Re-preparing a measured qubit is "
                            + "valid (reset makes the intent explicit); disable " + REUSE_AFTER_MEASUREMENT + " if intended.");
            measuredAt[q] = null;
        }
    }

    private void unused(boolean[] used) {
        var unused = new ArrayList<Integer>();
        for (int q = 0; q < used.length; q++) if (!used[q]) unused.add(q);
        if (unused.isEmpty()) return;
        int n = used.length;
        int k = n - unused.size();
        report(UNUSED_QUBITS, Severity.WARNING, List.of(), unused,
                unused.size() + " of " + n + " declared qubits are never used: "
                        + unused.stream().map(names::get).collect(Collectors.joining(", ")) + ". The ideal state vector stores "
                        + (1L << n) + " amplitudes versus " + (1L << k) + " for " + k + " qubits: a " + (1L << (n - k))
                        + "x storage difference, not a guaranteed speedup.",
                "Shrink the register only deliberately: it renumbers qubits and changes the output bitstring width.");
    }

    private void report(String rule, Severity severity, List<Integer> levels, List<Integer> qubits, String message, String suggestion) {
        if (disabled.contains(rule) || diagnostics.size() >= MAX_DIAGNOSTICS) return;
        var locations = levelLocations.isEmpty() ? List.<Location>of() : levels.stream().map(levelLocations::get).toList();
        diagnostics.add(new Diagnostic(rule, severity, levels, qubits, locations, message, suggestion));
    }
}
