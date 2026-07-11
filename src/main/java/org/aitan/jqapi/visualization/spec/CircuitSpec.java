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

    /** Current on-disk/format version. */
    public static final int CURRENT_VERSION = 1;

    /** @return a spec at {@link #CURRENT_VERSION} with the given qubits and levels */
    public static CircuitSpec of(int numQubits, List<LevelSpec> levels) {
        return new CircuitSpec(CURRENT_VERSION, numQubits, levels);
    }
}
