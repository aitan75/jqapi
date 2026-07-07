package org.aitan.jqapi.benchmark;

/**
 * Raw interleaved-{@code double[]} baseline: no boxing, hand-written complex
 * arithmetic. Mirrors the offset/group indexing of
 * {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251) but stores
 * amplitudes as {@code (re, im)} pairs in a flat {@code double[]} instead of
 * commons-math3 {@code Complex}.
 */
public final class RawStateBaseline implements AmplitudeState {

    private final int size;
    private final double[] state;

    public RawStateBaseline(int size) {
        this.size = size;
        int dimension = 1 << size;
        this.state = new double[2 * dimension];
        this.state[0] = 1.0; // |0...0>, amplitude 1 at index 0
    }

    @Override
    public void applyGate(int[] targetQubits, double[] gateFlat) {
        int k = targetQubits.length;
        int localDimension = 1 << k;
        int dimension = 1 << size;

        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (size - 1 - targetQubits[j]);
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        double[] localRe = new double[localDimension];
        double[] localIm = new double[localDimension];

        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue; // visit each amplitude group once, from the all-target-bits-zero index
            }
            for (int t = 0; t < localDimension; t++) {
                int idx = (base | offsets[t]) * 2;
                localRe[t] = state[idx];
                localIm[t] = state[idx + 1];
            }
            for (int r = 0; r < localDimension; r++) {
                double sumRe = 0;
                double sumIm = 0;
                for (int c = 0; c < localDimension; c++) {
                    int gIdx = (r * localDimension + c) * 2;
                    double gateRe = gateFlat[gIdx];
                    double gateIm = gateFlat[gIdx + 1];
                    double localReC = localRe[c];
                    double localImC = localIm[c];
                    sumRe += gateRe * localReC - gateIm * localImC;
                    sumIm += gateRe * localImC + gateIm * localReC;
                }
                int outIdx = (base | offsets[r]) * 2;
                state[outIdx] = sumRe;
                state[outIdx + 1] = sumIm;
            }
        }
    }

    @Override
    public double[] snapshot() {
        return state.clone();
    }
}
