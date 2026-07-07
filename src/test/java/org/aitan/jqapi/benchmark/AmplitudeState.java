package org.aitan.jqapi.benchmark;

/**
 * Common contract for the two candidate amplitude representations compared by
 * {@link RepresentationBenchmark}. Both implementations mirror the offset/group
 * indexing of {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251), differing
 * only in how the state and the gate are stored and multiplied.
 */
public interface AmplitudeState {

    /**
     * Applies a {@code 2^k x 2^k} gate matrix to the given target qubits, in place.
     *
     * @param targetQubits qubit indexes the gate acts on (qubit 0 is the most
     *                     significant bit of the state index, matching
     *                     QuantumRegister's convention)
     * @param gateFlat the gate matrix as interleaved (real, imaginary) pairs,
     *                 row-major, length {@code 2 * (2^k) * (2^k)}
     */
    void applyGate(int[] targetQubits, double[] gateFlat);

    /**
     * @return a fresh copy of the full state as interleaved (real, imaginary)
     *         doubles, length {@code 2 * 2^size}
     */
    double[] snapshot();
}
