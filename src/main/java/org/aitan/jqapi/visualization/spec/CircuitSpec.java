package org.aitan.jqapi.visualization.spec;

import java.util.List;

/**
 * The canonical, serializable representation of a quantum circuit for the
 * visualization layer. Unlike the runtime {@code Circuit}/{@code Gate} model
 * (which discards parametric angles and multi-control structure), a
 * {@code CircuitSpec} is lossless and is the single source of truth shared by
 * the renderer, the editor, and save/load.
 *
 * @param version   format version, for forward-compatible save/load
 * @param numQubits number of qubit wires
 * @param levels    ordered time-steps
 *
 * @author Gaetano Ferrara
 */
public record CircuitSpec(int version, int numQubits, List<LevelSpec> levels) {

    /** Defensively copies the levels into an immutable list. */
    public CircuitSpec {
        levels = List.copyOf(levels);
    }

    /** Current on-disk/format version. */
    public static final int CURRENT_VERSION = 2;

    /** Legacy v1 version. */
    public static final int VERSION_1 = 1;

    /** @return a spec at {@link #CURRENT_VERSION} with the given qubits and levels */
    public static CircuitSpec of(int numQubits, List<LevelSpec> levels) {
        return new CircuitSpec(CURRENT_VERSION, numQubits, levels);
    }

    /** Migrate a v1 spec to v2; unsupported readers must reject v2 clearly. */
    public static CircuitSpec migrateV1(CircuitSpec v1) {
        if (v1.version() != VERSION_1) throw new IllegalArgumentException("Expected v1 spec");
        return new CircuitSpec(CURRENT_VERSION, v1.numQubits(), v1.levels());
    }
}
