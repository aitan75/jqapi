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
