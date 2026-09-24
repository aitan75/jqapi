package org.aitan.jqapi.visualization.spec;

import java.util.List;

/** Immutable circuit description; v2 associates classical addresses with gate placements. */
public record CircuitSpec(int version, int numQubits, List<LevelSpec> levels, int numClassicalBits) {
    public static final int CURRENT_VERSION = 2;
    public static final int VERSION_1 = 1;

    public CircuitSpec {
        if (version != VERSION_1 && version != CURRENT_VERSION) throw new org.aitan.jqapi.exceptions.UnsupportedSpecVersionException(version);
        if (numClassicalBits < 0 || numClassicalBits > 30) throw new IllegalArgumentException("Classical register size must be in [0, 30]");
        levels = List.copyOf(levels);
        if (version == VERSION_1 && (numClassicalBits != 0 || levels.stream().flatMap(l -> l.gates().stream())
                .anyMatch(g -> g.classicalTarget() != null || g.condition() != null))) {
            throw new IllegalArgumentException("Classical operations require CircuitSpec v2");
        }
        for (LevelSpec level : levels) {
            boolean[] reads = new boolean[numClassicalBits];
            boolean[] writes = new boolean[numClassicalBits];
            for (GateSpec gate : level.gates()) {
                if (gate.classicalTarget() != null) {
                    int bit = gate.classicalTarget();
                    if (bit >= numClassicalBits) throw new IllegalArgumentException("Classical target outside register");
                    if (writes[bit]) throw new IllegalArgumentException("Repeated classical write within one level");
                    writes[bit] = true;
                }
                if (gate.condition() != null) {
                    int bit = gate.condition().bitIndex();
                    if (bit >= numClassicalBits) throw new IllegalArgumentException("Condition outside classical register");
                    reads[bit] = true;
                }
            }
            for (int bit = 0; bit < numClassicalBits; bit++) {
                if (reads[bit] && writes[bit]) throw new IllegalArgumentException("Same-level classical read/write dependency");
            }
        }
    }

    public CircuitSpec(int version, int numQubits, List<LevelSpec> levels) {
        this(version, numQubits, levels, 0);
    }

    public static CircuitSpec of(int numQubits, List<LevelSpec> levels) {
        return new CircuitSpec(CURRENT_VERSION, numQubits, levels);
    }

    public static CircuitSpec of(int numQubits, List<LevelSpec> levels, int numClassicalBits) {
        return new CircuitSpec(CURRENT_VERSION, numQubits, levels, numClassicalBits);
    }

    public static CircuitSpec migrateV1(CircuitSpec v1) {
        if (v1.version() != VERSION_1) throw new IllegalArgumentException("Expected v1 spec");
        return of(v1.numQubits(), v1.levels());
    }
}
