package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;

/**
 * Immutable, reusable sequence of parameterized gates. Each placement occupies
 * its own level, in declaration order; qubit zero is the most significant bit.
 * Bindings contain exactly the declared names and finite, non-null values.
 * Symbolic template serialization is unsupported; use {@link #bindToSpec(Map)}
 * to serialize a concrete binding without losing its angles.
 */
public final class ParametricCircuit {
    private final int inputSize;
    private final JQAPIConfig config;
    private final List<ParametricGate> gates;
    private final Set<String> parameterNames;

    /**
     * An immutable placement. RX/RY/RZ/PHASE take one name (theta); U3 takes
     * three names in theta, phi, lambda order. Names may repeat, including
     * within U3. Multiple targets apply the same single-qubit gate to each wire.
     */
    public static final class ParametricGate {
        private final GateKind kind;
        private final int[] indexes;
        private final String[] params;

        /** Creates a placement with nonempty, distinct, nonnegative targets. */
        public ParametricGate(String kind, int[] indexes, String... params) {
            this.kind = switch (Objects.requireNonNull(kind, "kind")) {
                case "RX" -> GateKind.RX;
                case "RY" -> GateKind.RY;
                case "RZ" -> GateKind.RZ;
                case "PHASE" -> GateKind.PHASE;
                case "U3" -> GateKind.U3;
                default -> throw new IllegalArgumentException("Unsupported parametric kind: " + kind);
            };
            Objects.requireNonNull(indexes, "indexes");
            Objects.requireNonNull(params, "params");
            this.indexes = indexes.clone();
            this.params = params.clone();
            if (this.indexes.length == 0) {
                throw new IllegalArgumentException("At least one target is required");
            }
            Set<Integer> targets = new LinkedHashSet<>();
            for (int index : this.indexes) {
                if (index < 0 || !targets.add(index)) {
                    throw new IllegalArgumentException("Targets must be distinct and nonnegative: " + index);
                }
            }
            int arity = this.kind == GateKind.U3 ? 3 : 1;
            if (this.params.length != arity) {
                throw new IllegalArgumentException("Gate " + kind + " expects " + arity + " parameter names");
            }
            for (String name : this.params) {
                if (name == null || name.isBlank()) {
                    throw new IllegalArgumentException("Parameter names must be nonblank");
                }
            }
        }

        public String kind() { return kind.name(); }
        public int[] indexes() { return indexes.clone(); }
        public String[] params() { return params.clone(); }
    }

    /** Creates a template, validating qubit limits and all target indexes immediately. */
    public ParametricCircuit(int inputSize, JQAPIConfig config, List<ParametricGate> gates) {
        this.config = Objects.requireNonNull(config, "config");
        // Reuse Circuit's resource validation without allocating a simulator or state vector.
        new Circuit(inputSize, config);
        this.inputSize = inputSize;
        this.gates = List.copyOf(gates);
        Set<String> names = new LinkedHashSet<>();
        for (ParametricGate gate : this.gates) {
            for (int index : gate.indexes) {
                if (index >= inputSize) {
                    throw new IllegalArgumentException("Target outside circuit: " + index);
                }
            }
            names.addAll(Arrays.asList(gate.params));
        }
        this.parameterNames = Set.copyOf(names);
    }

    /** Returns a fresh executable circuit with no shared mutable gates or simulator state. */
    public Circuit bind(Map<String, Double> params) {
        return CircuitSpecs.toCircuit(bindToSpec(params), config);
    }

    /**
     * Returns a lossless concrete spec. Symbolic names are resolved into canonical
     * theta/phi/lambda keys, preserving every placement's level and target order.
     * @throws IllegalArgumentException if keys differ or a value is null or non-finite
     */
    public CircuitSpec bindToSpec(Map<String, Double> params) {
        Objects.requireNonNull(params, "params");
        Map<String, Double> values = new LinkedHashMap<>(params);
        if (!parameterNames.equals(values.keySet())) {
            throw new IllegalArgumentException("Binding keys mismatch: expected " + parameterNames
                    + ", got " + values.keySet());
        }
        for (Map.Entry<String, Double> entry : values.entrySet()) {
            if (entry.getValue() == null || !Double.isFinite(entry.getValue())) {
                throw new IllegalArgumentException("Parameter must be finite and non-null: " + entry.getKey());
            }
        }
        List<LevelSpec> levels = new ArrayList<>(gates.size());
        for (ParametricGate gate : gates) {
            Map<String, Double> named = new LinkedHashMap<>();
            named.put("theta", values.get(gate.params[0]));
            if (gate.kind == GateKind.U3) {
                named.put("phi", values.get(gate.params[1]));
                named.put("lambda", values.get(gate.params[2]));
            }
            List<Integer> targets = Arrays.stream(gate.indexes).boxed().toList();
            GateSpec spec = new GateSpec(gate.kind, targets, List.of(), named, null);
            levels.add(new LevelSpec(List.of(spec)));
        }
        return CircuitSpec.of(inputSize, levels);
    }
}
