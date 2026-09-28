package org.aitan.jqapi.test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.*;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser;
import org.junit.jupiter.api.Test;
import static org.aitan.jqapi.test.ClassicalTestSupport.circuit;
import static org.junit.jupiter.api.Assertions.*;

/** Independent references and analytic contracts; no external simulator at test time. */
class ScientificReferenceTest {
    private static final double EPSILON = 1e-12;
    private static final int SHOTS = 10_000;
    private static final long SEED = 112;
    // Hoeffding + union bound: 2*k*exp(-2*N*epsilon^2), k <= 8, < 2.5e-7.
    private static final double FREQUENCY_TOLERANCE = 0.03;

    @Test
    void analyticComplexBellStateAndNonAdjacentQubitOrder() {
        double amplitude = 1 / Math.sqrt(2);
        var expected = zeroVector(8);
        expected.setEntry(0, new Complex(amplitude, 0));
        expected.setEntry(5, new Complex(0, amplitude));
        assertState(expected, simulate(circuit(3, 0, new Hadamard(0),
                new ControlledNot(0, 2), new Phase(Math.PI / 2, 2))), false);
    }

    @Test
    void controlledBasePhaseBecomesRelativeAndMustNotBeDiscarded() {
        // P(pi)|1> = -|1>; controlled-P produces phase kickback on q0.
        var expected = zeroVector(8);
        expected.setEntry(1, new Complex(1 / Math.sqrt(2), 0));
        expected.setEntry(5, new Complex(-1 / Math.sqrt(2), 0));
        assertState(expected, simulate(circuit(3, 0, new PauliX(2), new Hadamard(0),
                new MultiControlled(new Phase(Math.PI, 2).getMatrix(), 1, 0, 2))), false);
    }

    @Test
    void independentAsymmetricStateMatchesUpToOneGlobalPhase() throws IOException {
        var actual = simulate(referenceCircuit("asymmetric-unitary"));
        assertState(readVector("asymmetric-unitary.state"), actual, true);
        assertProbabilities(readNumbers("asymmetric-unitary.probabilities"), actual);
    }

    @Test
    void independentControlledOperatorMatchesEveryColumnWithExactPhase() throws IOException {
        var circuit = referenceCircuit("controlled-operator");
        var matrix = readVector("controlled-operator.operator");
        assertEquals(64, matrix.getDimension());
        for (int column = 0; column < 8; column++) {
            var input = zeroVector(8);
            input.setEntry(column, Complex.ONE);
            var simulator = new LocalSimulator(circuit, input, () -> 0.5);
            simulator.execute();
            var expected = zeroVector(8);
            for (int row = 0; row < 8; row++) expected.setEntry(row, matrix.getEntry(row * 8 + column));
            // Never independently phase-align operator columns.
            assertState(expected, simulator.getQuantumRegister().getRegisterState(), false);
        }
    }

    @Test
    void biasedMeasurementMatchesIndependentQuantumAndClassicalDistributions() throws IOException {
        // Ry(pi/3)|0> = sqrt(3)/2 |0> + 1/2 |1>, with q2 fixed to 1.
        assertArrayEquals(new double[]{0, 0.75, 0, 0, 0, 0.25, 0, 0},
                readNumbers("biased-measurement.probabilities"), EPSILON);
        assertArrayEquals(new double[]{0, 0, 0.75, 0.25, 0, 0, 0, 0},
                readNumbers("biased-measurement.classical-probabilities"), EPSILON);
        var circuit = referenceCircuit("biased-measurement");
        var options = new SamplingOptions(SHOTS).withSeed(SEED).withClassicalBits(0, 1, 2);
        var result = CircuitSampler.sample(circuit, options);
        assertDistribution(readNumbers("biased-measurement.probabilities"), result.counts());
        assertDistribution(readNumbers("biased-measurement.classical-probabilities"), result.classicalCounts());
        var repeated = CircuitSampler.sample(circuit, options);
        assertArrayEquals(result.counts(), repeated.counts());
        assertArrayEquals(result.classicalCounts(), repeated.classicalCounts());
    }

    @Test
    void measurementCollapseAndStoredBitsFollowBornBranchesBeforeReset() {
        Circuit bell = circuit(3, 2, new Hadamard(0), new ControlledNot(0, 2),
                Measurement.into(0, 1), new Reset(0), Measurement.into(2, 0));
        for (int outcome = 0; outcome <= 1; outcome++) {
            double draw = outcome == 0 ? 0.25 : 0.75;
            var simulator = new LocalSimulator(bell, () -> draw);
            simulator.execute();
            var expected = zeroVector(8);
            expected.setEntry(outcome, Complex.ONE);
            assertState(expected, simulator.getQuantumRegister().getRegisterState(), false);
            assertEquals(outcome, simulator.extractClassicalRecords().get(0).bit());
            assertEquals(outcome, simulator.extractClassicalRecords().get(1).bit());
        }
    }

    @Test
    void comparisonContractAcceptsOnlyOneUnitGlobalPhaseForPhysicalStates() {
        double a = 1 / Math.sqrt(2);
        var expected = new ComplexVector(new Complex[]{new Complex(a, 0), new Complex(a, 0)});
        var phased = new ComplexVector(new Complex[]{new Complex(0, a), new Complex(0, a)});
        assertState(expected, phased, true);
        assertThrows(AssertionError.class, () -> assertState(expected, phased, false));
        var relativePhase = new ComplexVector(new Complex[]{new Complex(a, 0), new Complex(-a, 0)});
        assertThrows(AssertionError.class, () -> assertState(expected, relativePhase, true));
        assertThrows(AssertionError.class, () -> assertState(expected, zeroVector(2), true));
        var scaled = new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE});
        assertThrows(AssertionError.class, () -> assertState(expected, scaled, true));
        var nonfinite = new ComplexVector(new Complex[]{new Complex(Double.NaN, 0), Complex.ONE});
        assertThrows(AssertionError.class, () -> assertState(expected, nonfinite, true));
        assertThrows(AssertionError.class, () -> assertState(expected, zeroVector(4), true));
    }

    private static Circuit referenceCircuit(String name) throws IOException {
        return CircuitSpecs.toCircuit(OpenQasmParser.parse(resource(name + ".qasm")), JQAPIConfig.sequential(3));
    }

    private static ComplexVector simulate(Circuit circuit) {
        var simulator = new LocalSimulator(circuit, () -> 0.5);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    private static ComplexVector zeroVector(int size) {
        Complex[] values = new Complex[size];
        Arrays.fill(values, Complex.ZERO);
        return new ComplexVector(values);
    }

    private static String resource(String name) throws IOException {
        try (var input = ScientificReferenceTest.class.getResourceAsStream("/scientific/" + name)) {
            assertNotNull(input, name);
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static double[] readNumbers(String name) throws IOException {
        return resource(name).lines().mapToDouble(Double::parseDouble).toArray();
    }

    private static ComplexVector readVector(String name) throws IOException {
        return new ComplexVector(resource(name).lines().map(line -> {
            String[] fields = line.split("\\s+");
            return new Complex(Double.parseDouble(fields[0]), Double.parseDouble(fields[1]));
        }).toArray(Complex[]::new));
    }

    private static void assertState(ComplexVector expected, ComplexVector actual, boolean globalPhase) {
        assertEquals(expected.getDimension(), actual.getDimension());
        double expectedNorm = 0, actualNorm = 0, overlapRe = 0, overlapIm = 0;
        for (int i = 0; i < expected.getDimension(); i++) {
            var e = expected.getEntry(i);
            var a = actual.getEntry(i);
            expectedNorm += e.getReal() * e.getReal() + e.getImaginary() * e.getImaginary();
            actualNorm += a.getReal() * a.getReal() + a.getImaginary() * a.getImaginary();
            overlapRe += e.getReal() * a.getReal() + e.getImaginary() * a.getImaginary();
            overlapIm += e.getReal() * a.getImaginary() - e.getImaginary() * a.getReal();
        }
        assertEquals(1, expectedNorm, EPSILON, "reference norm squared");
        assertEquals(1, actualNorm, EPSILON, "actual norm squared");
        double phaseRe = 1, phaseIm = 0;
        if (globalPhase) {
            double magnitude = Math.hypot(overlapRe, overlapIm);
            assertTrue(magnitude > EPSILON, "states must overlap to align phase");
            phaseRe = overlapRe / magnitude;
            phaseIm = overlapIm / magnitude;
        }
        double maxError = 0;
        for (int i = 0; i < expected.getDimension(); i++) {
            var e = expected.getEntry(i);
            var a = actual.getEntry(i);
            maxError = Math.max(maxError, Math.hypot(
                    a.getReal() - (e.getReal() * phaseRe - e.getImaginary() * phaseIm),
                    a.getImaginary() - (e.getReal() * phaseIm + e.getImaginary() * phaseRe)));
        }
        assertTrue(maxError <= EPSILON, "max complex-amplitude error = " + maxError);
    }

    private static void assertProbabilities(double[] expected, ComplexVector actual) {
        assertEquals(expected.length, actual.getDimension());
        for (int i = 0; i < expected.length; i++) {
            double magnitude = actual.getEntry(i).abs();
            assertEquals(expected[i], magnitude * magnitude, EPSILON, "probability " + i);
        }
    }

    private static void assertDistribution(double[] expected, int[] counts) {
        assertEquals(expected.length, counts.length);
        assertEquals(SHOTS, Arrays.stream(counts).sum());
        assertEquals(1, Arrays.stream(expected).sum(), EPSILON);
        for (int i = 0; i < counts.length; i++) {
            assertTrue(counts[i] >= 0);
            if (expected[i] == 0) assertEquals(0, counts[i], "impossible outcome " + i);
            assertEquals(expected[i], counts[i] / (double) SHOTS, FREQUENCY_TOLERANCE, "frequency " + i);
        }
    }
}
