package org.aitan.jqapi.visualization.spec;

/**
 * Canonical, unambiguous discriminator for a gate in a {@link CircuitSpec}.
 * Used instead of the runtime {@code Gate.getType()} label so the visualization
 * layer never depends on ambiguous magic strings.
 *
 * @author Gaetano Ferrara
 */
public enum GateKind {
    H, X, Y, Z, S, T,
    CNOT, CZ, CY, SWAP, CSWAP, TOFFOLI,
    RX, RY, RZ, PHASE, U3,
    MULTI_CONTROLLED, ORACLE, GENERIC,
    MEASUREMENT, RESET, IDENTITY
}
