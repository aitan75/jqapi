package org.aitan.jqapi.quantum;

import java.util.*;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.visualization.spec.*;

public final class ParametricCircuit {
    private final int inputSize;
    private final JQAPIConfig config;
    private final List<ParametricGate> gates;

    public static final class ParametricGate {
        private final String kind;
        private final int[] indexes;
        private final String[] params;
        public ParametricGate(String kind, int[] indexes, String... params) {
            if (indexes == null || indexes.length == 0) throw new IllegalArgumentException("indexes required");
            this.kind = Objects.requireNonNull(kind, "kind");
            this.indexes = java.util.Arrays.copyOf(indexes, indexes.length);
            this.params = java.util.Arrays.copyOf(params, params.length);
        }
        public String kind() { return kind; }
        public int[] indexes() { return java.util.Arrays.copyOf(indexes, indexes.length); }
        public String[] params() { return java.util.Arrays.copyOf(params, params.length); }
    }

    public ParametricCircuit(int inputSize, JQAPIConfig config, List<ParametricGate> gates) {
        this.inputSize = inputSize;
        this.config = config;
        this.gates = List.copyOf(gates);
    }

    public Circuit bind(Map<String, Double> params) {
        Objects.requireNonNull(params, "params");
        Set<String> expected = new HashSet<>();
        for (ParametricGate g : gates) {
            for (String p : g.params()) expected.add(p);
            int arity = switch (g.kind) {
                case "RX", "RY", "RZ", "PHASE" -> 1;
                case "U3" -> 3;
                default -> throw new IllegalArgumentException("Unknown kind: " + g.kind);
            };
            if (g.params().length != arity) throw new IllegalArgumentException(
                "Gate " + g.kind + " expects " + arity + " params, got " + g.params().length);
        }
        if (!expected.equals(params.keySet())) throw new IllegalArgumentException(
            "Binding keys mismatch: expected " + expected + ", got " + params.keySet());
        for (String p : params.keySet()) {
            Double v = params.get(p);
            if (!Double.isFinite(v)) throw new IllegalArgumentException("Non-finite param: " + p);
        }
        Circuit circuit = new Circuit(inputSize, config);
        for (ParametricGate g : gates) {
            CircuitLevel level = new CircuitLevel();
            Gate gate = buildGate(g, params);
            level.addGate(gate);
            circuit.addLevel(level);
        }
        return circuit;
    }

    public CircuitSpec bindToSpec(Map<String, Double> params) {
        bind(params); // valida
        List<GateSpec> gateSpecs = new ArrayList<>();
        for (ParametricGate g : gates) {
            Map<String, Double> named = new HashMap<>();
            String[] ps = g.params();
            named.put(ps[0], params.get(ps[0]));
            if (g.kind().equals("U3")) {
                named.put(ps[1], params.get(ps[1]));
                named.put(ps[2], params.get(ps[2]));
            }
            GateKind kind = switch (g.kind()) {
                case "RX" -> GateKind.RX;
                case "RY" -> GateKind.RY;
                case "RZ" -> GateKind.RZ;
                case "PHASE" -> GateKind.PHASE;
                case "U3" -> GateKind.U3;
                default -> throw new IllegalArgumentException("Unknown kind: " + g.kind());
            };
            List<Integer> targets = Arrays.stream(g.indexes()).boxed().toList();
            gateSpecs.add(new GateSpec(kind, targets, List.of(), named, null));
        }
        return CircuitSpec.of(inputSize, List.of(new LevelSpec(gateSpecs)));
    }

    private Gate buildGate(ParametricGate g, Map<String, Double> params) {
        return switch (g.kind) {
            case "RX" -> new Rx(params.get(g.params()[0]), Arrays.stream(g.indexes()).boxed().toArray(Integer[]::new));
            case "RY" -> new Ry(params.get(g.params()[0]), Arrays.stream(g.indexes()).boxed().toArray(Integer[]::new));
            case "RZ" -> new Rz(params.get(g.params()[0]), Arrays.stream(g.indexes()).boxed().toArray(Integer[]::new));
            case "PHASE" -> new Phase(params.get(g.params()[0]), Arrays.stream(g.indexes()).boxed().toArray(Integer[]::new));
            case "U3" -> new U3(params.get(g.params()[0]), params.get(g.params()[1]), params.get(g.params()[2]), Arrays.stream(g.indexes()).boxed().toArray(Integer[]::new));
            default -> throw new IllegalArgumentException("Unsupported parametric kind: " + g.kind);
        };
    }
}
