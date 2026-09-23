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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class CircuitSpecJsonTest {
    @Test
    void roundTrip_escapesParameterKeys() {
        String key = "quote\" slash\\ controls\b\f\n\r\t" + (char) 0 + (char) 31 + " 😀";
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                new GateSpec(GateKind.H, List.of(0), List.of(), Map.of(key, 1.0), null)))));
        String json = CircuitSpecJson.toJson(spec);
        assertTrue(json.contains("quote\\\" slash\\\\ controls\\b\\f\\n\\r\\t\\u0000\\u001f 😀"));
        assertEquals(spec, CircuitSpecJson.fromJson(json));
    }

    @ParameterizedTest
    @ValueSource(ints = {0xD800, 0xDC00})
    void toJson_unpairedSurrogateKey_rejected(int codeUnit) {
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                new GateSpec(GateKind.H, List.of(0), List.of(),
                        Map.of("a" + (char) codeUnit + "b", 1.0), null)))));
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.toJson(spec));
    }

    @ParameterizedTest
    @ValueSource(strings = {"+1", "01", "-01", ".1", "1.", "1.e2", "1e", "1e+", "--1", "0x1p0"})
    void fromJson_invalidNumberGrammar_rejected(String number) {
        String json = specWithParamKey("\"theta\"").replace(":1.0", ":" + number);
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(json));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-0", "1.25", "-0.25", "1e2", "1E+2", "1e-2"})
    void fromJson_validNumberGrammar_accepted(String number) {
        String json = specWithParamKey("\"theta\"").replace(":1.0", ":" + number);
        double actual = CircuitSpecJson.fromJson(json).levels().getFirst().gates().getFirst().params().get("theta");
        assertEquals(Double.parseDouble(number), actual);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 9, 10, 13, 31})
    void fromJson_unescapedControlCharacter_rejected(int codeUnit) {
        String json = specWithParamKey("\"a" + (char) codeUnit + "b\"");
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(json));
    }

    @ParameterizedTest
    @ValueSource(strings = {"\u000b", "\u2003"})
    void fromJson_nonJsonWhitespace_rejected(String whitespace) {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                whitespace + "{\"version\":1,\"numQubits\":1,\"levels\":[]}"));
    }

    @Test
    void fromJson_allJsonWhitespace_accepted() {
        assertEquals(CircuitSpec.of(1, List.of()), CircuitSpecJson.fromJson(
                " \t\r\n{\"version\":2,\"numQubits\":1,\"levels\":[]} \t\r\n"));
    }


    private static GateSpec cnot(int control, int target) {
        return new GateSpec(GateKind.CNOT, List.of(target), List.of(control), Map.of(), null);
    }

    @Test
    void toJson_bell_isDeterministicCompactJson() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(cnot(0, 1)))));
        assertEquals(
                "{\"version\":2,\"numQubits\":2,\"levels\":["
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
                "{\"version\":2,\"numQubits\":1,\"levels\":["
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
                "{\"version\":2,\"numQubits\":1,\"levels\":["
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
    void fromJson_duplicateTargets_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":2,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"SWAP\",\"targets\":[0,0],\"controls\":[],\"params\":{}}]}]}"));
    }

    @Test
    void fromJson_duplicateControls_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(
                "{\"version\":1,\"numQubits\":2,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"TOFFOLI\",\"targets\":[1],\"controls\":[0,0],\"params\":{}}]}]}"));
    }

    @Test
    void fromJson_tooManyLevels_rejected() {
        StringBuilder sb = new StringBuilder("{\"version\":1,\"numQubits\":1,\"levels\":[");
        for (int i = 0; i <= CircuitSpecJson.MAX_LEVELS; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"gates\":[]}");
        }
        sb.append("]}");
        assertThrows(JQApiLimitException.class, () -> CircuitSpecJson.fromJson(sb.toString()));
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

    @Test
    void fromJson_oversizedInput_rejected() {
        String json = "x".repeat(CircuitSpecJson.MAX_JSON_LENGTH + 1);
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(json));
    }

    @Test
    void fromJson_deeplyNested_rejected() {
        int n = CircuitSpecJson.MAX_JSON_DEPTH + 1;
        String json = "[".repeat(n) + "]".repeat(n);
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(json));
    }

    @Test
    void fromJson_unterminatedEscape_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson("\"\\"));
    }

    @Test
    void fromJson_truncatedUnicodeEscape_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson("\"\\u12"));
    }

    @Test
    void fromJson_invalidUnicodeEscape_rejected() {
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson("\"\\uZZZZ\""));
    }

    @Test
    void fromJson_signedUnicodeEscape_rejected() {
        // Integer.parseInt("+123", 16) would otherwise accept the sign prefix.
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson(specWithParamKey("\"\\u+123\"")));
    }

    @Test
    void fromJson_loneHighSurrogateEscape_rejected() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson(specWithParamKey("\"\\uD800\"")));
        assertTrue(e.getMessage().contains("surrogate"), e.getMessage());
    }

    @Test
    void fromJson_loneLowSurrogateEscape_rejected() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson(specWithParamKey("\"\\uDC00\"")));
        assertTrue(e.getMessage().contains("surrogate"), e.getMessage());
    }

    @Test
    void fromJson_highSurrogateEscapeWithoutLowSurrogate_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson(specWithParamKey("\"\\uD83Dx\"")));
    }

    @Test
    void fromJson_rawLoneSurrogate_rejected() {
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSpecJson.fromJson(specWithParamKey("\"a" + (char) 0xD800 + "\"")));
    }

    @Test
    void fromJson_validSurrogatePairEscape_accepted() {
        CircuitSpec spec = CircuitSpecJson.fromJson(specWithParamKey("\"\\uD83D\\uDE00\""));
        Map<String, Double> params = spec.levels().get(0).gates().get(0).params();
        assertTrue(params.containsKey("\uD83D\uDE00"), params.keySet().toString());
    }

    @Test
    void fromJson_supportedEscapes_retainBehavior() {
        CircuitSpec spec = CircuitSpecJson.fromJson(
                specWithParamKey("\"line\\nbreak\\ttab\\\"quote\\/slash\""));
        Map<String, Double> params = spec.levels().get(0).gates().get(0).params();
        assertTrue(params.containsKey("line\nbreak\ttab\"quote/slash"), params.keySet().toString());
    }

    /** A minimal schema-valid spec whose single gate carries the given JSON key. */
    private static String specWithParamKey(String jsonKey) {
        return "{\"version\":1,\"numQubits\":1,\"levels\":[{\"gates\":"
                + "[{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{" + jsonKey + ":1.0}}]}]}";
    }
}
