package org.aitan.jqapi.test;

import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
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
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.gates.Ry;
import org.aitan.jqapi.quantum.simulator.ExpectationSampler;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.SampledExpectation;
import org.aitan.jqapi.quantum.simulator.SampledExpectation.TermEstimate;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;
import org.junit.jupiter.api.Test;
import static org.aitan.jqapi.test.ClassicalTestSupport.append;
import static org.aitan.jqapi.test.ClassicalTestSupport.circuit;
import static org.junit.jupiter.api.Assertions.*;

/** Issue #108 phase D: shot-based Pauli expectation with seeded, controlled randomness. */
class Issue108SampledExpectationTest {

    private static PauliSum sum(Object... coeffAndLabel) {
        Term[] terms = new Term[coeffAndLabel.length / 2];
        for (int i = 0; i < terms.length; i++) {
            terms[i] = new Term(((Number) coeffAndLabel[2 * i]).doubleValue(), PauliString.fromLabel((String) coeffAndLabel[2 * i + 1]));
        }
        return PauliSum.of(terms);
    }

    private static SampledExpectation estimate(Circuit circuit, PauliSum h, int shots, long seed) {
        return ExpectationSampler.estimate(circuit, h, new SamplingOptions(shots).withSeed(seed));
    }

    @Test
    void eigenstatesGiveExactValuesWithZeroUncertainty() {
        assertDeterministic(circuit(1, 0), "Z", 1);
        assertDeterministic(circuit(1, 0, new PauliX(0)), "Z", -1);
        assertDeterministic(circuit(1, 0, new Hadamard(0)), "X", 1);
        Circuit plusI = circuit(1, 0, new Hadamard(0));
        append(plusI, new Phase(Math.PI / 2, 0));
        assertDeterministic(plusI, "Y", 1);
        Circuit minusI = circuit(1, 0, new Hadamard(0));
        append(minusI, new Phase(-Math.PI / 2, 0));
        assertDeterministic(minusI, "Y", -1);
        Circuit bell = circuit(3, 0, new Hadamard(0));
        append(bell, new ControlledNot(0, 2));
        assertDeterministic(bell, "ZIZ", 1);
        assertDeterministic(bell, "XIX", 1);
        assertDeterministic(bell, "YIY", -1);
    }

    private static void assertDeterministic(Circuit circuit, String label, double expected) {
        SampledExpectation result = estimate(circuit, sum(1, label), 200, 7);
        assertEquals(expected, result.value(), 1e-12, label);
        assertEquals(0, result.standardError(), 1e-12, label);
    }

    @Test
    void startsFromTheGivenInitialState() {
        ComplexVector one = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ONE});
        SampledExpectation result = ExpectationSampler.estimate(circuit(1, 0), sum(2, "Z"), new SamplingOptions(50).withSeed(1), one);
        assertEquals(-2, result.value(), 1e-12);
    }

    @Test
    void supportsMidCircuitMeasurement() {
        Circuit measured = circuit(1, 0, new PauliX(0));
        append(measured, new Measurement(0));
        assertEquals(-1, estimate(measured, sum(1, "Z"), 20, 3).value(), 1e-12);
    }

    @Test
    void identityTermIsExactAndUsesNoShots() {
        Circuit plus = circuit(2, 0, new Hadamard(0));
        SampledExpectation result = estimate(plus, sum(0.75, "II", 0.5, "XI", -1, "IZ"), 100, 11);
        assertEquals(0.75 + 0.5 - 1, result.value(), 1e-12);
        assertEquals(200, result.totalShots());
        TermEstimate identity = result.terms().get(0);
        assertEquals(0, identity.shots());
        assertEquals(1, identity.mean(), 0);
        assertEquals(0, identity.variance(), 0);
        assertEquals(100, result.terms().get(1).shots());
        assertEquals(100, result.terms().get(2).shots());
        assertEquals(PauliString.fromLabel("XI"), result.terms().get(1).pauli());
        assertEquals(0.5, result.terms().get(1).coeff(), 0);
    }

    @Test
    void standardErrorFollowsTheDocumentedEstimator() {
        Circuit plus = circuit(1, 0, new Hadamard(0));
        SampledExpectation result = estimate(plus, sum(1, "Z"), SamplingOptions.MAX_SHOTS, 108);
        double m = result.terms().getFirst().mean();
        assertEquals((1 - m * m) / (SamplingOptions.MAX_SHOTS - 1), result.terms().getFirst().variance(), 1e-15);
        assertEquals(0.01, result.standardError(), 0.001);
        assertTrue(Math.abs(result.value()) <= 4 * result.standardError(), "estimate " + result.value());

        SampledExpectation weighted = estimate(plus, sum(3, "Z", -2, "X"), 500, 5);
        double expectedVariance = 0;
        for (TermEstimate term : weighted.terms()) expectedVariance += term.coeff() * term.coeff() * term.variance();
        assertEquals(Math.sqrt(expectedVariance), weighted.standardError(), 1e-15);
    }

    @Test
    void convergesToTheExactValueOnAComplexState() {
        Circuit c = circuit(2, 0, new Hadamard(0), new Rx(0.7, 1));
        append(c, new ControlledNot(0, 1));
        append(c, new Phase(0.4, 0), new Ry(1.1, 1));
        PauliSum h = sum(0.5, "ZI", -0.8, "XY", 0.3, "YY", 1.1, "IX", 0.2, "II");
        LocalSimulator simulator = new LocalSimulator(c);
        simulator.execute();
        double exact = Expectation.of(simulator.getQuantumRegister().getRegisterState(), h);
        SampledExpectation sampled = estimate(c, h, SamplingOptions.MAX_SHOTS, 2026);
        assertTrue(sampled.standardError() > 0);
        assertTrue(Math.abs(sampled.value() - exact) <= 4 * sampled.standardError(),
                "sampled " + sampled.value() + " exact " + exact + " se " + sampled.standardError());
    }

    @Test
    void equalSeedsReproduceAndTermsShareOneStream() {
        Circuit plus = circuit(1, 0, new Hadamard(0));
        PauliSum twice = sum(1, "Z", 1, "Z");
        SamplingOptions options = new SamplingOptions(1000).withSeed(42);
        SampledExpectation first = ExpectationSampler.estimate(plus, twice, options);
        SampledExpectation second = ExpectationSampler.estimate(plus, twice, options);
        assertEquals(first, second);
        assertNotEquals(first.terms().get(0).mean(), first.terms().get(1).mean(),
                "identical terms must not replay the same random stream");

        AtomicInteger factoryCalls = new AtomicInteger();
        ExpectationSampler.estimate(plus, sum(1, "Z", 1, "X", 1, "Z"), new SamplingOptions(10).withRandomSource(() -> {
            factoryCalls.incrementAndGet();
            return new Random(1)::nextDouble;
        }));
        assertEquals(1, factoryCalls.get());
    }

    @Test
    void workBudgetCoversAllTermsBeforeAnyShot() {
        Circuit plus = circuit(1, 0, new Hadamard(0));
        // Each Z term: 100 shots * 2 amplitudes * (1 + 1 gate index) = 400 visits.
        AtomicInteger factoryCalls = new AtomicInteger();
        SamplingOptions tight = new SamplingOptions(100).withRandomSource(() -> {
            factoryCalls.incrementAndGet();
            return new Random(1)::nextDouble;
        });
        ExpectationSampler.estimate(plus, sum(1, "Z"), tight.withMaxWork(400));
        ExpectationSampler.estimate(plus, sum(1, "Z", 1, "Z"), tight.withMaxWork(800));
        factoryCalls.set(0);
        assertThrows(JQApiLimitException.class, () -> ExpectationSampler.estimate(plus, sum(1, "Z", 1, "Z"), tight.withMaxWork(799)));
        assertEquals(0, factoryCalls.get(), "no shot may run when the total budget is exceeded");
    }

    @Test
    void hugeFiniteCoefficientsKeepAFiniteStandardError() {
        double c = 1e200;
        assertEquals(0, estimate(circuit(1, 0), sum(c, "I"), 10, 1).standardError(), 0);
        assertEquals(0, estimate(circuit(1, 0), sum(c, "Z"), 10, 1).standardError(), 0);
        SampledExpectation plus = estimate(circuit(1, 0, new Hadamard(0)), sum(c, "Z", c, "X"), 100, 1);
        double expected = c * Math.sqrt(plus.terms().get(0).variance() + plus.terms().get(1).variance());
        assertTrue(Double.isFinite(plus.standardError()));
        assertEquals(expected, plus.standardError(), expected * 1e-12);
    }

    @Test
    void rejectsEstimatesOutsideTheDoubleRange() {
        assertThrows(JQApiLimitException.class, () -> estimate(circuit(1, 0), sum(1e308, "I", 1e308, "I"), 10, 1));
        assertThrows(JQApiLimitException.class, () -> estimate(circuit(1, 0), sum(1e308, "Z", 1e308, "I"), 10, 1));
    }

    @Test
    void identityOnlyObservablesStillValidateTheInitialState() {
        Circuit one = circuit(1, 0);
        PauliSum identity = sum(1, "I");
        SamplingOptions options = new SamplingOptions(10).withSeed(1);
        ComplexVector wrongDimension = new ComplexVector(new Complex[]{Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO});
        ComplexVector unnormalized = new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE});
        ComplexVector nan = new ComplexVector(new Complex[]{new Complex(Double.NaN, 0), Complex.ZERO});
        assertThrows(IllegalArgumentException.class, () -> ExpectationSampler.estimate(one, identity, options, wrongDimension));
        assertThrows(IllegalArgumentException.class, () -> ExpectationSampler.estimate(one, identity, options, unnormalized));
        assertThrows(IllegalArgumentException.class, () -> ExpectationSampler.estimate(one, identity, options, nan));
    }

    @Test
    void validatesInputs() {
        Circuit one = circuit(1, 0);
        PauliSum z = sum(1, "Z");
        SamplingOptions options = new SamplingOptions(10).withSeed(1);
        assertThrows(IllegalArgumentException.class, () -> ExpectationSampler.estimate(one, sum(1, "ZZ"), options));
        assertThrows(IllegalArgumentException.class, () -> ExpectationSampler.estimate(one, z, new SamplingOptions(1)));
        assertThrows(NullPointerException.class, () -> ExpectationSampler.estimate(null, z, options));
        assertThrows(NullPointerException.class, () -> ExpectationSampler.estimate(one, null, options));
        assertThrows(NullPointerException.class, () -> ExpectationSampler.estimate(one, z, null));
        assertThrows(NullPointerException.class, () -> ExpectationSampler.estimate(one, z, options, null));
    }
}
