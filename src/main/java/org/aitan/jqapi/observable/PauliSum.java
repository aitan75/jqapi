package org.aitan.jqapi.observable;

import java.util.List;
import java.util.Objects;

/**
 * Immutable real linear combination of Pauli strings on the same number of qubits,
 * e.g. a Hamiltonian {@code H = Σ c_k P_k}.
 *
 * @param terms nonempty terms, copied on construction
 */
public record PauliSum(List<Term> terms) {

    /**
     * One weighted Pauli string.
     *
     * @param coeff finite real coefficient
     * @param pauli the Pauli string
     */
    public record Term(double coeff, PauliString pauli) {
        public Term {
            if (!Double.isFinite(coeff)) throw new IllegalArgumentException("Pauli coefficient must be finite");
            Objects.requireNonNull(pauli, "pauli");
        }
    }

    public PauliSum {
        terms = List.copyOf(terms);
        if (terms.isEmpty()) throw new IllegalArgumentException("Pauli sum must have at least one term");
        int n = terms.getFirst().pauli().numQubits();
        for (Term term : terms) {
            if (term.pauli().numQubits() != n) throw new IllegalArgumentException("Pauli sum terms must act on the same qubits");
        }
    }

    /**
     * @param terms nonempty terms on the same number of qubits
     * @return the sum
     */
    public static PauliSum of(List<Term> terms) {
        return new PauliSum(terms);
    }

    /**
     * @param terms nonempty terms on the same number of qubits
     * @return the sum
     */
    public static PauliSum of(Term... terms) {
        return new PauliSum(List.of(terms));
    }

    /** @return number of qubits every term acts on */
    public int numQubits() {
        return terms.getFirst().pauli().numQubits();
    }
}
