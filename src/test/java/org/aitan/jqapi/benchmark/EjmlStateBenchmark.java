package org.aitan.jqapi.benchmark;

import org.ejml.data.ZMatrixRMaj;
import org.ejml.dense.row.CommonOps_ZDRM;

/**
 * EJML-backed candidate: the full state is a {@code ZMatrixRMaj} column vector
 * ({@code dimension x 1}), and each group's local multiply is delegated to
 * {@code CommonOps_ZDRM.mult}. Gather/scatter between the full state and the
 * per-group local vector accesses {@code ZMatrixRMaj.data} directly (EJML's
 * row-major dense matrices expose this field for exactly this kind of
 * performance-sensitive code). Mirrors the same offset/group indexing as
 * {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251).
 */
public final class EjmlStateBenchmark implements AmplitudeState {

    private final int size;
    private final ZMatrixRMaj state;

    public EjmlStateBenchmark(int size) {
        this.size = size;
        int dimension = 1 << size;
        this.state = new ZMatrixRMaj(dimension, 1);
        this.state.data[0] = 1.0; // |0...0>, amplitude 1 at index 0
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
                    offset |= 1 << (this.size - 1 - targetQubits[j]);
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        ZMatrixRMaj gate = new ZMatrixRMaj(localDimension, localDimension);
        System.arraycopy(gateFlat, 0, gate.data, 0, gateFlat.length);

        ZMatrixRMaj localVec = new ZMatrixRMaj(localDimension, 1);
        ZMatrixRMaj resultVec = new ZMatrixRMaj(localDimension, 1);

        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue;
            }
            for (int t = 0; t < localDimension; t++) {
                int srcIdx = (base | offsets[t]) * 2;
                localVec.data[t * 2] = state.data[srcIdx];
                localVec.data[t * 2 + 1] = state.data[srcIdx + 1];
            }
            CommonOps_ZDRM.mult(gate, localVec, resultVec);
            for (int r = 0; r < localDimension; r++) {
                int dstIdx = (base | offsets[r]) * 2;
                state.data[dstIdx] = resultVec.data[r * 2];
                state.data[dstIdx + 1] = resultVec.data[r * 2 + 1];
            }
        }
    }

    @Override
    public double[] snapshot() {
        return state.data.clone();
    }
}
