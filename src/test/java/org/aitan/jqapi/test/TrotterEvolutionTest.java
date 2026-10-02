package org.aitan.jqapi.test;

import java.time.Duration;
import java.util.Collections;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.TrotterEvolution;
import org.aitan.jqapi.quantum.UnitaryOperation;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TrotterEvolutionTest {

    private static final double TOLERANCE = 1e-11;

    @Test
    void pauliExponentials_matchEveryBasisColumn_forAllWordsUpToThreeQubits() {
        // Independent label-based action: includes Y signs, diagonal eigenvalues,
        // identities and non-adjacent support, with no phase alignment.
        for (int n = 1; n <= 3; n++) {
            for (int word = 0; word < 1 << (2 * n); word++) {
                StringBuilder label = new StringBuilder();
                for (int q = 0; q < n; q++) {
                    label.append("IXYZ".charAt((word >>> (2 * q)) & 3));
                }
                for (double angle : new double[]{0, 0.37, -0.61, Math.PI}) {
                    UnitaryOperation op = TrotterEvolution.pauliExponential(
                            PauliString.fromLabel(label.toString()), angle);
                    for (int k = 0; k < 1 << n; k++) {
                        ComplexVector input = basis(1 << n, k);
                        assertState(exactPauli(label.toString(), angle, input), run(op, input));
                    }
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void singleTerm_matchesClosedForm_forSeveralStepCounts(boolean symmetric) {
        for (String label : new String[]{"I", "Y", "ZX", "YIY"}) {
            PauliSum h = sum(-1.25, label);
            for (int steps : new int[]{1, 3, 17}) {
                UnitaryOperation op = evolve(h, 0.4, steps, symmetric);
                for (int k = 0; k < 1 << label.length(); k++) {
                    ComplexVector input = basis(1 << label.length(), k);
                    assertState(exactPauli(label, -0.5, input), run(op, input));
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void commutingTerms_areExactIncludingIdentityShift(boolean symmetric) {
        PauliSum h = PauliSum.of(term(0.4, "XX"), term(-0.7, "YY"), term(0.2, "II"));
        for (int k = 0; k < 4; k++) {
            ComplexVector input = basis(4, k);
            ComplexVector exact = exactPauli("XX", 0.4 * 0.7, input);
            exact = exactPauli("YY", -0.7 * 0.7, exact);
            exact = exactPauli("II", 0.2 * 0.7, exact);
            assertState(exact, run(evolve(h, 0.7, 4, symmetric), input));
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void noncommutingHamiltonians_convergeAtExpectedOrder(boolean symmetric) {
        // Both pairs anticommute, so H0^2 = (a^2+b^2) I and its exponential
        // has a closed form. Compare maximum column L2 error, preserving phase.
        for (String[] labels : new String[][]{{"X", "Z"}, {"XI", "ZX"}}) {
            double a = 0.6, b = -0.8, shift = 0.2, time = 0.7;
            int dim = 1 << labels[0].length();
            PauliSum h = PauliSum.of(term(a, labels[0]), term(b, labels[1]),
                    term(shift, "I".repeat(labels[0].length())));
            double previous = 0;
            for (int steps : new int[]{2, 4, 8, 16}) {
                UnitaryOperation op = evolve(h, time, steps, symmetric);
                double error = 0;
                for (int k = 0; k < dim; k++) {
                    ComplexVector input = basis(dim, k);
                    ComplexVector exact = exactAnticommuting(labels, a, b, shift, time, input);
                    error = Math.max(error, distance(exact, run(op, input)));
                }
                if (previous != 0) {
                    double ratio = previous / error;
                    assertTrue(ratio > (symmetric ? 3.6 : 1.8)
                            && ratio < (symmetric ? 4.4 : 2.2), "Convergence ratio: " + ratio);
                }
                previous = error;
            }
            assertTrue(previous < (symmetric ? 0.0004 : 0.02), "Final error: " + previous);
        }
    }

    @Test
    void firstOrder_appliesTermsInStoredOrder() {
        ComplexVector input = basis(2, 0);
        PauliSum h = PauliSum.of(term(0.6, "X"), term(-0.8, "Z"));
        ComplexVector exact = exactPauli("Z", -0.8, exactPauli("X", 0.6, input));
        assertState(exact, run(TrotterEvolution.firstOrder(h, 1, 1), input));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void controlledPowers_preserveIdentityPhase_andBothControlBranches(boolean symmetric) {
        double time = 0.4;
        PauliSum h = PauliSum.of(term(0.7, "XZ"), term(-0.3, "II"));
        UnitaryOperation controlled = evolve(h, time, 3, symmetric).controlledPower(3);
        // A superposition of both control values and an entangled target state.
        ComplexVector target = new ComplexVector(4);
        target.setEntry(0, new Complex(1 / Math.sqrt(2), 0));
        target.setEntry(3, new Complex(0, 1 / Math.sqrt(2)));
        ComplexVector evolved = exactPauli("II", -0.3 * time * 3,
                exactPauli("XZ", 0.7 * time * 3, target));
        ComplexVector input = new ComplexVector(8);
        ComplexVector expected = new ComplexVector(8);
        for (int k = 0; k < 4; k++) {
            Complex amp = target.getEntry(k).multiply(1 / Math.sqrt(2));
            input.setEntry(k, amp);
            input.setEntry(4 + k, amp);
            expected.setEntry(k, amp);
            expected.setEntry(4 + k, evolved.getEntry(k).multiply(1 / Math.sqrt(2)));
        }
        assertState(expected, run(controlled, input));
    }

    @Test
    void remapping_preservesMsbOrderAndSpectators() {
        UnitaryOperation op = TrotterEvolution.pauliExponential(PauliString.fromLabel("XY"), 0.3)
                .on(4, 3, 0);
        for (int k = 0; k < 16; k++) {
            ComplexVector input = basis(16, k);
            assertState(exactPauli("YIIX", 0.3, input), run(op, input));
        }
    }

    @Test
    void wideWordsAndIdentity_haveOnlySmallGateSupports() {
        assertTimeoutPreemptively(Duration.ofSeconds(3), () -> {
            UnitaryOperation identity = TrotterEvolution.pauliExponential(
                    PauliString.fromLabel("I".repeat(30)), 0.3);
            assertEquals(30, identity.getQubitCount());
            assertEquals(1, identity.getStepCount());
            UnitaryOperation controlled = TrotterEvolution.pauliExponential(
                    PauliString.fromLabel("I".repeat(29)), 0.3).controlled();
            assertEquals(30, controlled.getQubitCount());
            assertEquals(1, controlled.getStepCount());
            assertEquals(119, TrotterEvolution.pauliExponential(
                    PauliString.fromLabel("X".repeat(30)), 0.3).getStepCount());
            assertThrows(JQApiLimitException.class, identity::controlled);
        });
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void zeroEvolution_usesNoGatesEvenWithManySlices(boolean symmetric) {
        assertTimeoutPreemptively(Duration.ofSeconds(3), () -> {
            for (PauliSum h : new PauliSum[]{sum(0, "XYZ"), sum(1, "III")}) {
                assertEquals(0, evolve(h, 0, Integer.MAX_VALUE, 0, symmetric).getStepCount());
            }
            assertEquals(0, evolve(sum(0, "XYZ"), 1, Integer.MAX_VALUE, 0, symmetric).getStepCount());
            assertEquals(0, TrotterEvolution.pauliExponential(PauliString.fromLabel("XYZ"), 0).getStepCount());
        });
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void budgets_areCheckedBeforeBuildingTheCircuit(boolean symmetric) {
        PauliSum h = PauliSum.of(term(1, "X"), term(1, "Z"));
        int budget = symmetric ? 24 : 12;
        assertEquals(budget, evolve(h, 0.5, 3, budget, symmetric).getStepCount());
        assertThrows(JQApiLimitException.class, () -> evolve(h, 0.5, 3, budget - 1, symmetric));
        assertTimeoutPreemptively(Duration.ofSeconds(3), () -> {
            assertThrows(JQApiLimitException.class, () -> evolve(h, 1, Integer.MAX_VALUE, symmetric));
            assertThrows(JQApiLimitException.class,
                    () -> evolve(h, 1, Integer.MAX_VALUE, Long.MAX_VALUE, symmetric));
            PauliSum tooMany = PauliSum.of(Collections.nCopies(
                    (int) UnitaryOperation.DEFAULT_MAX_STEPS / (symmetric ? 2 : 1) + 1, term(0, "Z")));
            assertThrows(JQApiLimitException.class, () -> evolve(tooMany, 0, 1, symmetric));
        });
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void invalidInputs_areRejectedAtTheBoundary(boolean symmetric) {
        PauliSum h = sum(1, "X");
        assertThrows(NullPointerException.class, () -> evolve(null, 1, 1, symmetric));
        for (double time : new double[]{-0.1, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY}) {
            assertThrows(IllegalArgumentException.class, () -> evolve(h, time, 1, symmetric));
        }
        for (int steps : new int[]{0, -1, Integer.MIN_VALUE}) {
            assertThrows(IllegalArgumentException.class, () -> evolve(h, 0, steps, symmetric));
        }
        assertThrows(IllegalArgumentException.class, () -> evolve(h, 1, 1, -1, symmetric));
        assertThrows(IllegalArgumentException.class,
                () -> evolve(sum(Double.MAX_VALUE, "X"), 4, 1, symmetric));
    }

    @Test
    void invalidAnglesAndCoefficients_areRejected() {
        assertThrows(NullPointerException.class, () -> TrotterEvolution.pauliExponential(null, 0));
        for (double angle : new double[]{Double.NaN, Double.POSITIVE_INFINITY,
                Double.NEGATIVE_INFINITY, Double.MAX_VALUE, -Double.MAX_VALUE}) {
            assertThrows(IllegalArgumentException.class,
                    () -> TrotterEvolution.pauliExponential(PauliString.fromLabel("X"), angle));
        }
        for (double coeff : new double[]{Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY}) {
            assertThrows(IllegalArgumentException.class, () -> sum(coeff, "X"));
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void finiteScaledAngles_doNotLoseTinyTimesOrOverflowPrematurely(boolean symmetric) {
        PauliSum h = sum(Double.MAX_VALUE, "Z");
        double angle = Double.MAX_VALUE * Double.MIN_VALUE;
        ComplexVector tiny = run(evolve(h, Double.MIN_VALUE, 2, symmetric), basis(2, 0));
        assertEquals(-Math.sin(angle), tiny.getEntry(0).getImaginary(), 1e-28);
        // The unsliced product overflows, but the per-term Rz angles are finite.
        UnitaryOperation large = evolve(h, 4, 16, symmetric);
        assertEquals(symmetric ? 32 : 16, large.getStepCount());
    }

    private static PauliSum.Term term(double coeff, String label) {
        return new PauliSum.Term(coeff, PauliString.fromLabel(label));
    }

    private static PauliSum sum(double coeff, String label) {
        return PauliSum.of(term(coeff, label));
    }

    private static UnitaryOperation evolve(PauliSum h, double time, int steps, boolean symmetric) {
        return symmetric ? TrotterEvolution.secondOrder(h, time, steps)
                : TrotterEvolution.firstOrder(h, time, steps);
    }

    private static UnitaryOperation evolve(PauliSum h, double time, int steps, long budget, boolean symmetric) {
        return symmetric ? TrotterEvolution.secondOrder(h, time, steps, budget)
                : TrotterEvolution.firstOrder(h, time, steps, budget);
    }

    private static ComplexVector basis(int dimension, int index) {
        ComplexVector v = new ComplexVector(dimension);
        v.setEntry(index, Complex.ONE);
        return v;
    }

    private static ComplexVector run(UnitaryOperation op, ComplexVector input) {
        Circuit circuit = new Circuit(op.getQubitCount());
        op.appendTo(circuit);
        LocalSimulator simulator = new LocalSimulator(circuit, input, () -> 0.5);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    /** Direct tensor-product Pauli action, independent of gates and production bit masks. */
    private static ComplexVector applyPauli(String label, ComplexVector input) {
        ComplexVector result = new ComplexVector(input.getDimension());
        for (int k = 0; k < input.getDimension(); k++) {
            int out = k;
            Complex amp = input.getEntry(k);
            for (int q = 0; q < label.length(); q++) {
                int bit = 1 << (label.length() - 1 - q);
                boolean one = (k & bit) != 0;
                switch (label.charAt(q)) {
                    case 'X' -> out ^= bit;
                    case 'Y' -> {
                        out ^= bit;
                        amp = amp.multiply(new Complex(0, one ? -1 : 1));
                    }
                    case 'Z' -> amp = amp.multiply(one ? -1 : 1);
                    default -> { }
                }
            }
            result.setEntry(out, amp);
        }
        return result;
    }

    private static ComplexVector exactPauli(String label, double angle, ComplexVector input) {
        ComplexVector p = applyPauli(label, input);
        ComplexVector result = new ComplexVector(input.getDimension());
        for (int k = 0; k < result.getDimension(); k++) {
            result.setEntry(k, input.getEntry(k).multiply(Math.cos(angle))
                    .add(p.getEntry(k).multiply(new Complex(0, -Math.sin(angle)))));
        }
        return result;
    }

    private static ComplexVector exactAnticommuting(String[] labels, double a, double b,
            double shift, double time, ComplexVector input) {
        double norm = Math.hypot(a, b);
        ComplexVector p = applyPauli(labels[0], input);
        ComplexVector q = applyPauli(labels[1], input);
        ComplexVector result = new ComplexVector(input.getDimension());
        for (int k = 0; k < result.getDimension(); k++) {
            Complex h = p.getEntry(k).multiply(a).add(q.getEntry(k).multiply(b));
            result.setEntry(k, input.getEntry(k).multiply(Math.cos(norm * time))
                    .add(h.multiply(new Complex(0, -Math.sin(norm * time) / norm)))
                    .multiply(new Complex(Math.cos(shift * time), -Math.sin(shift * time))));
        }
        return result;
    }

    private static void assertState(ComplexVector expected, ComplexVector actual) {
        assertEquals(expected.getDimension(), actual.getDimension());
        for (int k = 0; k < expected.getDimension(); k++) {
            assertEquals(expected.getEntry(k).getReal(), actual.getEntry(k).getReal(), TOLERANCE, "Real " + k);
            assertEquals(expected.getEntry(k).getImaginary(), actual.getEntry(k).getImaginary(), TOLERANCE, "Imaginary " + k);
        }
    }

    private static double distance(ComplexVector expected, ComplexVector actual) {
        double sum = 0;
        for (int k = 0; k < expected.getDimension(); k++) {
            Complex d = expected.getEntry(k).subtract(actual.getEntry(k));
            sum += d.getReal() * d.getReal() + d.getImaginary() * d.getImaginary();
        }
        return Math.sqrt(sum);
    }
}
