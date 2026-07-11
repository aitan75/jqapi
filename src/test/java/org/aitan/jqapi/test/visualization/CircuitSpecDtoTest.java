package org.aitan.jqapi.test.visualization;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.ComplexCell;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class CircuitSpecDtoTest {

    @Test
    void matrixCarryingSpecs_haveValueEquality() {
        // The matrix is a nested List, not an array, so structurally-equal
        // matrix-carrying specs compare equal (needed for save/load round-trips).
        List<List<ComplexCell>> m = List.of(
                List.of(new ComplexCell(0, 0), new ComplexCell(1, 0)),
                List.of(new ComplexCell(1, 0), new ComplexCell(0, 0)));
        GateSpec a = new GateSpec(GateKind.GENERIC, List.of(0), List.of(), Map.of(), m);
        GateSpec b = new GateSpec(GateKind.GENERIC, List.of(0), List.of(), Map.of(),
                List.of(
                        List.of(new ComplexCell(0, 0), new ComplexCell(1, 0)),
                        List.of(new ComplexCell(1, 0), new ComplexCell(0, 0))));
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void gateSpecOf_buildsUncontrolledNonParametricGate() {
        GateSpec h = GateSpec.of(GateKind.H, 0);
        assertEquals(GateKind.H, h.kind());
        assertEquals(List.of(0), h.targets());
        assertTrue(h.controls().isEmpty());
        assertTrue(h.params().isEmpty());
        assertNull(h.matrix());
    }

    @Test
    void circuitSpec_holdsLevelsAndVersion() {
        LevelSpec level = new LevelSpec(List.of(GateSpec.of(GateKind.H, 0)));
        CircuitSpec spec = CircuitSpec.of(2, List.of(level));
        assertEquals(CircuitSpec.CURRENT_VERSION, spec.version());
        assertEquals(2, spec.numQubits());
        assertEquals(1, spec.levels().size());
        assertEquals(GateKind.H, spec.levels().get(0).gates().get(0).kind());
    }

    @Test
    void parametricGateSpec_carriesParams() {
        GateSpec rx = new GateSpec(GateKind.RX, List.of(0), List.of(), Map.of("theta", 1.5708), null);
        assertEquals(1.5708, rx.params().get("theta"));
    }

    @Test
    void gateKind_coversAllFamilies() {
        // 23 canonical kinds (see design spec); guards against accidental removal.
        assertEquals(23, GateKind.values().length);
    }
}
