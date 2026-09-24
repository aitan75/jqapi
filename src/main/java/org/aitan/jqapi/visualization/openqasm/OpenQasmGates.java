package org.aitan.jqapi.visualization.openqasm;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;

/** Shared, explicit OpenQASM 2 gate mapping. Controls precede targets on the wire. */
final class OpenQasmGates {
    record Mapping(String name, GateKind kind, int controls, int targets, List<String> parameters) {
        Mapping(String name, GateKind kind, int controls, int targets, String... parameters) {
            this(name, kind, controls, targets, List.of(parameters));
        }
    }

    private static final List<Mapping> MAPPINGS = List.of(
            new Mapping("h", GateKind.H, 0, 1), new Mapping("x", GateKind.X, 0, 1),
            new Mapping("y", GateKind.Y, 0, 1), new Mapping("z", GateKind.Z, 0, 1),
            new Mapping("s", GateKind.S, 0, 1), new Mapping("t", GateKind.T, 0, 1),
            new Mapping("id", GateKind.IDENTITY, 0, 1),
            new Mapping("cx", GateKind.CNOT, 1, 1), new Mapping("cy", GateKind.CY, 1, 1),
            new Mapping("cz", GateKind.CZ, 1, 1), new Mapping("swap", GateKind.SWAP, 0, 2),
            new Mapping("cswap", GateKind.CSWAP, 1, 2), new Mapping("ccx", GateKind.TOFFOLI, 2, 1),
            new Mapping("rx", GateKind.RX, 0, 1, "theta"),
            new Mapping("ry", GateKind.RY, 0, 1, "theta"),
            new Mapping("rz", GateKind.RZ, 0, 1, "theta"),
            new Mapping("u1", GateKind.PHASE, 0, 1, "theta"),
            new Mapping("u3", GateKind.U3, 0, 1, "theta", "phi", "lambda"),
            new Mapping("measure", GateKind.MEASUREMENT, 0, 1),
            new Mapping("reset", GateKind.RESET, 0, 1));

    private OpenQasmGates() { }

    static Mapping named(String name) {
        String canonical = switch (name) {
            case "U", "u2" -> "u3";
            case "CX" -> "cx";
            case "sdg", "tdg" -> "u1";
            default -> name;
        };
        return MAPPINGS.stream().filter(mapping -> mapping.name().equals(canonical)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported OpenQASM gate: " + name));
    }

    static Mapping forKind(GateKind kind) {
        return MAPPINGS.stream().filter(mapping -> mapping.kind() == kind).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cannot export unsupported gate: " + kind));
    }

    static Map<String, Double> parameters(String name, Mapping mapping, List<Double> values) {
        int count = switch (name) {
            case "u2" -> 2;
            case "sdg", "tdg" -> 0;
            default -> mapping.parameters().size();
        };
        if (values.size() != count) throw new IllegalArgumentException(name + " requires " + count + " parameters");
        return switch (name) {
            case "u2" -> Map.of("theta", Math.PI / 2, "phi", values.get(0), "lambda", values.get(1));
            case "sdg" -> Map.of("theta", -Math.PI / 2);
            case "tdg" -> Map.of("theta", -Math.PI / 4);
            default -> switch (count) {
                case 0 -> Map.of();
                case 1 -> Map.of("theta", values.getFirst());
                default -> Map.of("theta", values.get(0), "phi", values.get(1), "lambda", values.get(2));
            };
        };
    }

    static void validate(GateSpec gate, int qubits) {
        Mapping mapping = forKind(gate.kind());
        boolean singleFamily = mapping.controls() == 0 && mapping.targets() == 1;
        if (gate.controls().size() != mapping.controls()
                || (singleFamily ? gate.targets().isEmpty() : gate.targets().size() != mapping.targets())) {
            throw new IllegalArgumentException("Invalid controls/targets for " + gate.kind());
        }
        if (gate.matrix() != null || !gate.params().keySet().equals(new HashSet<>(mapping.parameters()))) {
            throw new IllegalArgumentException("Unexpected matrix or missing/extra parameters for " + gate.kind());
        }
        if (gate.params().values().stream().anyMatch(value -> !Double.isFinite(value))) {
            throw new IllegalArgumentException("Gate parameters must be finite");
        }
        var seen = new HashSet<Integer>();
        for (List<Integer> operands : Arrays.asList(gate.controls(), gate.targets())) {
            for (int index : operands) {
                if (index < 0 || index >= qubits || !seen.add(index)) {
                    throw new IllegalArgumentException("Invalid or repeated qubit index: " + index);
                }
            }
        }
        if (gate.kind() == GateKind.MEASUREMENT && gate.classicalTarget() == null) {
            throw new IllegalArgumentException("OpenQASM export requires an explicit classical measurement destination");
        }
    }
}
