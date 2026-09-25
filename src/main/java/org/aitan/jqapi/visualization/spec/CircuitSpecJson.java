package org.aitan.jqapi.visualization.spec;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import org.aitan.jqapi.quantum.classical.Condition;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.utils.JsonParser;
import static org.aitan.jqapi.utils.JsonParser.asArray;
import static org.aitan.jqapi.utils.JsonParser.asDouble;
import static org.aitan.jqapi.utils.JsonParser.asInt;
import static org.aitan.jqapi.utils.JsonParser.asObject;
import static org.aitan.jqapi.utils.JsonParser.asString;

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
        sb.append("]");
        if (spec.version() == 2 && spec.numClassicalBits() != 0) sb.append(",\"numClassicalBits\":").append(spec.numClassicalBits());
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
        if (g.classicalTarget() != null) sb.append(",\"classicalTarget\":").append(g.classicalTarget().intValue());
        if (g.condition() != null) {
            sb.append(",\"condition\":{\"bitIndex\":").append(g.condition().bitIndex())
              .append(",\"expected\":").append(g.condition().expected()).append('}');
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
        Object tree = JsonParser.parse(json, MAX_JSON_DEPTH);
        return mapCircuit(tree, config.maxQubits());
    }

    private static CircuitSpec mapCircuit(Object tree, int maxQubits) {
        Map<String, Object> root = asObject(tree, "root");
        int version = asInt(root.get("version"), "version");
        if (version != 1 && version != 2) {
            throw new org.aitan.jqapi.exceptions.UnsupportedSpecVersionException(version);
        }
        if (root.containsKey("measurementRecords") || root.containsKey("conditions")) {
            throw new IllegalArgumentException("Unsupported prototype classical metadata; use v2 gate placements");
        }
        int classicalBits = root.containsKey("numClassicalBits") ? asInt(root.get("numClassicalBits"), "numClassicalBits") : 0;
        if (version == 1 && root.containsKey("numClassicalBits")) throw new IllegalArgumentException("Classical fields require v2");
        if (classicalBits < 0 || classicalBits > maxQubits) throw new JQApiLimitException("Classical register exceeds configured budget");
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
                gates.add(mapGate(go, numQubits, version));
            }
            levels.add(new LevelSpec(gates));
        }
        return new CircuitSpec(version, numQubits, levels, classicalBits);
    }

    private static GateSpec mapGate(Object go, int numQubits, int version) {
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
        if (version == 1 && (gm.containsKey("classicalTarget") || gm.containsKey("condition"))) {
            throw new IllegalArgumentException("Classical gate fields require v2");
        }
        Integer destination = gm.containsKey("classicalTarget") ? asInt(gm.get("classicalTarget"), "classicalTarget") : null;
        Condition condition = null;
        if (gm.containsKey("condition")) {
            Map<String, Object> predicate = asObject(gm.get("condition"), "condition");
            condition = new Condition(asInt(predicate.get("bitIndex"), "bitIndex"), asInt(predicate.get("expected"), "expected"));
        }
        return new GateSpec(kind, targets, controls, params, matrix, destination, condition);
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

    private static String num(double d) {
        if (!Double.isFinite(d)) {
            throw new IllegalArgumentException("non-finite number cannot be serialized: " + d);
        }
        return Double.toString(d);
    }
}
