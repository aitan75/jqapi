package org.aitan.jqapi.visualization.spec;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.classical.Condition;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;

/**
 * Zero-dependency, deterministic JSON (de)serialization for {@link CircuitSpec}.
 * The shared on-the-wire format between the Java simulator and the browser
 * editor (and for save/load / URL-sharing). Hand-rolled so the core keeps its
 * zero-dependency guarantee and stays within TeaVM's supported {@code java.*}.
 *
 * @author Gaetano Ferrara
 */
public final class CircuitSpecJson {

    /** Upper bound on total gate placements accepted from untrusted input. */
    public static final int MAX_GATES = 100_000;

    /** Upper bound on levels accepted from untrusted input (bounds empty-level floods). */
    public static final int MAX_LEVELS = 100_000;

    /** Upper bound on raw JSON input length accepted from untrusted sources. */
    public static final int MAX_JSON_LENGTH = 16 * 1024 * 1024;

    /** Maximum JSON nesting depth (a valid CircuitSpec nests at most ~8 deep). */
    public static final int MAX_JSON_DEPTH = 200;

    private CircuitSpecJson() {
    }

    /**
     * Serializes a spec to compact, deterministic JSON (fixed key order; param
     * keys sorted).
     *
     * @param spec the spec to serialize
     * @return its JSON representation
     * @throws IllegalArgumentException if any number is non-finite (NaN/Infinity)
     *         or a parameter key contains an unpaired surrogate
     */
    public static String toJson(CircuitSpec spec) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"version\":").append(spec.version())
                .append(",\"numQubits\":").append(spec.numQubits())
                .append(",\"levels\":[");
        List<LevelSpec> levels = spec.levels();
        for (int i = 0; i < levels.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            writeLevel(sb, levels.get(i));
        }
        sb.append("]}");
        writeRecords(sb, spec.measurementRecords());
        writeConditions(sb, spec.conditions());
        sb.append('}');
        return sb.toString();
    }

    private static void writeLevel(StringBuilder sb, LevelSpec level) {
        sb.append("{\"gates\":[");
        List<GateSpec> gates = level.gates();
        for (int i = 0; i < gates.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            writeGate(sb, gates.get(i));
        }
        sb.append("]}");
    }

    private static void writeGate(StringBuilder sb, GateSpec g) {
        sb.append("{\"kind\":\"").append(g.kind().name()).append('"');
        sb.append(",\"targets\":");
        writeIntList(sb, g.targets());
        sb.append(",\"controls\":");
        writeIntList(sb, g.controls());
        sb.append(",\"params\":");
        writeParams(sb, g.params());
        if (g.matrix() != null) {
            sb.append(",\"matrix\":");
            writeMatrix(sb, g.matrix());
        }
        sb.append('}');
    }

    private static void writeIntList(StringBuilder sb, List<Integer> xs) {
        sb.append('[');
        for (int i = 0; i < xs.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(xs.get(i).intValue());
        }
        sb.append(']');
    }

    private static void writeParams(StringBuilder sb, Map<String, Double> params) {
        sb.append('{');
        boolean first = true;
        // Empty and single-parameter gates are already ordered.
        Map<String, Double> ordered = params.size() < 2 ? params : new TreeMap<>(params);
        for (Map.Entry<String, Double> e : ordered.entrySet()) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            writeString(sb, e.getKey());
            sb.append(':').append(num(e.getValue()));
        }
        sb.append('}');
    }

    private static void writeString(StringBuilder sb, String value) {
        sb.append('"');
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append("\\u00");
                        sb.append("0123456789abcdef".charAt(c >> 4));
                        sb.append("0123456789abcdef".charAt(c & 0xf));
                    } else if (Character.isHighSurrogate(c)) {
                        if (i + 1 >= value.length() || !Character.isLowSurrogate(value.charAt(i + 1))) {
                            throw new IllegalArgumentException("lone high surrogate cannot be serialized");
                        }
                        sb.append(c).append(value.charAt(++i));
                    } else if (Character.isLowSurrogate(c)) {
                        throw new IllegalArgumentException("lone low surrogate cannot be serialized");
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
    }

    private static void writeMatrix(StringBuilder sb, List<List<ComplexCell>> m) {
        sb.append('[');
        for (int r = 0; r < m.size(); r++) {
            if (r > 0) {
                sb.append(',');
            }
            sb.append('[');
            List<ComplexCell> row = m.get(r);
            for (int c = 0; c < row.size(); c++) {
                if (c > 0) {
                    sb.append(',');
                }
                ComplexCell cell = row.get(c);
                sb.append("{\"re\":").append(num(cell.re()))
                        .append(",\"im\":").append(num(cell.im())).append('}');
            }
            sb.append(']');
        }
        sb.append(']');
    }

    /**
     * Parses and validates a spec from JSON. Rejects malformed structure and
     * out-of-bounds values at this boundary (the untrusted-input boundary for
     * the browser editor).
     *
     * @param json the JSON produced by {@link #toJson(CircuitSpec)} or an editor
     * @return the parsed, validated spec
     * @throws IllegalArgumentException on malformed JSON or invalid structure
     * @throws JQApiLimitException on out-of-range qubit counts/indexes
     */
    public static CircuitSpec fromJson(String json) {
        return fromJson(json, JQAPIConfig.getDefault());
    }

    /**
     * As {@link #fromJson(String)} but validating {@code numQubits} against an
     * explicit configuration's {@code maxQubits}. Lets single-threaded runtimes
     * (the WASM/JS build, issue #5 phase 2b) pass a {@link
     * JQAPIConfig#sequential(int)} config so the default (parallel) configuration
     * is never reached.
     *
     * @param json the JSON to parse
     * @param config the configuration whose {@code maxQubits} bounds the spec
     * @return the parsed, validated spec
     * @throws IllegalArgumentException on malformed JSON or invalid structure
     * @throws JQApiLimitException on out-of-range qubit counts/indexes
     */
    public static CircuitSpec fromJson(String json, JQAPIConfig config) {
        if (json.length() > MAX_JSON_LENGTH) {
            throw new IllegalArgumentException("JSON input too large: " + json.length() + " characters");
        }
        Object tree = new JsonParser(json).parse();
        return mapCircuit(tree, config.maxQubits());
    }

    private static CircuitSpec mapCircuit(Object tree, int maxQubits) {
        Map<String, Object> root = asObject(tree, "root");
        int version = asInt(root.get("version"), "version");
        int numQubits = asInt(root.get("numQubits"), "numQubits");
        if (numQubits <= 0 || numQubits > maxQubits) {
            throw new JQApiLimitException("numQubits out of range (1.." + maxQubits + "): " + numQubits);
        }
        List<Object> levelsJson = asArray(root.get("levels"), "levels");
        if (levelsJson.size() > MAX_LEVELS) {
            throw new JQApiLimitException("too many levels (max " + MAX_LEVELS + ")");
        }
        List<LevelSpec> levels = new ArrayList<>(levelsJson.size());
        int gateCount = 0;
        for (Object lo : levelsJson) {
            Map<String, Object> lm = asObject(lo, "level");
            List<Object> gatesJson = asArray(lm.get("gates"), "gates");
            List<GateSpec> gates = new ArrayList<>(gatesJson.size());
            for (Object go : gatesJson) {
                if (++gateCount > MAX_GATES) {
                    throw new JQApiLimitException("too many gates (max " + MAX_GATES + ")");
                }
                gates.add(mapGate(go, numQubits));
            }
            levels.add(new LevelSpec(gates));
        }
        List<ClassicalRecord> measurementRecords = mapRecords(root.get("measurementRecords"));
        List<Condition> conditions = mapConditions(root.get("conditions"));
        return new CircuitSpec(version, numQubits, levels, measurementRecords, conditions);
    }

    private static GateSpec mapGate(Object go, int numQubits) {
        Map<String, Object> gm = asObject(go, "gate");
        GateKind kind;
        try {
            kind = GateKind.valueOf(asString(gm.get("kind"), "kind"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("unknown gate kind: " + gm.get("kind"));
        }
        List<Integer> targets = mapIndexes(gm.get("targets"), numQubits, "targets");
        List<Integer> controls = mapIndexes(gm.get("controls"), numQubits, "controls");
        for (int c : controls) {
            if (targets.contains(c)) {
                throw new IllegalArgumentException("control and target overlap on qubit " + c);
            }
        }
        Map<String, Double> params = mapParams(gm.get("params"));
        List<List<ComplexCell>> matrix = mapMatrix(gm.get("matrix"), targets.size());
        return new GateSpec(kind, targets, controls, params, matrix);
    }

    private static List<Integer> mapIndexes(Object o, int numQubits, String field) {
        List<Object> arr = asArray(o, field);
        List<Integer> out = new ArrayList<>(arr.size());
        Set<Integer> seen = new HashSet<>();
        for (Object x : arr) {
            int idx = asInt(x, field + " element");
            if (idx < 0 || idx >= numQubits) {
                throw new JQApiLimitException(field + " index out of range [0," + numQubits + "): " + idx);
            }
            if (!seen.add(idx)) {
                throw new IllegalArgumentException("duplicate " + field + " index: " + idx);
            }
            out.add(idx);
        }
        return out;
    }

    private static Map<String, Double> mapParams(Object o) {
        if (o == null) {
            return Map.of();
        }
        Map<String, Object> pm = asObject(o, "params");
        Map<String, Double> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> e : pm.entrySet()) {
            out.put(e.getKey(), asDouble(e.getValue(), "param " + e.getKey()));
        }
        return out;
    }

    private static List<List<ComplexCell>> mapMatrix(Object o, int numTargets) {
        if (o == null) {
            return null;
        }
        if (numTargets > 30) {
            throw new IllegalArgumentException("matrix gate acts on too many qubits: " + numTargets);
        }
        List<Object> rows = asArray(o, "matrix");
        int expected = 1 << numTargets;
        if (rows.size() != expected) {
            throw new IllegalArgumentException("matrix must be " + expected + "x" + expected
                    + ", got " + rows.size() + " rows");
        }
        List<List<ComplexCell>> out = new ArrayList<>(rows.size());
        for (Object ro : rows) {
            List<Object> cols = asArray(ro, "matrix row");
            if (cols.size() != expected) {
                throw new IllegalArgumentException("matrix row must have " + expected
                        + " columns, got " + cols.size());
            }
            List<ComplexCell> row = new ArrayList<>(cols.size());
            for (Object co : cols) {
                Map<String, Object> cell = asObject(co, "matrix cell");
                row.add(new ComplexCell(asDouble(cell.get("re"), "re"), asDouble(cell.get("im"), "im")));
            }
            out.add(row);
        }
        return out;
    }

    private static Map<String, Object> asObject(Object o, String what) {
        if (o instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> mm = (Map<String, Object>) m;
            return mm;
        }
        throw new IllegalArgumentException(what + " must be an object");
    }

    private static List<Object> asArray(Object o, String what) {
        if (o instanceof List<?> l) {
            @SuppressWarnings("unchecked")
            List<Object> ll = (List<Object>) l;
            return ll;
        }
        throw new IllegalArgumentException(what + " must be an array");
    }

    private static String asString(Object o, String what) {
        if (o instanceof String s) {
            return s;
        }
        throw new IllegalArgumentException(what + " must be a string");
    }

    private static double asDouble(Object o, String what) {
        if (o instanceof Double d) {
            if (!Double.isFinite(d)) {
                throw new IllegalArgumentException(what + " must be finite");
            }
            return d;
        }
        throw new IllegalArgumentException(what + " must be a number");
    }

    private static int asInt(Object o, String what) {
        double d = asDouble(o, what);
        if (d != Math.rint(d) || Math.abs(d) > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(what + " must be an integer");
        }
        return (int) d;
    }

    /** Minimal recursive-descent JSON parser producing a generic tree. */
    private static final class JsonParser {
        private final String s;
        private int pos;
        private int depth;

        JsonParser(String s) {
            this.s = s;
        }

        Object parse() {
            Object v = parseValue();
            skipWs();
            if (pos != s.length()) {
                throw err("trailing characters");
            }
            return v;
        }

        private Object parseValue() {
            skipWs();
            if (pos >= s.length()) {
                throw err("unexpected end of input");
            }
            char c = s.charAt(pos);
            return switch (c) {
                case '{' -> parseObject();
                case '[' -> parseArray();
                case '"' -> parseString();
                case 't', 'f' -> parseBool();
                case 'n' -> parseNull();
                default -> parseNumber();
            };
        }

        private Map<String, Object> parseObject() {
            if (++depth > MAX_JSON_DEPTH) {
                throw err("nesting too deep");
            }
            try {
                Map<String, Object> m = new LinkedHashMap<>();
                pos++; // consume '{'
                skipWs();
                if (peek() == '}') {
                    pos++;
                    return m;
                }
                while (true) {
                    skipWs();
                    String key = parseString();
                    skipWs();
                    expect(':');
                    m.put(key, parseValue());
                    skipWs();
                    char c = nextChar();
                    if (c == '}') {
                        return m;
                    }
                    if (c != ',') {
                        throw err("expected ',' or '}'");
                    }
                }
            } finally {
                depth--;
            }
        }

        private List<Object> parseArray() {
            if (++depth > MAX_JSON_DEPTH) {
                throw err("nesting too deep");
            }
            try {
                List<Object> a = new ArrayList<>();
                pos++; // consume '['
                skipWs();
                if (peek() == ']') {
                    pos++;
                    return a;
                }
                while (true) {
                    a.add(parseValue());
                    skipWs();
                    char c = nextChar();
                    if (c == ']') {
                        return a;
                    }
                    if (c != ',') {
                        throw err("expected ',' or ']'");
                    }
                }
            } finally {
                depth--;
            }
        }

        private String parseString() {
            expect('"');
            StringBuilder sb = new StringBuilder();
            while (true) {
                if (pos >= s.length()) {
                    throw err("unterminated string");
                }
                char c = s.charAt(pos++);
                if (c == '"') {
                    return sb.toString();
                }
                if (c == '\\') {
                    if (pos >= s.length()) {
                        throw err("unterminated escape");
                    }
                    char e = s.charAt(pos++);
                    switch (e) {
                        case '"' -> sb.append('"');
                        case '\\' -> sb.append('\\');
                        case '/' -> sb.append('/');
                        case 'n' -> sb.append('\n');
                        case 't' -> sb.append('\t');
                        case 'r' -> sb.append('\r');
                        case 'b' -> sb.append('\b');
                        case 'f' -> sb.append('\f');
                        case 'u' -> appendUnicodeEscape(sb);
                        default -> throw err("invalid escape '\\" + e + "'");
                    }
                } else if (c < 0x20) {
                    throw err("unescaped control character");
                } else if (Character.isHighSurrogate(c)) {
                    //A raw high surrogate must be followed by a raw low surrogate;
                    //an unpaired one is not a valid Unicode scalar value (RFC 8259 8.2).
                    if (pos >= s.length() || !Character.isLowSurrogate(s.charAt(pos))) {
                        throw err("lone high surrogate character");
                    }
                    sb.append(c).append(s.charAt(pos++));
                } else if (Character.isLowSurrogate(c)) {
                    throw err("lone low surrogate character");
                } else {
                    sb.append(c);
                }
            }
        }

        /**
         * Reads and appends the body of a {@code \\uXXXX} escape (the leading
         * {@code \\u} has already been consumed). A high surrogate must be
         * immediately followed by an escaped low surrogate so the pair decodes to
         * a single Unicode scalar value; an unpaired surrogate is rejected because
         * RFC 8259 section 8.2 does not permit it.
         */
        private void appendUnicodeEscape(StringBuilder sb) {
            char ch = (char) readHexCodeUnit();
            if (Character.isHighSurrogate(ch)) {
                if (pos + 2 > s.length() || s.charAt(pos) != '\\' || s.charAt(pos + 1) != 'u') {
                    throw err("lone high surrogate escape");
                }
                pos += 2;
                char low = (char) readHexCodeUnit();
                if (!Character.isLowSurrogate(low)) {
                    throw err("high surrogate escape not followed by a low surrogate");
                }
                sb.append(ch).append(low);
            } else if (Character.isLowSurrogate(ch)) {
                throw err("lone low surrogate escape");
            } else {
                sb.append(ch);
            }
        }

        /**
         * Reads exactly four ASCII hexadecimal digits. Unlike
         * {@link Integer#parseInt(String, int)} this rejects sign prefixes and
         * any non-hex character, and unlike {@link Character#digit(char, int)}
         * it rejects non-ASCII Unicode digits.
         */
        private int readHexCodeUnit() {
            if (pos + 4 > s.length()) {
                throw err("truncated unicode escape");
            }
            int value = 0;
            for (int i = 0; i < 4; i++) {
                int digit = asciiHexDigit(s.charAt(pos + i));
                if (digit < 0) {
                    throw err("invalid unicode escape");
                }
                value = (value << 4) | digit;
            }
            pos += 4;
            return value;
        }

        private static int asciiHexDigit(char c) {
            if (c >= '0' && c <= '9') {
                return c - '0';
            }
            if (c >= 'a' && c <= 'f') {
                return c - 'a' + 10;
            }
            if (c >= 'A' && c <= 'F') {
                return c - 'A' + 10;
            }
            return -1;
        }

        private Double parseNumber() {
            int start = pos;
            consume('-');
            if (!consume('0')) {
                requireDigits();
            }
            if (consume('.')) {
                requireDigits();
            }
            if (consume('e') || consume('E')) {
                if (!consume('+')) {
                    consume('-');
                }
                requireDigits();
            }
            try {
                return Double.parseDouble(s.substring(start, pos));
            } catch (NumberFormatException nfe) {
                throw err("invalid number");
            }
        }

        private boolean consume(char c) {
            if (pos < s.length() && s.charAt(pos) == c) {
                pos++;
                return true;
            }
            return false;
        }

        private void requireDigits() {
            int start = pos;
            while (pos < s.length() && s.charAt(pos) >= '0' && s.charAt(pos) <= '9') {
                pos++;
            }
            if (pos == start) {
                throw err("expected digit");
            }
        }

        private Boolean parseBool() {
            if (s.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            }
            if (s.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            throw err("invalid literal");
        }

        private Object parseNull() {
            if (s.startsWith("null", pos)) {
                pos += 4;
                return null;
            }
            throw err("invalid literal");
        }

        private void skipWs() {
            while (pos < s.length() && " \t\r\n".indexOf(s.charAt(pos)) >= 0) {
                pos++;
            }
        }

        private char peek() {
            skipWs();
            return pos < s.length() ? s.charAt(pos) : '\0';
        }

        private char nextChar() {
            if (pos >= s.length()) {
                throw err("unexpected end of input");
            }
            return s.charAt(pos++);
        }

        private void expect(char c) {
            skipWs();
            if (pos >= s.length() || s.charAt(pos) != c) {
                throw err("expected '" + c + "'");
            }
            pos++;
        }

        private IllegalArgumentException err(String msg) {
            return new IllegalArgumentException("Invalid CircuitSpec JSON at position " + pos + ": " + msg);
        }
    }

    private static void writeRecords(StringBuilder sb, List<ClassicalRecord> records) {
        if (records == null || records.isEmpty()) return;
        sb.append(",\"measurementRecords\":[");
        for (int i = 0; i < records.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"bit\":").append(records.get(i).bit()).append('}');
        }
        sb.append(']');
    }

    private static void writeConditions(StringBuilder sb, List<Condition> conditions) {
        if (conditions == null || conditions.isEmpty()) return;
        sb.append(",\"conditions\":[");
        for (int i = 0; i < conditions.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"record\":{\"bit\":").append(conditions.get(i).record().bit())
              .append("},\"expected\":").append(conditions.get(i).expected()).append('}');
        }
        sb.append(']');
    }

    private static List<ClassicalRecord> mapRecords(Object o) {
        if (o == null) return List.of();
        List<Object> arr = asArray(o, "measurementRecords");
        List<ClassicalRecord> out = new ArrayList<>(arr.size());
        for (Object item : arr) {
            Map<String, Object> m = asObject(item, "measurementRecord");
            out.add(new ClassicalRecord(asInt(m.get("bit"), "bit")));
        }
        return out;
    }

    private static List<Condition> mapConditions(Object o) {
        if (o == null) return List.of();
        List<Object> arr = asArray(o, "conditions");
        List<Condition> out = new ArrayList<>(arr.size());
        for (Object item : arr) {
            Map<String, Object> m = asObject(item, "condition");
            Map<String, Object> recMap = asObject(m.get("record"), "record");
            int bit = asInt(recMap.get("bit"), "record.bit");
            int expected = asInt(m.get("expected"), "expected");
            out.add(new Condition(new ClassicalRecord(bit), expected));
        }
        return out;
    }

    private static String num(double d) {
        if (!Double.isFinite(d)) {
            throw new IllegalArgumentException("non-finite number cannot be serialized: " + d);
        }
        return Double.toString(d);
    }
}
