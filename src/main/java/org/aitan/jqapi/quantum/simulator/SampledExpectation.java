package org.aitan.jqapi.quantum.simulator;

import java.util.List;
import org.aitan.jqapi.observable.PauliString;

/**
 * Shot-based estimate of {@code ⟨H⟩ = Σ c_k ⟨P_k⟩}.
 *
 * @param value {@code Σ c_k m_k}
 * @param standardError {@code sqrt(Σ c_k² Var(m_k))}, assuming independent terms
 * @param totalShots shots over all non-identity terms
 * @param terms per-term estimates, in observable order
 */
public record SampledExpectation(double value, double standardError, int totalShots, List<TermEstimate> terms) {

    public SampledExpectation {
        terms = List.copyOf(terms);
    }

    /**
     * Estimate of one Pauli term from {@code N} shots measured in its eigenbasis.
     *
     * @param coeff the term coefficient
     * @param pauli the Pauli string
     * @param shots shots {@code N} spent on this term; 0 for the identity
     * @param mean {@code m = (n₊ − n₋) / N}, exactly 1 for the identity
     * @param variance estimated {@code Var(m) = (1 − m²) / (N − 1)}, 0 for the identity
     */
    public record TermEstimate(double coeff, PauliString pauli, int shots, double mean, double variance) {
    }
}
