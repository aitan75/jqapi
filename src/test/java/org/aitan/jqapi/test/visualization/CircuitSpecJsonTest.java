package org.aitan.jqapi.test.visualization;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.exceptions.JQApiLimitException;
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

    @Test
    void roundTrip_bell() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(cnot(0, 1)))));
        assertEquals(spec, CircuitSpecJson.fromJson(CircuitSpecJson.toJson(spec)));
    }

    @Test
    void roundTrip_parametricAndMatrix() {
        List<List<ComplexCell>> m = List.of(
                List.of(new ComplexCell(0.0, 0.0), new ComplexCell(1.0, 0.0)),
                List.of(new ComplexCell(1.0, 0.0), new ComplexCell(0.0, 0.0)));
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(
                        new GateSpec(GateKind.RX, List.of(0), List.of(), Map.of("theta", 1.25), null),
                        new GateSpec(GateKind.GENERIC, List.of(1), List.of(), Map.of(), m)))));
        assertEquals(spec, CircuitSpecJson.fromJson(CircuitSpecJson.toJson(spec)));
    }

    @Test
    void roundTrip_ignoresInsignificantWhitespace() {
        CircuitSpec spec = CircuitSpecJson.fromJson(
                "{ \"version\": 1, \"numQubits\": 1, \"levels\": [ "
                + "{ \"gates\": [ { \"kind\": \"H\", \"targets\": [ 0 ], "
                + "\"controls\": [], \"params\": {} } ] } ] }");
        assertEquals(GateKind.H, spec.levels().get(0).gates().get(0).kind());
    }

    @Test
    void fromJson_trailingGarbage_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson("{\"version\":1,\"numQubits\":1,\"levels\":[]} X"));
    }

    @Test
    void fromJson_wrongType_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson("{\"version\":1,\"numQubits\":\"two\",\"levels\":[]}"));
    }

    @Test
    void fromJson_unknownKind_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"NOPE\",\"targets\":[0],\"controls\":[],\"params\":{}}]}]}"));
    }

    @Test
    void fromJson_numQubitsOverMax_rejected() {
        assertThrows(JQApiLimitException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":9999,\"levels\":[]}"));
    }

    @Test
    void fromJson_numQubitsNonPositive_rejected() {
        assertThrows(JQApiLimitException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":0,\"levels\":[]}"));
    }

    @Test
    void fromJson_indexOutOfRange_rejected() {
        assertThrows(JQApiLimitException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"H\",\"targets\":[5],\"controls\":[],\"params\":{}}]}]}"));
    }

    @Test
    void fromJson_matrixWrongDimension_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"GENERIC\",\"targets\":[0],\"controls\":[],\"params\":{},"
                + "\"matrix\":[[{\"re\":1.0,\"im\":0.0}]]}]}]}"));
    }

    @Test
    void fromJson_matrixGateWithOverflowingTargetCount_rejected() {
        // 32 duplicate targets would overflow 1<<numTargets to 1 and wrongly accept a 1x1 matrix
        StringBuilder targets = new StringBuilder();
        for (int i = 0; i < 32; i++) {
            if (i > 0) {
                targets.append(',');
            }
            targets.append('0');
        }
        String json = "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"GENERIC\",\"targets\":[" + targets + "],\"controls\":[],\"params\":{},"
                + "\"matrix\":[[{\"re\":1.0,\"im\":0.0}]]}]}]}";
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(json));
    }

    @Test
    void fromJson_controlTargetOverlap_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"CNOT\",\"targets\":[0],\"controls\":[0],\"params\":{}}]}]}"));
    }

    @Test
    void fromJson_tooManyGates_rejected() {
        StringBuilder sb = new StringBuilder("{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":[");
        for (int i = 0; i <= CircuitSpecJson.MAX_GATES; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{}}");
        }
        sb.append("]}]}");
        String json = sb.toString();
        assertThrows(org.aitan.jqapi.exceptions.JQApiLimitException.class,
                () -> CircuitSpecJson.fromJson(json));
    }
}
