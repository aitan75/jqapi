package org.aitan.jqapi.quantum.simulator;

import java.util.Objects;

/** Immutable dense basis counts; the first measured qubit is the MSB. */
public final class SamplingResult {
    private final int shots;
    private final int[] measuredQubits;
    private final int[] counts;
    private final int[] classicalBits;
    private final int[] classicalCounts;

    SamplingResult(int shots, int[] measuredQubits, int[] counts) {
        this(shots, measuredQubits, counts, new int[0], new int[0]);
    }

    SamplingResult(int shots, int[] measuredQubits, int[] counts, int[] classicalBits, int[] classicalCounts) {
        this.classicalBits = classicalBits.clone();
        this.classicalCounts = classicalCounts.clone();
        this.shots = shots;
        this.measuredQubits = measuredQubits.clone();
        this.counts = counts.clone();
    }

    /** @return total shots, equal to the sum of all counts */
    public int shots() { return shots; }

    /** @return copied physical qubit indexes, ordered from MSB to LSB */
    public int[] measuredQubits() { return measuredQubits.clone(); }

    /** @return copied counts, indexed by the measured basis bit string */
    public int[] counts() { return counts.clone(); }

    /** Selected classical addresses in MSB order, or an empty array if not requested. */
    public int[] classicalBits() { return classicalBits.clone(); }

    /** Histogram of selected classical outcomes; final quantum readout does not overwrite them. */
    public int[] classicalCounts() { return classicalCounts.clone(); }

    /**
     * Aggregates existing counts without drawing randomness.
     * @param qubits distinct physical indexes present in this result; first is MSB
     * @return marginal counts with the same shot total
     */
    public SamplingResult marginal(int... qubits) {
        Objects.requireNonNull(qubits, "qubits");
        SamplingOptions.validateIndexes(qubits, 30);
        int[] positions = new int[qubits.length];
        for (int i = 0; i < qubits.length; i++) {
            int position = -1;
            for (int j = 0; j < measuredQubits.length; j++) {
                if (qubits[i] == measuredQubits[j]) position = j;
            }
            if (position < 0) throw new IllegalArgumentException("Qubit is not present in this result");
            positions[i] = position;
        }
        int[] marginal = new int[1 << qubits.length];
        for (int basis = 0; basis < counts.length; basis++) {
            int outcome = 0;
            for (int position : positions) {
                outcome = (outcome << 1) | ((basis >>> (measuredQubits.length - 1 - position)) & 1);
            }
            marginal[outcome] += counts[basis];
        }
        return new SamplingResult(shots, qubits, marginal, classicalBits, classicalCounts);
    }
}
