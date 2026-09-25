package org.aitan.jqapi.observable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.utils.JsonParser;
import static org.aitan.jqapi.utils.JsonParser.asArray;
import static org.aitan.jqapi.utils.JsonParser.asDouble;
import static org.aitan.jqapi.utils.JsonParser.asInt;
import static org.aitan.jqapi.utils.JsonParser.asObject;
import static org.aitan.jqapi.utils.JsonParser.asString;

/**
 * Deterministic JSON for {@link PauliSum}, an execution input kept separate from
 * {@code CircuitSpec}:
 * <pre>{"numQubits":3,"terms":[{"coeff":0.5,"pauli":"XIZ"}]}</pre>
 * Label character 0 is qubit 0 (the most significant bit). Unknown fields are
 * rejected.
 */
public final class PauliSumJson {

    /** Upper bound on terms accepted from untrusted input. */
    public static final int MAX_TERMS = 1024;

    /** Upper bound on raw JSON input length accepted from untrusted input. */
    public static final int MAX_JSON_LENGTH = 1 << 20;

    private static final int MAX_JSON_DEPTH = 8;
    private static final Set<String> ROOT_FIELDS = Set.of("numQubits", "terms");
    private static final Set<String> TERM_FIELDS = Set.of("coeff", "pauli");

    private PauliSumJson() {
    }

    /**
     * @param observable the sum to serialize
     * @return compact JSON with terms in order
     */
    public static String toJson(PauliSum observable) {
        Objects.requireNonNull(observable, "observable");
        StringBuilder sb = new StringBuilder("{\"numQubits\":").append(observable.numQubits()).append(",\"terms\":[");
        for (int i = 0; i < observable.terms().size(); i++) {
            PauliSum.Term term = observable.terms().get(i);
            if (i > 0) sb.append(',');
            sb.append("{\"coeff\":").append(term.coeff()).append(",\"pauli\":\"").append(term.pauli()).append("\"}");
        }
        return sb.append("]}").toString();
    }

    /**
     * @param json the JSON to parse
     * @param config configuration whose {@code maxQubits} bounds {@code numQubits}
     * @return the parsed, validated sum
     * @throws IllegalArgumentException on malformed JSON or an invalid observable
     * @throws JQApiLimitException on oversized input, term count or qubit count
     */
    public static PauliSum fromJson(String json, JQAPIConfig config) {
        Objects.requireNonNull(json, "json");
        Objects.requireNonNull(config, "config");
        if (json.length() > MAX_JSON_LENGTH) {
            throw new JQApiLimitException("Observable JSON exceeds " + MAX_JSON_LENGTH + " characters");
        }
        Map<String, Object> root = asObject(JsonParser.parse(json, MAX_JSON_DEPTH), "observable");
        requireFields(root, ROOT_FIELDS, "observable");
        int numQubits = asInt(root.get("numQubits"), "numQubits");
        if (numQubits < 1 || numQubits > config.maxQubits()) {
            throw new JQApiLimitException("numQubits out of range (1.." + config.maxQubits() + "): " + numQubits);
        }
        List<Object> termsJson = asArray(root.get("terms"), "terms");
        if (termsJson.size() > MAX_TERMS) {
            throw new JQApiLimitException("too many observable terms (max " + MAX_TERMS + ")");
        }
        List<PauliSum.Term> terms = new ArrayList<>(termsJson.size());
        for (Object termJson : termsJson) {
            Map<String, Object> term = asObject(termJson, "term");
            requireFields(term, TERM_FIELDS, "term");
            String label = asString(term.get("pauli"), "pauli");
            if (label.length() != numQubits) {
                throw new IllegalArgumentException("Pauli label length must equal numQubits");
            }
            terms.add(new PauliSum.Term(asDouble(term.get("coeff"), "coeff"), PauliString.fromLabel(label)));
        }
        return PauliSum.of(terms);
    }

    private static void requireFields(Map<String, Object> object, Set<String> fields, String what) {
        if (!object.keySet().equals(fields)) {
            throw new IllegalArgumentException(what + " must have exactly the fields " + fields);
        }
    }
}
