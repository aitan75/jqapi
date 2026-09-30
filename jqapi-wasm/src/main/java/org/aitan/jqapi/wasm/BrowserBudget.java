package org.aitan.jqapi.wasm;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.visualization.spec.CircuitSpec;

/** Browser policy measured in docs/benchmarks; independent of the larger JVM defaults. */
public final class BrowserBudget {
    public static final int MAX_QUBITS = 8;
    public static final int MAX_LEVELS = 256;
    public static final int MAX_GATES = 1024;
    public static final int MAX_MATRIX_CELLS = 4096;
    public static final int MAX_INPUT_CHARS = 1_000_000;
    public static final int MAX_RESULT_BYTES = 8 * 1024 * 1024;
    public static final int MAX_TRACE_AMPLITUDES = 65_536;
    public static final int MAX_OBSERVABLE_TERMS = 64;
    public static final long MAX_WORK = 20_000_000;
    public static final int MAX_ELAPSED_MS = 5000;

    private BrowserBudget() { }

    public static JQAPIConfig config() { return JQAPIConfig.sequential(MAX_QUBITS); }

    static void input(String value) {
        if (value == null) throw new IllegalArgumentException("Missing input");
        require(value.length() <= MAX_INPUT_CHARS);
    }

    /** Bounds allocations before constructing gates or allocating a simulator state. */
    static void check(CircuitSpec spec) {
        require(spec.numQubits() <= MAX_QUBITS && spec.numClassicalBits() <= MAX_QUBITS);
        require(spec.levels().size() <= MAX_LEVELS);
        long gates = 0;
        long cells = 0;
        for (var level : spec.levels()) {
            gates += level.gates().size();
            for (var gate : level.gates()) {
                if (gate.matrix() != null) for (var row : gate.matrix()) cells += row.size();
            }
        }
        require(gates <= MAX_GATES && cells <= MAX_MATRIX_CELLS);
        work(spec, 1, 0);
    }

    /** Conservative amplitude visits, including initialization, dense rows and basis changes. */
    static void work(CircuitSpec spec, long trajectories, long extraPasses) {
        long passes = 1 + extraPasses;
        for (var level : spec.levels()) for (var gate : level.gates()) {
            passes += gate.matrix() == null ? Math.max(1, gate.targets().size()) : gate.matrix().size();
        }
        require(trajectories * (1L << spec.numQubits()) * passes <= MAX_WORK);
    }

    static void require(boolean allowed) {
        if (!allowed) throw new JQApiLimitException("Browser resource budget exceeded");
    }
}
