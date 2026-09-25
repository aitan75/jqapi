package org.aitan.jqapi.observable;

import java.util.Objects;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;

/**
 * Pure-state observable utilities: overlap, fidelity and exact Pauli expectation.
 * <p>
 * Pauli expectations act on the state vector directly through bit masks, in
 * O(2^n) time per term and O(1) extra memory; no 2^n × 2^n operator is built.
 * Qubit 0 is the most significant bit of the basis-state index.
 */
public final class Expectation {

    /** Default limit on amplitude visits (terms × 2^n) for exact evaluation. */
    public static final long DEFAULT_MAX_WORK = 1_000_000_000L;

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
        requireNormalized(a);
        requireNormalized(b);
        return overlap.multiply(overlap.conjugate()).getReal();
    }

    /**
     * @param state normalized state vector of dimension 2^n
     * @param pauli Pauli string on n qubits
     * @return exact ⟨ψ|P|ψ⟩
     */
    public static double of(ComplexVector state, PauliString pauli) {
        Objects.requireNonNull(pauli, "pauli");
        return of(state, PauliSum.of(new PauliSum.Term(1.0, pauli)));
    }

    /**
     * Evaluates {@code ⟨ψ|H|ψ⟩} within {@link #DEFAULT_MAX_WORK} amplitude visits.
     * @param state normalized state vector of dimension 2^n
     * @param observable Pauli sum on n qubits
     * @return exact expectation value
     */
    public static double of(ComplexVector state, PauliSum observable) {
        return of(state, observable, DEFAULT_MAX_WORK);
    }

    /**
     * @param state normalized state vector of dimension 2^n
     * @param observable Pauli sum on n qubits
     * @param maxWork positive limit on amplitude visits (terms × 2^n)
     * @return exact expectation value
     * @throws JQApiLimitException if the evaluation exceeds {@code maxWork} or the
     *         value overflows the double range
     */
    public static double of(ComplexVector state, PauliSum observable, long maxWork) {
        Objects.requireNonNull(state, "state");
        requireWithinBudget(observable, maxWork);
        if (state.getDimension() != 1 << observable.numQubits()) {
            throw new IllegalArgumentException("State dimension must equal 2^" + observable.numQubits());
        }
        requireNormalized(state);
        double value = 0;
        for (PauliSum.Term term : observable.terms()) value += term.coeff() * pauliExpectation(state, term.pauli());
        if (!Double.isFinite(value)) throw new JQApiLimitException("Expectation value exceeds the double range");
        return value;
    }

    /**
     * Checks the exact-evaluation cost (terms × 2^n amplitude visits) from the
     * observable alone, so callers can reject it before allocating any state.
     * @param observable Pauli sum on n qubits
     * @param maxWork positive limit on amplitude visits
     * @throws JQApiLimitException if the evaluation would exceed {@code maxWork}
     */
    public static void requireWithinBudget(PauliSum observable, long maxWork) {
        Objects.requireNonNull(observable, "observable");
        if (maxWork < 1) throw new IllegalArgumentException("Expectation work budget must be positive");
        if ((long) observable.terms().size() << observable.numQubits() > maxWork) {
            throw new JQApiLimitException("Expectation exceeds the amplitude-visit work budget");
        }
    }

    /** ⟨ψ|P|ψ⟩ with P|b⟩ = i^{nY} (-1)^{popcount(b & z)} |b ⊕ x⟩. */
    private static double pauliExpectation(ComplexVector state, PauliString pauli) {
        int x = pauli.xMask();
        int z = pauli.zMask();
        double re = 0;
        double im = 0;
        for (int b = 0; b < state.getDimension(); b++) {
            Complex target = state.getEntry(b ^ x);
            Complex source = state.getEntry(b);
            // conj(target) * source
            double pr = target.getReal() * source.getReal() + target.getImaginary() * source.getImaginary();
            double pi = target.getReal() * source.getImaginary() - target.getImaginary() * source.getReal();
            if ((Integer.bitCount(b & z) & 1) == 0) {
                re += pr;
                im += pi;
            } else {
                re -= pr;
                im -= pi;
            }
        }
        // Real part of i^{nY} * (re + i im); Hermiticity makes the result real.
        return switch (pauli.yCount() & 3) {
            case 0 -> re;
            case 1 -> -im;
            case 2 -> -re;
            default -> im;
        };
    }

    private static void requireNormalized(ComplexVector state) {
        double norm = state.innerProduct(state).getReal();
        if (!(Math.abs(norm - 1.0) <= 1e-9)) {
            throw new IllegalArgumentException("State must be finite and normalized");
        }
    }
}
