package org.aitan.jqapi.quantum.simulator;

import java.security.SecureRandom;
import java.util.Objects;
import java.util.Random;
import java.util.function.DoubleSupplier;
import java.util.function.Supplier;

/**
 * Immutable execution options, separate from CircuitSpec. Shots run sequentially,
 * executing the complete circuit each time. A fresh random stream is created for
 * every sample call. Equal seeds reproduce counts with equal inputs, library
 * version and runtime/execution configuration; JVM/TeaVM parity is not promised.
 */
public final class SamplingOptions {
    public static final int MAX_SHOTS = 10_000;
    public static final long DEFAULT_MAX_WORK = 1_000_000_000L;

    private final int shots;
    private final int[] measuredQubits;
    private final int[] classicalBits;
    private final long maxWork;
    private final Supplier<DoubleSupplier> randomFactory;

    /** @param shots number of shots, from 1 to {@value MAX_SHOTS} */
    public SamplingOptions(int shots) {
        this(shots, null, new int[0], DEFAULT_MAX_WORK, () -> new SecureRandom()::nextDouble);
    }

    private SamplingOptions(int shots, int[] measuredQubits, int[] classicalBits, long maxWork,
                            Supplier<DoubleSupplier> randomFactory) {
        if (shots < 1 || shots > MAX_SHOTS) {
            throw new IllegalArgumentException("Shots must be in [1, " + MAX_SHOTS + "]");
        }
        if (maxWork < 1) {
            throw new IllegalArgumentException("Sampling work budget must be positive");
        }
        this.shots = shots;
        this.classicalBits = classicalBits.clone();
        this.measuredQubits = measuredQubits == null ? null : measuredQubits.clone();
        this.maxWork = maxWork;
        this.randomFactory = Objects.requireNonNull(randomFactory, "randomFactory");
    }

    /**
     * Selects distinct output qubits. The first index is the most significant
     * output bit. Index bounds are checked against the circuit at execution.
     * @param indexes nonempty list of physical qubit indexes
     * @return new options
     */
    public SamplingOptions withMeasuredQubits(int... indexes) {
        Objects.requireNonNull(indexes, "indexes");
        validateIndexes(indexes, 30);
        return new SamplingOptions(shots, indexes, classicalBits, maxWork, randomFactory);
    }

    /** Selects classical outcomes to aggregate separately; the first selected bit is MSB. */
    public SamplingOptions withClassicalBits(int... indexes) {
        Objects.requireNonNull(indexes, "indexes");
        validateIndexes(indexes, 30);
        return new SamplingOptions(shots, measuredQubits, indexes, maxWork, randomFactory);
    }

    int[] classicalIndexesFor(int size) {
        if (classicalBits.length != 0) validateIndexes(classicalBits, size);
        return classicalBits.clone();
    }

    /** @param seed simulation seed (not cryptographic)
     * @return options creating a fresh java.util.Random stream per execution */
    public SamplingOptions withSeed(long seed) {
        return withRandomSource(() -> new Random(seed)::nextDouble);
    }

    /**
     * @param factory factory called once per sample call; it must return a fresh,
     * exclusively owned source producing finite values in [0, 1)
     * @return new options
     */
    public SamplingOptions withRandomSource(Supplier<DoubleSupplier> factory) {
        return new SamplingOptions(shots, measuredQubits, classicalBits, maxWork, factory);
    }

    /**
     * Sets the preflight work budget in amplitude visits: shots * 2^qubits *
     * (1 + sum of gate index counts), including identity gates. This bounds
     * trajectory volume, not elapsed time or exact arithmetic operations.
     * @param budget positive work limit
     * @return new options
     */
    public SamplingOptions withMaxWork(long budget) {
        return new SamplingOptions(shots, measuredQubits, classicalBits, budget, randomFactory);
    }

    /** @return requested shot count */
    public int shots() { return shots; }

    /** @return preflight work limit */
    public long maxWork() { return maxWork; }

    int[] indexesFor(int numQubits) {
        if (measuredQubits != null) {
            validateIndexes(measuredQubits, numQubits);
            return measuredQubits.clone();
        }
        int[] indexes = new int[numQubits];
        for (int i = 0; i < numQubits; i++) indexes[i] = i;
        return indexes;
    }

    DoubleSupplier newRandom() {
        return Objects.requireNonNull(randomFactory.get(), "random source");
    }

    static void validateIndexes(int[] indexes, int numQubits) {
        if (indexes.length == 0 || indexes.length > numQubits) {
            throw new IllegalArgumentException("Measured qubits must be nonempty and fit the register");
        }
        boolean[] seen = new boolean[numQubits];
        for (int index : indexes) {
            if (index < 0 || index >= numQubits || seen[index]) {
                throw new IllegalArgumentException("Measured qubit indexes must be distinct and in range");
            }
            seen[index] = true;
        }
    }
}
