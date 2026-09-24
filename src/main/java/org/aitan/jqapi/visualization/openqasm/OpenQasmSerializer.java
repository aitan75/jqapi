package org.aitan.jqapi.visualization.openqasm;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;

/** Exports the documented OpenQASM 2 subset without discarding unsupported operations. */
public final class OpenQasmSerializer {
    private OpenQasmSerializer() { }

    public static String serialize(CircuitSpec spec) {
        return serialize(spec, JQAPIConfig.getDefault());
    }

    public static String serialize(CircuitSpec spec, JQAPIConfig config) {
        Objects.requireNonNull(spec, "spec");
        Objects.requireNonNull(config, "config");
        if (spec.numQubits() < 1 || spec.numQubits() > config.maxQubits()
                || spec.numClassicalBits() > config.maxQubits()) {
            throw new JQApiLimitException("Circuit exceeds configured bit budget or has no qubits");
        }
        var output = new StringBuilder("OPENQASM 2.0;\ninclude \"qelib1.inc\";\n");
        output.append("qreg q[").append(spec.numQubits()).append("];\n");
        // Conditions compare entire registers; one-bit registers preserve Condition semantics.
        for (int bit = 0; bit < spec.numClassicalBits(); bit++) {
            output.append("creg c").append(bit).append("[1];\n");
        }
        int operations = 0;
        for (var level : spec.levels()) {
            var used = new HashSet<Integer>();
            for (GateSpec original : level.gates()) {
                OpenQasmGates.validate(original, spec.numQubits());
                var operands = new ArrayList<>(original.controls());
                operands.addAll(original.targets());
                for (int operand : operands) {
                    if (!used.add(operand)) throw new IllegalArgumentException("Overlapping gate operands within a level");
                }
                for (GateSpec gate : lowerSwaps(original)) {
                    var gateOperands = new ArrayList<>(gate.controls());
                    gateOperands.addAll(gate.targets());
                    var mapping = OpenQasmGates.forKind(gate.kind());
                    List<List<Integer>> placements = mapping.controls() == 0 && mapping.targets() == 1
                            ? gate.targets().stream().map(List::of).toList() : List.of(gateOperands);
                    for (List<Integer> placement : placements) {
                        if (++operations > OpenQasmParser.MAX_OPERATIONS) throw new JQApiLimitException("OpenQASM operation limit exceeded");
                        if (gate.condition() != null) {
                            output.append("if(c").append(gate.condition().bitIndex()).append("==")
                                    .append(gate.condition().expected()).append(") ");
                        }
                        output.append(mapping.name());
                        if (!mapping.parameters().isEmpty()) {
                            output.append('(').append(mapping.parameters().stream()
                                    .map(parameter -> Double.toString(gate.params().get(parameter)))
                                    .collect(Collectors.joining(","))).append(')');
                        }
                        output.append(' ').append(placement.stream().map(index -> "q[" + index + "]")
                                .collect(Collectors.joining(",")));
                        if (gate.kind() == GateKind.MEASUREMENT) {
                            output.append(" -> c").append(gate.classicalTarget()).append("[0]");
                        }
                        output.append(";\n");
                        if (output.length() > OpenQasmParser.MAX_SOURCE_LENGTH) throw new JQApiLimitException("OpenQASM output exceeds character limit");
                    }
                }
            }
        }
        return output.toString();
    }

    private static List<GateSpec> lowerSwaps(GateSpec gate) {
        // The original qelib1.inc lacks swap/cswap, although common exporters use them.
        if (gate.kind() != GateKind.SWAP && gate.kind() != GateKind.CSWAP) return List.of(gate);
        int a = gate.targets().get(0);
        int b = gate.targets().get(1);
        if (gate.kind() == GateKind.SWAP) {
            return List.of(cx(a, b, gate), cx(b, a, gate), cx(a, b, gate));
        }
        var middle = new GateSpec(GateKind.TOFFOLI, List.of(b), List.of(gate.controls().getFirst(), a),
                Map.of(), null, null, gate.condition());
        return List.of(cx(b, a, gate), middle, cx(b, a, gate));
    }

    private static GateSpec cx(int control, int target, GateSpec source) {
        return new GateSpec(GateKind.CNOT, List.of(target), List.of(control), Map.of(), null, null, source.condition());
    }
}
