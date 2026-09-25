package org.aitan.jqapi.test;

import java.util.List;
import java.util.Random;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.Expectation;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.observable.PauliSum.Term;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;
import static org.aitan.jqapi.test.ClassicalTestSupport.append;
import static org.aitan.jqapi.test.ClassicalTestSupport.circuit;
import static org.junit.jupiter.api.Assertions.*;

/** Issue #108 phase C: exact state-vector Pauli expectation without dense operators. */
class Issue108ExactExpectationTest {

    private static final double S = Math.sqrt(0.5);

    private static ComplexVector vector(Complex... amplitudes) {
        return new ComplexVector(amplitudes);
    }

    private static double expect(ComplexVector state, String label) {
        return Expectation.of(state, PauliString.fromLabel(label));
    }

    private static ComplexVector run(Circuit circuit) {
        LocalSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    @Test
    void singleQubitPaulisMatchAnalyticValues() {
        ComplexVector zero = vector(Complex.ONE, Complex.ZERO);
        ComplexVector one = vector(Complex.ZERO, Complex.ONE);
        ComplexVector plus = vector(new Complex(S, 0), new Complex(S, 0));
        ComplexVector plusI = vector(new Complex(S, 0), new Complex(0, S));
        ComplexVector minusI = vector(new Complex(S, 0), new Complex(0, -S));
        assertEquals(1, expect(zero, "Z"), 1e-12);
        assertEquals(-1, expect(one, "Z"), 1e-12);
        assertEquals(1, expect(plus, "X"), 1e-12);
        assertEquals(0, expect(zero, "X"), 1e-12);
        assertEquals(1, expect(plusI, "Y"), 1e-12);
        assertEquals(-1, expect(minusI, "Y"), 1e-12);
        assertEquals(0, expect(plus, "Y"), 1e-12);
        assertEquals(1, expect(plusI, "I"), 1e-12);
    }

    @Test
    void qubitZeroIsTheMostSignificantBit() {
        ComplexVector ket10 = vector(Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO);
        assertEquals(-1, expect(ket10, "ZI"), 1e-12);
        assertEquals(1, expect(ket10, "IZ"), 1e-12);
    }

    @Test
    void bellCorrelationsOnAdjacentAndNonAdjacentQubits() {
        Circuit phiPlus = circuit(2, 0, new Hadamard(0));
        append(phiPlus, new ControlledNot(0, 1));
        ComplexVector phi = run(phiPlus);
        assertEquals(1, expect(phi, "ZZ"), 1e-12);
        assertEquals(1, expect(phi, "XX"), 1e-12);
        assertEquals(-1, expect(phi, "YY"), 1e-12);
        assertEquals(0, expect(phi, "ZI"), 1e-12);

        Circuit phiPlusSpread = circuit(3, 0, new Hadamard(0));
        append(phiPlusSpread, new ControlledNot(0, 2));
        ComplexVector phiSpread = run(phiPlusSpread);
        assertEquals(1, expect(phiSpread, "ZIZ"), 1e-12);
        assertEquals(1, expect(phiSpread, "XIX"), 1e-12);
        assertEquals(-1, expect(phiSpread, "YIY"), 1e-12);
        assertEquals(0, expect(phiSpread, "ZII"), 1e-12);

        Circuit psiMinus = circuit(3, 0, new PauliX(0), new PauliX(2));
        append(psiMinus, new Hadamard(0));
        append(psiMinus, new ControlledNot(0, 2));
        ComplexVector psi = run(psiMinus);
        assertEquals(-1, expect(psi, "ZIZ"), 1e-12);
        assertEquals(-1, expect(psi, "XIX"), 1e-12);
        assertEquals(-1, expect(psi, "YIY"), 1e-12);
        assertEquals(0, expect(psi, "ZII"), 1e-12);
        assertEquals(1, expect(psi, "IZI"), 1e-12);
    }

    @Test
    void pauliSumsMatchDenseReferenceOnComplexStates() {
        PauliSum h = PauliSum.of(
                new Term(0.3, PauliString.fromLabel("ZIZ")),
                new Term(-1.2, PauliString.fromLabel("YXI")),
                new Term(0.7, PauliString.fromLabel("XIZ")),
                new Term(0.5, PauliString.fromLabel("YIY")),
                new Term(-0.4, PauliString.fromLabel("IYX")),
                new Term(0.1, PauliString.fromLabel("III")));
        Random random = new Random(108);
        for (int trial = 0; trial < 20; trial++) {
            ComplexVector state = randomState(3, random);
            assertEquals(denseExpectation(state, h), Expectation.of(state, h), 1e-12);
            for (Term term : h.terms()) {
                assertEquals(denseExpectation(state, PauliSum.of(new Term(1, term.pauli()))),
                        Expectation.of(state, term.pauli()), 1e-12, term.pauli().toString());
            }
        }
    }

    @Test
    void evaluatesLargeRegistersWithoutDenseOperators() {
        ComplexVector state = new ComplexVector(1 << 20);
        state.setEntry(0, Complex.ONE);
        assertEquals(1, expect(state, "Z" + "I".repeat(18) + "Z"), 1e-12);
        assertEquals(0, expect(state, "X" + "I".repeat(19)), 1e-12);
    }

    @Test
    void enforcesTheAmplitudeVisitBudget() {
        ComplexVector zero = vector(Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO);
        PauliSum twoTerms = PauliSum.of(new Term(1, PauliString.fromLabel("ZZ")), new Term(1, PauliString.fromLabel("XX")));
        assertEquals(1, Expectation.of(zero, twoTerms, 8), 1e-12);
        assertThrows(JQApiLimitException.class, () -> Expectation.of(zero, twoTerms, 7));
        assertThrows(IllegalArgumentException.class, () -> Expectation.of(zero, twoTerms, 0));
    }

    @Test
    void budgetIsCheckableBeforeAnyStateExists() {
        PauliSum twoTerms = PauliSum.of(new Term(1, PauliString.fromLabel("ZZ")), new Term(1, PauliString.fromLabel("XX")));
        Expectation.requireWithinBudget(twoTerms, 8);
        assertThrows(JQApiLimitException.class, () -> Expectation.requireWithinBudget(twoTerms, 7));
        assertThrows(IllegalArgumentException.class, () -> Expectation.requireWithinBudget(twoTerms, 0));
        assertThrows(NullPointerException.class, () -> Expectation.requireWithinBudget(null, 8));
        Term[] sixty = new Term[60];
        java.util.Arrays.fill(sixty, new Term(1, PauliString.fromLabel("Z" + "I".repeat(23))));
        assertThrows(JQApiLimitException.class, () -> Expectation.requireWithinBudget(PauliSum.of(sixty), Expectation.DEFAULT_MAX_WORK));
    }

    @Test
    void rejectsExpectationsOutsideTheDoubleRange() {
        ComplexVector zero = vector(Complex.ONE, Complex.ZERO);
        PauliSum huge = PauliSum.of(new Term(1e308, PauliString.fromLabel("I")), new Term(1e308, PauliString.fromLabel("I")));
        assertThrows(JQApiLimitException.class, () -> Expectation.of(zero, huge));
        PauliSum cancelling = PauliSum.of(new Term(1e308, PauliString.fromLabel("I")), new Term(-1e308, PauliString.fromLabel("Z")));
        assertEquals(0, Expectation.of(zero, cancelling), 0);
    }

    @Test
    void validatesStatesAndObservables() {
        ComplexVector zero = vector(Complex.ONE, Complex.ZERO);
        PauliString z = PauliString.fromLabel("Z");
        assertThrows(IllegalArgumentException.class, () -> Expectation.of(zero, PauliString.fromLabel("ZZ")));
        assertThrows(IllegalArgumentException.class, () -> Expectation.of(vector(Complex.ONE, Complex.ONE), z));
        assertThrows(IllegalArgumentException.class, () -> Expectation.of(vector(new Complex(Double.NaN, 0), Complex.ZERO), z));
        assertThrows(IllegalArgumentException.class, () -> Expectation.of(vector(Complex.ONE, Complex.ZERO, Complex.ZERO), z));
        assertThrows(NullPointerException.class, () -> Expectation.of(null, z));
        assertThrows(NullPointerException.class, () -> Expectation.of(zero, (PauliString) null));
        assertThrows(NullPointerException.class, () -> Expectation.of(zero, (PauliSum) null));
    }

    private static ComplexVector randomState(int qubits, Random random) {
        Complex[] amplitudes = new Complex[1 << qubits];
        double norm = 0;
        for (int i = 0; i < amplitudes.length; i++) {
            amplitudes[i] = new Complex(random.nextGaussian(), random.nextGaussian());
            norm += amplitudes[i].abs() * amplitudes[i].abs();
        }
        for (int i = 0; i < amplitudes.length; i++) amplitudes[i] = amplitudes[i].multiply(1 / Math.sqrt(norm));
        return new ComplexVector(amplitudes);
    }

    /** Reference ⟨ψ|H|ψ⟩ through an explicit 2^n × 2^n matrix; test-only. */
    private static double denseExpectation(ComplexVector state, PauliSum h) {
        int dim = state.getDimension();
        Complex[][] dense = new Complex[dim][dim];
        for (Complex[] row : dense) java.util.Arrays.fill(row, Complex.ZERO);
        for (Term term : h.terms()) {
            Complex[][] product = {{Complex.ONE}};
            for (int q = 0; q < h.numQubits(); q++) product = kron(product, single(term.pauli().get(q).name().charAt(0)));
            for (int r = 0; r < dim; r++) {
                for (int c = 0; c < dim; c++) dense[r][c] = dense[r][c].add(product[r][c].multiply(term.coeff()));
            }
        }
        Complex sum = Complex.ZERO;
        for (int r = 0; r < dim; r++) {
            for (int c = 0; c < dim; c++) {
                sum = sum.add(state.getEntry(r).conjugate().multiply(dense[r][c]).multiply(state.getEntry(c)));
            }
        }
        assertEquals(0, sum.getImaginary(), 1e-12, "Hermitian expectation must be real");
        return sum.getReal();
    }

    private static Complex[][] single(char pauli) {
        Complex o = Complex.ZERO;
        Complex l = Complex.ONE;
        return switch (pauli) {
            case 'I' -> new Complex[][]{{l, o}, {o, l}};
            case 'X' -> new Complex[][]{{o, l}, {l, o}};
            case 'Y' -> new Complex[][]{{o, new Complex(0, -1)}, {Complex.I, o}};
            default -> new Complex[][]{{l, o}, {o, new Complex(-1, 0)}};
        };
    }

    /** Kronecker product with the left factor as the most significant index. */
    private static Complex[][] kron(Complex[][] a, Complex[][] b) {
        int n = a.length * b.length;
        Complex[][] out = new Complex[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                out[r][c] = a[r / b.length][c / b.length].multiply(b[r % b.length][c % b.length]);
            }
        }
        return out;
    }
}
