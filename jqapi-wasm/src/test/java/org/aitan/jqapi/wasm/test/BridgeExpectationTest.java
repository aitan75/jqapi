package org.aitan.jqapi.wasm.test;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.aitan.jqapi.wasm.JqapiBridge;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Issue #108 phase F: observable expectation exports of the browser bridge. */
public class BridgeExpectationTest {

    static final String BELL = "{\"version\":1,\"numQubits\":2,\"levels\":["
            + "{\"gates\":[{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{}}]},"
            + "{\"gates\":[{\"kind\":\"CNOT\",\"targets\":[1],\"controls\":[0],\"params\":{}}]}]}";

    static final String SPREAD_BELL = "{\"version\":1,\"numQubits\":3,\"levels\":["
            + "{\"gates\":[{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{}}]},"
            + "{\"gates\":[{\"kind\":\"CNOT\",\"targets\":[2],\"controls\":[0],\"params\":{}}]}]}";

    static final String MEASURED = "{\"version\":2,\"numQubits\":1,\"numClassicalBits\":1,\"levels\":["
            + "{\"gates\":[{\"kind\":\"X\",\"targets\":[0],\"controls\":[]}]},"
            + "{\"gates\":[{\"kind\":\"MEASUREMENT\",\"targets\":[0],\"controls\":[],\"classicalTarget\":0}]}]}";

    static String observable(int numQubits, Object... coeffAndLabel) {
        StringBuilder sb = new StringBuilder("{\"numQubits\":").append(numQubits).append(",\"terms\":[");
        for (int i = 0; i < coeffAndLabel.length; i += 2) {
            if (i > 0) sb.append(',');
            sb.append("{\"coeff\":").append(coeffAndLabel[i]).append(",\"pauli\":\"").append(coeffAndLabel[i + 1]).append("\"}");
        }
        return sb.append("]}").toString();
    }

    static double number(String json, String key, int occurrence) {
        Matcher m = Pattern.compile("\"" + key + "\":(-?[0-9.eE+-]+)").matcher(json);
        for (int i = 0; i <= occurrence; i++) assertTrue(m.find(), key + " #" + occurrence + " in " + json);
        return Double.parseDouble(m.group(1));
    }

    private static String error(String code) {
        return "{\"ok\":false,\"error\":{\"code\":\"" + code + "\"}}";
    }

    @Test
    void exactExpectationOfBellCorrelations() {
        String result = JqapiBridge.expectation(BELL, observable(2, 1, "ZZ", 1, "XX", 1, "YY"));
        assertTrue(result.startsWith("{\"ok\":true,\"value\":"), result);
        assertEquals(1, number(result, "value", 0), 1e-12);
        assertEquals(1, number(result, "value", 1), 1e-12);
        assertEquals(1, number(result, "value", 2), 1e-12);
        assertEquals(-1, number(result, "value", 3), 1e-12);
        assertTrue(result.contains("\"coeff\":1.0,\"pauli\":\"YY\",\"value\":"), result);

        String spread = JqapiBridge.expectation(SPREAD_BELL, observable(3, 1, "ZIZ"));
        assertEquals(1, number(spread, "value", 0), 1e-12);

        String weighted = JqapiBridge.expectation(BELL, observable(2, 0.5, "ZZ", -0.25, "XX"));
        assertEquals(0.25, number(weighted, "value", 0), 1e-12);
    }

    @Test
    void sampledExpectationIsDeterministicOnEigenstates() {
        assertEquals("{\"ok\":true,\"value\":1.5,\"standardError\":0.0,\"totalShots\":100,\"terms\":["
                        + "{\"coeff\":1.0,\"pauli\":\"ZZ\",\"shots\":100,\"mean\":1.0,\"variance\":0.0},"
                        + "{\"coeff\":0.5,\"pauli\":\"II\",\"shots\":0,\"mean\":1.0,\"variance\":0.0}]}",
                JqapiBridge.sampleExpectation(BELL, observable(2, 1, "ZZ", 0.5, "II"), 100));
        String measured = JqapiBridge.sampleExpectation(MEASURED, observable(1, 1, "Z"), 10);
        assertEquals(-1, number(measured, "value", 0), 0);
    }

    @Test
    void exactExpectationRejectsNonUnitaryCircuits() {
        assertEquals(error("NON_UNITARY_CIRCUIT"), JqapiBridge.expectation(MEASURED, observable(1, 1, "Z")));
        String reset = MEASURED.replace("\"kind\":\"MEASUREMENT\",\"targets\":[0],\"controls\":[],\"classicalTarget\":0",
                "\"kind\":\"RESET\",\"targets\":[0],\"controls\":[]");
        assertEquals(error("NON_UNITARY_CIRCUIT"), JqapiBridge.expectation(reset, observable(1, 1, "Z")));
    }

    @Test
    void mapsInvalidInputsToStableErrorCodes() {
        String z = observable(1, 1, "Z");
        String x = "{\"version\":1,\"numQubits\":1,\"levels\":[]}";
        assertEquals(error("INVALID_CIRCUIT_SPEC"), JqapiBridge.expectation("{}", z));
        assertEquals(error("INVALID_CIRCUIT_SPEC"), JqapiBridge.sampleExpectation("{}", z, 10));
        assertEquals(error("UNSUPPORTED_SPEC_VERSION"), JqapiBridge.expectation(x.replace("\"version\":1", "\"version\":99"), z));
        for (String bad : new String[]{"", "{}", "not json", observable(2, 1, "ZZ"), observable(1, 1, "Q"),
                observable(1, "1e999", "Z"), "{\"numQubits\":1,\"terms\":[]}"}) {
            assertEquals(error("INVALID_OBSERVABLE"), JqapiBridge.expectation(x, bad), bad);
            assertEquals(error("INVALID_OBSERVABLE"), JqapiBridge.sampleExpectation(x, bad, 10), bad);
        }
        for (int shots : new int[]{-1, 0, 1, JqapiBridge.MAX_SHOTS + 1}) {
            assertEquals(error("INVALID_SHOT_COUNT"), JqapiBridge.sampleExpectation("not json", "not json", shots));
        }
    }

    @Test
    void mapsResourceLimitsToInputLimitExceeded() {
        Object[] terms = new Object[2 * 1025];
        for (int i = 0; i < 1025; i++) {
            terms[2 * i] = 1;
            terms[2 * i + 1] = "Z";
        }
        String x = "{\"version\":1,\"numQubits\":1,\"levels\":[]}";
        assertEquals(error("INPUT_LIMIT_EXCEEDED"), JqapiBridge.expectation(x, observable(1, terms)));
        String wide = "{\"version\":1,\"numQubits\":24,\"levels\":[]}";
        assertEquals(error("INPUT_LIMIT_EXCEEDED"),
                JqapiBridge.sampleExpectation(wide, observable(24, 1, "Z" + "I".repeat(23)), JqapiBridge.MAX_SHOTS));
        Object[] sixty = new Object[2 * 60];
        for (int i = 0; i < 60; i++) {
            sixty[2 * i] = 1;
            sixty[2 * i + 1] = "Z" + "I".repeat(23);
        }
        // Rejected from the inputs alone, before a 2^24-amplitude state is allocated.
        assertEquals(error("INPUT_LIMIT_EXCEEDED"), JqapiBridge.expectation(wide, observable(24, sixty)));
    }

    @Test
    void neverSerializesNonFiniteNumbers() {
        String x = "{\"version\":1,\"numQubits\":1,\"levels\":[]}";
        String huge = observable(1, "1e308", "I", "1e308", "I");
        assertEquals(error("INPUT_LIMIT_EXCEEDED"), JqapiBridge.expectation(x, huge));
        assertEquals(error("INPUT_LIMIT_EXCEEDED"), JqapiBridge.sampleExpectation(x, huge, 10));
    }
}
