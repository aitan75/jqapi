package org.aitan.jqapi.visualization.render;

import java.util.Arrays;
import java.util.List;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;

/**
 * Deterministic ASCII/Unicode renderer for a {@link CircuitSpec}. Output uses
 * {@code \n} line separators and a fixed iteration order (levels left-to-right),
 * so it is stable enough for golden-master tests.
 *
 * <p>Glyphs: single-qubit gates are boxed ({@code [H]}); a control is
 * {@code ●}, a CNOT/Toffoli target {@code ⊕}, a Swap target {@code ×};
 * vertical connectors are {@code │} and wire crossings {@code ┼}. Idle wires
 * are drawn as plain wire ({@code ──}). Pass {@code asciiOnly} for a pure-ASCII
 * fallback ({@code ● → *}, {@code ⊕ → (+)}, {@code × → X}, box unchanged).
 *
 * @author Gaetano Ferrara
 */
public final class AsciiCircuitRenderer {

    private final boolean asciiOnly;
    private final char wire;
    private final char vert;
    private final char cross;
    private final String control;
    private final String cnotTarget;
    private final String swapTarget;

    /** Unicode renderer. */
    public AsciiCircuitRenderer() {
        this(false);
    }

    /**
     * @param asciiOnly if {@code true}, use the pure-ASCII glyph fallback
     */
    public AsciiCircuitRenderer(boolean asciiOnly) {
        this.asciiOnly = asciiOnly;
        this.wire = asciiOnly ? '-' : '─';
        this.vert = asciiOnly ? '|' : '│';
        this.cross = asciiOnly ? '+' : '┼';
        this.control = asciiOnly ? "*" : "●";
        this.cnotTarget = asciiOnly ? "(+)" : "⊕";
        this.swapTarget = asciiOnly ? "X" : "×";
    }

    /** @return the ASCII drawing of {@code circuit} (via {@link CircuitSpecs#toSpec}) */
    public String draw(Circuit circuit) {
        return draw(CircuitSpecs.toSpec(circuit));
    }

    /** @return the ASCII drawing of {@code spec} */
    public String draw(CircuitSpec spec) {
        int n = spec.numQubits();
        List<LevelSpec> levels = spec.levels();

        // Column geometry: label prefix, then one (separator + cell) block per level.
        String[] labels = new String[n];
        int labelW = 0;
        for (int q = 0; q < n; q++) {
            labels[q] = "q" + q + ": ";
            labelW = Math.max(labelW, labels[q].length());
        }

        int[] cellW = new int[levels.size()];
        int[] cellStart = new int[levels.size()];
        int totalCols = labelW;
        for (int l = 0; l < levels.size(); l++) {
            int w = 3; // min width fits [H], (+) and centered single glyphs
            for (GateSpec g : levels.get(l).gates()) {
                for (int q : wires(g)) {
                    w = Math.max(w, glyph(g, q).length());
                }
            }
            cellW[l] = w;
            cellStart[l] = totalCols + 1; // +1 for the separator column
            totalCols += 1 + w;
        }

        int rows = n == 0 ? 0 : 2 * n - 1;
        char[][] grid = new char[rows][totalCols];
        for (char[] row : grid) {
            Arrays.fill(row, ' ');
        }
        for (int q = 0; q < n; q++) {
            putString(grid[2 * q], 0, labels[q]);
            for (int l = 0; l < levels.size(); l++) {
                // wire runs through the whole block (separator + cell)
                for (int c = cellStart[l] - 1; c < cellStart[l] + cellW[l]; c++) {
                    grid[2 * q][c] = wire;
                }
            }
        }

        // Overlay glyphs, then vertical connectors / crossings.
        for (int l = 0; l < levels.size(); l++) {
            int center = cellStart[l] + (cellW[l] - 1) / 2;
            for (GateSpec g : levels.get(l).gates()) {
                int[] w = wires(g);
                for (int q : w) {
                    String s = glyph(g, q);
                    if (s.isEmpty()) {
                        continue; // identity: leave the plain wire
                    }
                    int start = cellStart[l] + (cellW[l] - s.length()) / 2;
                    putString(grid[2 * q], start, s);
                }
                int lo = Arrays.stream(w).min().orElse(0);
                int hi = Arrays.stream(w).max().orElse(0);
                for (int i = lo; i < hi; i++) {
                    grid[2 * i + 1][center] = vert; // gap between wire i and i+1
                }
                for (int q = lo + 1; q < hi; q++) {
                    final int wire = q;
                    if (Arrays.stream(w).noneMatch(x -> x == wire)) {
                        grid[2 * q][center] = cross; // wire passing under the connector
                    }
                }
            }
        }

        StringBuilder out = new StringBuilder();
        for (int r = 0; r < rows; r++) {
            out.append(rtrim(new String(grid[r])));
            if (r < rows - 1) {
                out.append('\n');
            }
        }
        return out.toString();
    }

    /** Prints {@link #draw(CircuitSpec)} to stdout, terminated by a newline. */
    public void print(CircuitSpec spec) {
        System.out.println(draw(spec));
    }

    /** Prints {@link #draw(Circuit)} to stdout, terminated by a newline. */
    public void print(Circuit circuit) {
        System.out.println(draw(circuit));
    }

    private int[] wires(GateSpec g) {
        int nc = g.controls().size();
        int[] all = new int[nc + g.targets().size()];
        for (int i = 0; i < nc; i++) {
            all[i] = g.controls().get(i);
        }
        for (int i = 0; i < g.targets().size(); i++) {
            all[nc + i] = g.targets().get(i);
        }
        return all;
    }

    /** The glyph drawn on wire {@code q} for gate {@code g} (empty for Identity). */
    private String glyph(GateSpec g, int q) {
        if (g.controls().contains(q)) {
            return control;
        }
        return switch (g.kind()) {
            case IDENTITY -> "";
            case CNOT, TOFFOLI -> cnotTarget;
            case SWAP, CSWAP -> swapTarget;
            default -> "[" + label(g.kind()) + "]";
        };
    }

    private static String label(GateKind kind) {
        return switch (kind) {
            case H -> "H";
            case X -> "X";
            case Y, CY -> "Y";
            case Z, CZ -> "Z";
            case S -> "S";
            case T -> "T";
            case RX -> "Rx";
            case RY -> "Ry";
            case RZ -> "Rz";
            case PHASE -> "P";
            case U3 -> "U3";
            case MEASUREMENT -> "M";
            case RESET -> "R";
            case ORACLE -> "O";
            default -> "U"; // GENERIC, MULTI_CONTROLLED
        };
    }

    private static void putString(char[] row, int start, String s) {
        for (int i = 0; i < s.length(); i++) {
            row[start + i] = s.charAt(i);
        }
    }

    private static String rtrim(String s) {
        int end = s.length();
        while (end > 0 && s.charAt(end - 1) == ' ') {
            end--;
        }
        return s.substring(0, end);
    }
}
