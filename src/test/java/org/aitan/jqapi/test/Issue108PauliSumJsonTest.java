package org.aitan.jqapi.test;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.observable.PauliSum.Term;
import org.aitan.jqapi.observable.PauliSumJson;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Issue #108 phase D2: execution-time observable JSON, kept separate from CircuitSpec. */
class Issue108PauliSumJsonTest {

    private static final JQAPIConfig CONFIG = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);

    private static PauliSum parse(String json) {
        return PauliSumJson.fromJson(json, CONFIG);
    }

    @Test
    void roundTripsWithDeterministicOutput() {
        PauliSum h = PauliSum.of(
                new Term(0.5, PauliString.fromLabel("XIZ")),
                new Term(-1.25e-3, PauliString.fromLabel("YYI")),
                new Term(1, PauliString.fromLabel("III")));
        String json = PauliSumJson.toJson(h);
        assertEquals("{\"numQubits\":3,\"terms\":[{\"coeff\":0.5,\"pauli\":\"XIZ\"},"
                + "{\"coeff\":-0.00125,\"pauli\":\"YYI\"},{\"coeff\":1.0,\"pauli\":\"III\"}]}", json);
        assertEquals(h, parse(json));
    }

    @Test
    void acceptsWhitespaceAndIntegerCoefficients() {
        PauliSum h = parse(" { \"terms\" : [ { \"pauli\" : \"ZZ\" , \"coeff\" : 2 } ] , \"numQubits\" : 2 } ");
        assertEquals(PauliSum.of(new Term(2, PauliString.fromLabel("ZZ"))), h);
    }

    @Test
    void rejectsMalformedOrInvalidObservables() {
        String[] invalid = {
            "",
            "not json",
            "[]",
            "{\"numQubits\":1}",
            "{\"numQubits\":1,\"terms\":[]}",
            "{\"numQubits\":1,\"terms\":{}}",
            "{\"terms\":[{\"coeff\":1,\"pauli\":\"Z\"}]}",
            "{\"numQubits\":1.5,\"terms\":[{\"coeff\":1,\"pauli\":\"Z\"}]}",
            "{\"numQubits\":2,\"terms\":[{\"coeff\":1,\"pauli\":\"Z\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1,\"pauli\":\"Q\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1,\"pauli\":\"z\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":\"1\",\"pauli\":\"Z\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1e999,\"pauli\":\"Z\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1}]}",
            "{\"numQubits\":1,\"terms\":[{\"pauli\":\"Z\"}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1,\"pauli\":\"Z\",\"extra\":0}]}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1,\"pauli\":\"Z\"}],\"version\":1}",
            "{\"numQubits\":1,\"terms\":[{\"coeff\":1,\"pauli\":\"Z\"}]} trailing",
        };
        for (String json : invalid) {
            IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> parse(json), json);
            assertFalse(error instanceof JQApiLimitException, "not a limit error: " + json);
        }
        assertThrows(NullPointerException.class, () -> parse(null));
        assertThrows(NullPointerException.class, () -> PauliSumJson.fromJson("{}", null));
        assertThrows(NullPointerException.class, () -> PauliSumJson.toJson(null));
    }

    @Test
    void enforcesResourceLimits() {
        assertThrows(JQApiLimitException.class, () -> parse("{\"numQubits\":0,\"terms\":[]}"));
        assertThrows(JQApiLimitException.class,
                () -> PauliSumJson.fromJson("{\"numQubits\":3,\"terms\":[{\"coeff\":1,\"pauli\":\"ZZZ\"}]}", JQAPIConfig.sequential(2)));
        StringBuilder many = new StringBuilder("{\"numQubits\":1,\"terms\":[");
        for (int i = 0; i <= PauliSumJson.MAX_TERMS; i++) many.append(i == 0 ? "" : ",").append("{\"coeff\":1,\"pauli\":\"Z\"}");
        String tooMany = many.append("]}").toString();
        assertThrows(JQApiLimitException.class, () -> parse(tooMany));
        String atLimit = tooMany.replaceFirst("\\{\"coeff\":1,\"pauli\":\"Z\"},", "");
        assertEquals(PauliSumJson.MAX_TERMS, parse(atLimit).terms().size());
        assertThrows(JQApiLimitException.class, () -> parse(" ".repeat(PauliSumJson.MAX_JSON_LENGTH + 1)));
    }
}
