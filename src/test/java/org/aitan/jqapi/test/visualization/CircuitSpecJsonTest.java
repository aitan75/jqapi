package org.aitan.jqapi.test.visualization;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.aitan.jqapi.visualization.spec.ComplexCell;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class CircuitSpecJsonTest {

    private static GateSpec cnot(int control, int target) {
        return new GateSpec(GateKind.CNOT, List.of(target), List.of(control), Map.of(), null);
    }

    @Test
    void toJson_bell_isDeterministicCompactJson() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(cnot(0, 1)))));
        assertEquals(
                "{\"version\":1,\"numQubits\":2,\"levels\":["
                + "{\"gates\":[{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{}}]},"
                + "{\"gates\":[{\"kind\":\"CNOT\",\"targets\":[1],\"controls\":[0],\"params\":{}}]}"
                + "]}",
                CircuitSpecJson.toJson(spec));
    }

    @Test
    void toJson_parametric_sortsParamKeys() {
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                new GateSpec(GateKind.U3, List.of(0), List.of(),
                        Map.of("theta", 1.5, "phi", 0.5, "lambda", 0.25), null)))));
        // keys emitted alphabetically: lambda, phi, theta
        assertEquals(
                "{\"version\":1,\"numQubits\":1,\"levels\":["
                + "{\"gates\":[{\"kind\":\"U3\",\"targets\":[0],\"controls\":[],"
                + "\"params\":{\"lambda\":0.25,\"phi\":0.5,\"theta\":1.5}}]}"
                + "]}",
                CircuitSpecJson.toJson(spec));
    }

    @Test
    void toJson_matrixGate_emitsMatrix() {
        List<List<ComplexCell>> m = List.of(
                List.of(new ComplexCell(0.0, 0.0), new ComplexCell(1.0, 0.0)),
                List.of(new ComplexCell(1.0, 0.0), new ComplexCell(0.0, 0.0)));
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                new GateSpec(GateKind.GENERIC, List.of(0), List.of(), Map.of(), m)))));
        assertEquals(
                "{\"version\":1,\"numQubits\":1,\"levels\":["
                + "{\"gates\":[{\"kind\":\"GENERIC\",\"targets\":[0],\"controls\":[],\"params\":{},"
                + "\"matrix\":[[{\"re\":0.0,\"im\":0.0},{\"re\":1.0,\"im\":0.0}],"
                + "[{\"re\":1.0,\"im\":0.0},{\"re\":0.0,\"im\":0.0}]]}]}"
                + "]}",
                CircuitSpecJson.toJson(spec));
    }

    @Test
    void toJson_nonFiniteNumber_isRejected() {
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                new GateSpec(GateKind.RX, List.of(0), List.of(),
                        Map.of("theta", Double.NaN), null)))));
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.toJson(spec));
    }
}
