package org.aitan.jqapi;

import java.util.concurrent.ForkJoinPool;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.quantum.OperatorExecutor;
import org.aitan.jqapi.quantum.ParallelOperatorExecutor;
import org.aitan.jqapi.quantum.SequentialOperatorExecutor;

/**
 * Immutable configuration for JQAPI library limits to prevent unbounded memory
 * allocation (MED-1) and integer overflow (MED-2) issues.
 * <p>
 * A configuration holds two limits: the maximum number of qubits allowed in
 * circuits and registers, and the maximum number of qubits allowed for search
 * algorithms (e.g. Grover's search), which is typically lower because the dense
 * oracle matrix grows as {@code 2^n x 2^n}.
 * <p>
 * Both limits are hard-capped at {@link #ABSOLUTE_MAX_QUBITS}: state vector
 * dimensions are computed as {@code 1 << n}, which overflows {@code int} beyond
 * 30 qubits.
 * <p>
 * Obtain the process-wide defaults via {@link #getDefault()} (which reads the
 * {@code jqapi.max.qubits} / {@code jqapi.max.search.qubits} system properties
 * once, when this class is initialized, falling back to
 * {@link #DEFAULT_MAX_QUBITS} / {@link #DEFAULT_MAX_SEARCH_QUBITS} when a
 * property is absent or out of range), or build an explicit instance with
 * {@link #of(int, int)}. The defaults are frozen at class initialization so
 * that later {@code System.setProperty} calls cannot raise the limits at
 * runtime.
 *
 * @author Gaetano Ferrara
 */
public final class JQAPIConfig {

    public static final String MAX_QUBITS_PROPERTY = "jqapi.max.qubits";
    public static final String MAX_SEARCH_QUBITS_PROPERTY = "jqapi.max.search.qubits";
    public static final String PARALLEL_ENABLED_PROPERTY = "jqapi.parallel.enabled";
    public static final String PARALLEL_THRESHOLD_PROPERTY = "jqapi.parallel.threshold";

    public static final int DEFAULT_MAX_QUBITS = 24;
    public static final int DEFAULT_MAX_SEARCH_QUBITS = 12;
    public static final boolean DEFAULT_PARALLEL_ENABLED = true;
    /** Default state-vector dimension at/above which applyOperator parallelizes (16 qubits). */
    public static final int DEFAULT_PARALLEL_THRESHOLD = 1 << 16;

    /** Hard upper bound for both limits: {@code 1 << n} overflows {@code int} beyond 30. */
    public static final int ABSOLUTE_MAX_QUBITS = 30;

    // Frozen at class initialization (declared before DEFAULT so it can read them).
    private static final boolean RESOLVED_PARALLEL_ENABLED =
            readBooleanProperty(PARALLEL_ENABLED_PROPERTY, DEFAULT_PARALLEL_ENABLED);
    private static final int RESOLVED_PARALLEL_THRESHOLD =
            readThresholdProperty(PARALLEL_THRESHOLD_PROPERTY, DEFAULT_PARALLEL_THRESHOLD);

    /**
     * Lazy holder for the process-wide default. Keeping the {@link
     * ParallelOperatorExecutor} construction in this nested class's initializer
     * (rather than {@code JQAPIConfig.<clinit>}) means it runs only when {@link
     * #getDefault()} is actually called — so a build that never calls it (the
     * TeaVM WASM build, issue #5 phase 2b) can dead-code-eliminate the whole
     * parallel path. Still thread-safe and read-once (initialization-on-demand).
     */
    private static final class Default {
        static final JQAPIConfig INSTANCE = new JQAPIConfig(
                readBoundedProperty(MAX_QUBITS_PROPERTY, DEFAULT_MAX_QUBITS),
                readBoundedProperty(MAX_SEARCH_QUBITS_PROPERTY, DEFAULT_MAX_SEARCH_QUBITS));
    }

    private final int maxQubits;
    private final int maxSearchQubits;
    private final boolean parallelEnabled;
    private final int parallelThreshold;
    private final OperatorExecutor operatorExecutor;

    private JQAPIConfig(int maxQubits, int maxSearchQubits) {
        this(maxQubits, maxSearchQubits, RESOLVED_PARALLEL_ENABLED, RESOLVED_PARALLEL_THRESHOLD,
                new ParallelOperatorExecutor(null));
    }

    private JQAPIConfig(int maxQubits, int maxSearchQubits, boolean parallelEnabled,
            int parallelThreshold, OperatorExecutor operatorExecutor) {
        if (maxQubits <= 0) {
            throw new JQApiLimitException("maxQubits must be positive, was: " + maxQubits);
        }
        if (maxQubits > ABSOLUTE_MAX_QUBITS) {
            throw new JQApiLimitException("maxQubits must be at most " + ABSOLUTE_MAX_QUBITS + ", was: " + maxQubits);
        }
        if (maxSearchQubits <= 0) {
            throw new JQApiLimitException("maxSearchQubits must be positive, was: " + maxSearchQubits);
        }
        if (maxSearchQubits > ABSOLUTE_MAX_QUBITS) {
            throw new JQApiLimitException("maxSearchQubits must be at most " + ABSOLUTE_MAX_QUBITS + ", was: " + maxSearchQubits);
        }
        if (parallelThreshold < 1) {
            throw new JQApiLimitException("parallelThreshold must be positive, was: " + parallelThreshold);
        }
        this.maxQubits = maxQubits;
        this.maxSearchQubits = maxSearchQubits;
        this.parallelEnabled = parallelEnabled;
        this.parallelThreshold = parallelThreshold;
        this.operatorExecutor = operatorExecutor;
    }

    /**
     * Creates a configuration with explicit limits.
     * <p>
     * Each limit must lie in {@code [1, ABSOLUTE_MAX_QUBITS]}. For a coherent
     * configuration {@code maxSearchQubits} should be less than or equal to
     * {@code maxQubits}, since a search internally builds a circuit of that many
     * qubits; a search requiring more qubits than {@code maxQubits} will be
     * rejected when the circuit is constructed.
     *
     * @param maxQubits the maximum allowed qubits in circuits and registers
     * @param maxSearchQubits the maximum allowed qubits for search algorithms
     * @return a new immutable configuration
     * @throws JQApiLimitException if either limit is not positive or exceeds {@link #ABSOLUTE_MAX_QUBITS}
     */
    public static JQAPIConfig of(int maxQubits, int maxSearchQubits) {
        return new JQAPIConfig(maxQubits, maxSearchQubits);
    }

    /**
     * Returns the process-wide default configuration, built from the JQAPI
     * system properties read once at class initialization and falling back to
     * the library defaults when a property is absent, not a valid integer, or
     * outside {@code [1, ABSOLUTE_MAX_QUBITS]}.
     * <p>
     * The instance is frozen: changing the system properties after this class
     * has been initialized has no effect, so untrusted in-process code cannot
     * raise the limits at runtime.
     *
     * @return the immutable process-wide default configuration
     */
    public static JQAPIConfig getDefault() {
        return Default.INSTANCE;
    }

    /**
     * Returns a sequential-only configuration: parallelism disabled and a
     * single-threaded {@link OperatorExecutor}. Used by single-threaded runtimes
     * such as the browser WASM/JS build (issue #5 phase 2b), where {@code
     * ForkJoinPool} and parallel streams are unavailable. Constructs no {@link
     * ParallelOperatorExecutor}, so it never pulls the parallel path into the
     * reachable graph.
     *
     * @param maxQubits the maximum allowed qubits in circuits and registers
     * @return a new immutable, sequential configuration
     * @throws JQApiLimitException if {@code maxQubits} is not in {@code [1, ABSOLUTE_MAX_QUBITS]}
     */
    public static JQAPIConfig sequential(int maxQubits) {
        return new JQAPIConfig(maxQubits, DEFAULT_MAX_SEARCH_QUBITS, false,
                DEFAULT_PARALLEL_THRESHOLD, new SequentialOperatorExecutor());
    }

    private static int readBoundedProperty(String property, int fallback) {
        int value = Integer.getInteger(property, fallback);
        return (value > 0 && value <= ABSOLUTE_MAX_QUBITS) ? value : fallback;
    }

    private static boolean readBooleanProperty(String property, boolean fallback) {
        String value = System.getProperty(property);
        return value == null ? fallback : Boolean.parseBoolean(value);
    }

    private static int readThresholdProperty(String property, int fallback) {
        int value = Integer.getInteger(property, fallback);
        return value >= 1 ? value : fallback;
    }

    /** @return the maximum allowed qubits in circuits and registers */
    public int maxQubits() {
        return maxQubits;
    }

    /** @return the maximum allowed qubits for search algorithms (e.g. Grover's search) */
    public int maxSearchQubits() {
        return maxSearchQubits;
    }

    /** @return whether gate application may parallelize the amplitude-group loop */
    public boolean parallelEnabled() {
        return parallelEnabled;
    }

    /** @return the state-vector dimension at/above which gate application parallelizes */
    public int parallelThreshold() {
        return parallelThreshold;
    }

    /** @return the executor gate application delegates its group loop to when parallelizing */
    public OperatorExecutor operatorExecutor() {
        return operatorExecutor;
    }

    /**
     * @return the pool that gate application submits its parallel work to, or
     *         {@code null} to use the common {@link ForkJoinPool} (also
     *         {@code null} for a {@link #sequential(int)} configuration)
     */
    public ForkJoinPool parallelExecutor() {
        return operatorExecutor instanceof ParallelOperatorExecutor p ? p.pool() : null;
    }

    /**
     * Returns a copy of this configuration with the given parallelism policy.
     *
     * @param enabled whether gate application may parallelize
     * @param threshold the state-vector dimension at/above which to parallelize (&ge; 1)
     * @return a new immutable configuration; this instance is unchanged
     * @throws JQApiLimitException if {@code threshold < 1}
     */
    public JQAPIConfig withParallel(boolean enabled, int threshold) {
        return new JQAPIConfig(maxQubits, maxSearchQubits, enabled, threshold, operatorExecutor);
    }

    /**
     * Returns a copy of this configuration that submits parallel gate work to the
     * given pool instead of the common {@link ForkJoinPool}. The caller owns the
     * pool's lifecycle (jqapi never creates or shuts it down).
     *
     * @param executor the pool to use, or {@code null} for the common pool
     * @return a new immutable configuration; this instance is unchanged
     */
    public JQAPIConfig withExecutor(ForkJoinPool executor) {
        return new JQAPIConfig(maxQubits, maxSearchQubits, parallelEnabled, parallelThreshold,
                new ParallelOperatorExecutor(executor));
    }
}
