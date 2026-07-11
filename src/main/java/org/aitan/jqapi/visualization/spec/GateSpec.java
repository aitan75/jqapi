package org.aitan.jqapi.visualization.spec;

import java.util.List;
import java.util.Map;

/**
 * Serializable, lossless description of a single gate placement.
 *
 * <p>All components are held as immutable value types (the {@code matrix} is a
 * nested {@code List} rather than an array) so that two structurally-equal
 * specs compare equal — which the save/load round-trip in a later phase relies
 * on.
 *
 * @param kind     the canonical gate kind
 * @param targets  the target qubit indexes (the wires the gate acts on)
 * @param controls the control qubit indexes (empty if uncontrolled); controls
 *                 are the most-significant qubits, so the runtime
 *                 {@code getIndexes()} order is {@code controls} then {@code targets}
 * @param params   named continuous parameters (e.g. {@code theta}/{@code phi}/{@code lambda}
 *                 for RX/RY/RZ/PHASE/U3); empty for non-parametric gates
 * @param matrix   the base unitary (row-major) for {@code GENERIC}/{@code ORACLE}/{@code MULTI_CONTROLLED};
 *                 {@code null} otherwise
 *
 * @author Gaetano Ferrara
 */
public record GateSpec(
        GateKind kind,
        List<Integer> targets,
        List<Integer> controls,
        Map<String, Double> params,
        List<List<ComplexCell>> matrix) {

    /** Defensively copies every component into an immutable form. */
    public GateSpec {
        targets = List.copyOf(targets);
        controls = List.copyOf(controls);
        params = Map.copyOf(params);
        matrix = matrix == null ? null : matrix.stream().map(List::copyOf).toList();
    }

    /** Convenience for the common uncontrolled, non-parametric single-family gate. */
    public static GateSpec of(GateKind kind, Integer... targets) {
        return new GateSpec(kind, List.of(targets), List.of(), Map.of(), null);
    }
}
