package org.aitan.jqapi.visualization.spec;

import java.util.List;

/**
 * One time-step of a {@link CircuitSpec}: the gates applied in parallel on
 * distinct qubits. Idle wires need not be listed (they map to Identity when
 * built into a {@code Circuit}).
 *
 * @param gates the gates placed in this level
 *
 * @author Gaetano Ferrara
 */
public record LevelSpec(List<GateSpec> gates) {

    /** Defensively copies the gates into an immutable list. */
    public LevelSpec {
        gates = List.copyOf(gates);
    }
}
