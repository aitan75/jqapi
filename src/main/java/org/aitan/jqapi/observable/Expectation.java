package org.aitan.jqapi.observable;

import java.util.Objects;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;

/** Observable expectation utilities: hermitian inner product, overlap, fidelity. */
public final class Expectation {

    private Expectation() {}

    /**
     * Overlap ⟨a|b⟩ = Σ conj(a[i])·b[i].
     * @param a first state vector
     * @param b second state vector
     * @return hermitian inner product
     * @throws IllegalArgumentException if the dimensions differ or any amplitude is non-finite
     */
    public static Complex overlap(ComplexVector a, ComplexVector b) {
        Objects.requireNonNull(a, "a");
        Objects.requireNonNull(b, "b");
        Complex overlap = a.innerProduct(b);
        // Any NaN/infinite amplitude propagates into the sum.
        if (!Double.isFinite(overlap.getReal()) || !Double.isFinite(overlap.getImaginary())) {
            throw new IllegalArgumentException("State amplitudes must be finite");
        }
        return overlap;
    }

    /**
     * Fidelity |⟨a|b⟩|²; requires normalized finite states.
     * @param a first normalized state
     * @param b second normalized state
     * @return |⟨a|b⟩|²
     */
    public static double fidelity(ComplexVector a, ComplexVector b) {
        Objects.requireNonNull(a, "a");
        Objects.requireNonNull(b, "b");
        Complex overlap = overlap(a, b);
        double normA = a.innerProduct(a).abs();
        double normB = b.innerProduct(b).abs();
        if (!Double.isFinite(normA) || !Double.isFinite(normB))
            throw new IllegalArgumentException("non-finite norm");
        if (!(Math.abs(normA - 1.0) <= 1e-9) || !(Math.abs(normB - 1.0) <= 1e-9))
            throw new IllegalArgumentException("states not normalized");
        return overlap.multiply(overlap.conjugate()).getReal();
    }
}
