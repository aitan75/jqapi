# CircuitSpec JSON (de)serialization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zero-dependency, TeaVM-safe JSON serialization and hardened deserialization for `CircuitSpec`, so the browser editor (Phase 2b/2c) can round-trip circuits across the JS↔WASM boundary and to save/load/URL.

**Architecture:** One new final class `CircuitSpecJson` in the existing `org.aitan.jqapi.visualization.spec` package (same package as the records, so it uses them directly). `toJson(CircuitSpec)` builds a deterministic compact JSON string. `fromJson(String)` parses with a small internal recursive-descent parser and maps to `CircuitSpec`, validating hard at the parse boundary (the untrusted-input trust boundary for the client-side app).

**Tech Stack:** Java 21, JUnit 5. No new dependencies (hand-rolled JSON — Java has no stdlib JSON and the core must stay zero-dep and within TeaVM's supported `java.*` subset).

## Global Constraints

- Pure Java 21; **no new runtime dependency**; all in `jqapi-core`.
- Only TeaVM-supported `java.*` (String, StringBuilder, java.util collections, Double/Integer/Character) — no reflection, no `java.time`, no `java.nio.file`.
- Deterministic `toJson` output (fixed key order; param keys sorted; `Locale`-independent via `Double.toString`) so golden-string tests are stable.
- Existing suite incl. `QuantumRegisterGoldenMasterTest` stays green. No `Co-Authored-By` trailer.
- Package for production code: `org.aitan.jqapi.visualization.spec`. Package for tests: `org.aitan.jqapi.test.visualization`.
- Limits copied verbatim: `maxQubits = JQAPIConfig.getDefault().maxQubits()` (default 24); `MAX_GATES = 100_000`. `JQApiLimitException(String)` (extends `IllegalArgumentException`) for limit violations; `IllegalArgumentException` for malformed structure.

---

### Task 1: `CircuitSpecJson.toJson` (writer)

**Files:**
- Create: `src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java`
- Test: `src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java`

**Interfaces:**
- Consumes: `CircuitSpec`, `LevelSpec`, `GateSpec`, `GateKind`, `ComplexCell` (Phase 1, same package).
- Produces: `public static String CircuitSpecJson.toJson(CircuitSpec spec)`; `public static final int MAX_GATES = 100_000`.

- [ ] **Step 1: Write the failing tests**

Create `CircuitSpecJsonTest.java`:

```java
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: compile failure / FAIL — `CircuitSpecJson` does not exist.

- [ ] **Step 3: Write the writer**

Create `CircuitSpecJson.java`:

```java
package org.aitan.jqapi.visualization.spec;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

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

    private CircuitSpecJson() {
    }

    /**
     * Serializes a spec to compact, deterministic JSON (fixed key order; param
     * keys sorted).
     *
     * @param spec the spec to serialize
     * @return its JSON representation
     * @throws IllegalArgumentException if any number is non-finite (NaN/Infinity)
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
        for (Map.Entry<String, Double> e : new TreeMap<>(params).entrySet()) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            sb.append('"').append(e.getKey()).append("\":").append(num(e.getValue()));
        }
        sb.append('}');
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

    private static String num(double d) {
        if (!Double.isFinite(d)) {
            throw new IllegalArgumentException("non-finite number cannot be serialized: " + d);
        }
        return Double.toString(d);
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java \
        src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java
git commit -m "feat(viz): CircuitSpecJson.toJson deterministic writer for issue #5 (#5)"
```

---

### Task 2: `CircuitSpecJson.fromJson` (parser + mapper + intrinsic validation)

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java`
- Test: `src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java`

**Interfaces:**
- Consumes: `toJson` (Task 1); `JQAPIConfig.getDefault().maxQubits()`; `JQApiLimitException`.
- Produces: `public static CircuitSpec CircuitSpecJson.fromJson(String json)` — round-trip inverse of `toJson`; throws `IllegalArgumentException` (incl. `JQApiLimitException`) on malformed or out-of-bounds input.

- [ ] **Step 1: Write the failing tests**

Append to `CircuitSpecJsonTest.java` (add imports at top:
`import org.aitan.jqapi.visualization.spec.CircuitSpec;` is already present;
add `import org.aitan.jqapi.exceptions.JQApiLimitException;`):

```java
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: compile failure / FAIL — `fromJson` does not exist.

- [ ] **Step 3: Add the reader (parser + mapper + intrinsic validation)**

Add these imports to the top of `CircuitSpecJson.java`:

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
```

Insert the following members into the `CircuitSpecJson` class (after `toJson`,
before `num`):

```java
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
        Object tree = new JsonParser(json).parse();
        return mapCircuit(tree);
    }

    private static CircuitSpec mapCircuit(Object tree) {
        Map<String, Object> root = asObject(tree, "root");
        int version = asInt(root.get("version"), "version");
        int numQubits = asInt(root.get("numQubits"), "numQubits");
        int maxQubits = JQAPIConfig.getDefault().maxQubits();
        if (numQubits <= 0 || numQubits > maxQubits) {
            throw new JQApiLimitException("numQubits out of range (1.." + maxQubits + "): " + numQubits);
        }
        List<Object> levelsJson = asArray(root.get("levels"), "levels");
        List<LevelSpec> levels = new ArrayList<>(levelsJson.size());
        for (Object lo : levelsJson) {
            Map<String, Object> lm = asObject(lo, "level");
            List<Object> gatesJson = asArray(lm.get("gates"), "gates");
            List<GateSpec> gates = new ArrayList<>(gatesJson.size());
            for (Object go : gatesJson) {
                gates.add(mapGate(go, numQubits));
            }
            levels.add(new LevelSpec(gates));
        }
        return new CircuitSpec(version, numQubits, levels);
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
        Map<String, Double> params = mapParams(gm.get("params"));
        List<List<ComplexCell>> matrix = mapMatrix(gm.get("matrix"), targets.size());
        return new GateSpec(kind, targets, controls, params, matrix);
    }

    private static List<Integer> mapIndexes(Object o, int numQubits, String field) {
        List<Object> arr = asArray(o, field);
        List<Integer> out = new ArrayList<>(arr.size());
        for (Object x : arr) {
            int idx = asInt(x, field + " element");
            if (idx < 0 || idx >= numQubits) {
                throw new JQApiLimitException(field + " index out of range [0," + numQubits + "): " + idx);
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
        }

        private List<Object> parseArray() {
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
                        case 'u' -> {
                            sb.append((char) Integer.parseInt(s.substring(pos, pos + 4), 16));
                            pos += 4;
                        }
                        default -> throw err("invalid escape '\\" + e + "'");
                    }
                } else {
                    sb.append(c);
                }
            }
        }

        private Double parseNumber() {
            int start = pos;
            while (pos < s.length() && "+-0123456789.eE".indexOf(s.charAt(pos)) >= 0) {
                pos++;
            }
            if (pos == start) {
                throw err("invalid value");
            }
            try {
                return Double.parseDouble(s.substring(start, pos));
            } catch (NumberFormatException nfe) {
                throw err("invalid number");
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
            while (pos < s.length() && Character.isWhitespace(s.charAt(pos))) {
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: PASS (14 tests — 4 from Task 1 + 10 new).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java \
        src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java
git commit -m "feat(viz): CircuitSpecJson.fromJson parser + boundary validation for issue #5 (#5)"
```

---

### Task 3: Harden — control/target disjoint + `MAX_GATES` ceiling

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java`
- Test: `src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java`

**Interfaces:**
- Consumes: `fromJson`, `MAX_GATES`, `mapGate`, `mapCircuit` (Task 2).
- Produces: no new public API; `fromJson` now also rejects overlapping control/target and specs exceeding `MAX_GATES`.

- [ ] **Step 1: Write the failing tests**

Append to `CircuitSpecJsonTest.java`:

```java
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: FAIL — the overlap spec currently maps without error; the oversized spec is currently accepted.

- [ ] **Step 3: Add the two guards**

In `mapGate`, after the `controls` line and before `params`, add the disjointness check:

```java
        List<Integer> controls = mapIndexes(gm.get("controls"), numQubits, "controls");
        for (int c : controls) {
            if (targets.contains(c)) {
                throw new IllegalArgumentException("control and target overlap on qubit " + c);
            }
        }
```

In `mapCircuit`, thread a running gate counter and enforce `MAX_GATES`. Replace
the levels loop with:

```java
        List<Object> levelsJson = asArray(root.get("levels"), "levels");
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
        return new CircuitSpec(version, numQubits, levels);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mvn -B test -Dtest=CircuitSpecJsonTest`
Expected: PASS (16 tests).

- [ ] **Step 5: Run the full suite (no regressions)**

Run: `mvn -B test`
Expected: BUILD SUCCESS; `QuantumRegisterGoldenMasterTest` and all visualization tests green.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java \
        src/test/java/org/aitan/jqapi/test/visualization/CircuitSpecJsonTest.java
git commit -m "feat(viz): reject overlapping control/target and oversized specs in CircuitSpecJson (#5)"
```

---

### Task 4: Document the JSON format

**Files:**
- Modify: `docs/api/visualization.md`

**Interfaces:**
- Consumes: the format and API from Tasks 1-3.
- Produces: docs only.

- [ ] **Step 1: Add a JSON section**

In `docs/api/visualization.md`, add a new section after the `CircuitSpecs — mapper`
section (before `AsciiCircuitRenderer`):

````markdown
## `CircuitSpecJson` — JSON serialization

Zero-dependency, deterministic JSON for `CircuitSpec` — the shared format
between the Java simulator and the browser editor (and for save/load and
URL-sharing).

| Method | Returns | Description |
|--------|---------|-------------|
| `toJson(CircuitSpec)` | `String` | Compact, deterministic JSON (fixed key order; param keys sorted). Throws on non-finite numbers. |
| `fromJson(String)` | `CircuitSpec` | Parses and **validates at the boundary**: `numQubits` in `1..maxQubits`, indexes in range, controls/targets disjoint, matrix `2^k × 2^k`, at most `MAX_GATES` gates, finite numbers, known `GateKind`. Throws `IllegalArgumentException`/`JQApiLimitException` on bad input. |

```json
{"version":1,"numQubits":2,"levels":[
  {"gates":[{"kind":"H","targets":[0],"controls":[],"params":{}}]},
  {"gates":[{"kind":"CNOT","targets":[1],"controls":[0],"params":{}}]}
]}
```

`params` carries `theta`/`phi`/`lambda` for parametric kinds; `matrix` (nested
`{"re":…,"im":…}` arrays) appears only for `GENERIC`/`ORACLE`/`MULTI_CONTROLLED`.
````

- [ ] **Step 2: Commit**

```bash
git add docs/api/visualization.md
git commit -m "docs(viz): document CircuitSpecJson format for issue #5 (#5)"
```

---

## Verification

- Unit: golden-string `toJson` (Task 1), round-trip `fromJson(toJson(spec)).equals(spec)` (Task 2), and one rejection test per validation rule (Tasks 2-3).
- Full suite `mvn -B test` green, golden-master unchanged (Task 3 Step 5).
- Zero new dependencies; production code only uses TeaVM-supported `java.*`.
