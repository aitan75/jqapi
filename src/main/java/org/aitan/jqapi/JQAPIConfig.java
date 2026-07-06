package org.aitan.jqapi;

import org.aitan.jqapi.exceptions.JQApiLimitException;

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

    public static final int DEFAULT_MAX_QUBITS = 24;
    public static final int DEFAULT_MAX_SEARCH_QUBITS = 12;

    /** Hard upper bound for both limits: {@code 1 << n} overflows {@code int} beyond 30. */
    public static final int ABSOLUTE_MAX_QUBITS = 30;

    private static final JQAPIConfig DEFAULT = new JQAPIConfig(
            readBoundedProperty(MAX_QUBITS_PROPERTY, DEFAULT_MAX_QUBITS),
            readBoundedProperty(MAX_SEARCH_QUBITS_PROPERTY, DEFAULT_MAX_SEARCH_QUBITS));

    private final int maxQubits;
    private final int maxSearchQubits;

    private JQAPIConfig(int maxQubits, int maxSearchQubits) {
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
        this.maxQubits = maxQubits;
        this.maxSearchQubits = maxSearchQubits;
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
        return DEFAULT;
    }

    private static int readBoundedProperty(String property, int fallback) {
        int value = Integer.getInteger(property, fallback);
        return (value > 0 && value <= ABSOLUTE_MAX_QUBITS) ? value : fallback;
    }

    /** @return the maximum allowed qubits in circuits and registers */
    public int maxQubits() {
        return maxQubits;
    }

    /** @return the maximum allowed qubits for search algorithms (e.g. Grover's search) */
    public int maxSearchQubits() {
        return maxSearchQubits;
    }
}
