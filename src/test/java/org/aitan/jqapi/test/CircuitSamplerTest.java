package org.aitan.jqapi.test;

import java.util.Arrays;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.DoubleSupplier;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CircuitSamplerTest {
    private static Circuit circuit(int size, Gate... gates) {
        Circuit circuit = new Circuit(size, JQAPIConfig.sequential(24));
        for (Gate gate : gates) {
            CircuitLevel level = new CircuitLevel();
            level.addGate(gate);
            circuit.addLevel(level);
        }
        return circuit;
    }

    private static SamplingOptions seeded(int shots) {
        return new SamplingOptions(shots).withSeed(107);
    }

    @Test
    void basisCountsUseMsbAndDefaultSecureSource() {
        SamplingResult result = CircuitSampler.sample(circuit(3, new PauliX(0)), new SamplingOptions(17));
        assertArrayEquals(new int[]{0, 0, 0, 0, 17, 0, 0, 0}, result.counts());
        assertEquals(17, result.shots());
        assertArrayEquals(new int[]{0, 1, 2}, result.measuredQubits());
        assertEquals(1, CircuitSampler.sample(circuit(1), seeded(1)).counts()[0]);
        assertEquals(10_000, CircuitSampler.sample(circuit(1), seeded(10_000)).counts()[0]);
    }

    @Test
    void bellSeedReproducesCountsAcrossCallsAndIgnoresOtherSimulations() {
        Circuit bell = circuit(2, new Hadamard(0), new ControlledNot(0, 1));
        SamplingOptions options = seeded(4096);
        int[] counts = CircuitSampler.sample(bell, options).counts();
        CircuitSampler.sample(bell, options.withSeed(999));
        new QuantumRegister(1).measure();
        assertArrayEquals(counts, CircuitSampler.sample(bell, options).counts());
        assertEquals(4096, Arrays.stream(counts).sum());
        assertEquals(0, counts[1] + counts[2]);
        assertEquals(2048, counts[0], 150);
    }

    @Test
    void selectedQubitsAndMarginalsRespectRequestedPhysicalOrder() {
        Circuit state = circuit(3, new PauliX(0), new Hadamard(1));
        SamplingResult full = CircuitSampler.sample(state, seeded(2048));
        SamplingResult marginal = full.marginal(2, 0);
        assertArrayEquals(new int[]{0, 2048, 0, 0}, marginal.counts());
        assertArrayEquals(new int[]{2, 0}, marginal.measuredQubits());
        assertEquals(2048, marginal.shots());
        assertArrayEquals(full.marginal(1, 0).counts(),
                CircuitSampler.sample(state, seeded(2048).withMeasuredQubits(1, 0)).counts());
        assertEquals(1024, full.marginal(1).counts()[0], 120);
        assertArrayEquals(new int[]{0, 2048}, marginal.marginal(0).counts());
    }

    @Test
    void optionsAndResultsDefensivelyCopyIndexesAndCounts() {
        int[] indexes = {1, 0};
        SamplingOptions options = seeded(10).withMeasuredQubits(indexes);
        indexes[0] = 0;
        SamplingResult result = CircuitSampler.sample(circuit(2, new PauliX(0)), options);
        result.counts()[1] = 0;
        result.measuredQubits()[0] = 0;
        assertArrayEquals(new int[]{0, 10, 0, 0}, result.counts());
        assertArrayEquals(new int[]{1, 0}, result.measuredQubits());
    }

    @Test
    void everyShotStartsFromSpecifiedComplexStateAndDoesNotMutateIt() {
        double a = 1 / Math.sqrt(2);
        ComplexVector state = new ComplexVector(new Complex[]{new Complex(a, 0), new Complex(0, a)});
        Circuit circuit = circuit(1, new PauliS(0), new Hadamard(0));
        assertArrayEquals(new int[]{0, 100}, CircuitSampler.sample(circuit, seeded(100), state).counts());
        assertEquals(a, state.getEntry(0).getReal());
        assertEquals(a, state.getEntry(1).getImaginary());
        LocalSimulator simulator = new LocalSimulator(circuit, state, () -> 0.5);
        state.setEntry(0, Complex.ZERO);
        simulator.execute();
        simulator.getQuantumRegister().measure();
        assertEquals(1.0, simulator.getQuantumRegister().getRegisterState().getEntry(1).getReal());
        assertThrows(IllegalStateException.class, () -> simulator.getQuantumRegister().getInput());
        ComplexVector one = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ONE});
        assertArrayEquals(new int[]{100, 0}, CircuitSampler.sample(circuit(1, new PauliX(0)), seeded(100), one).counts());
    }

    @Test
    void entangledInitialStateSupportsMarginalSampling() {
        double a = 1 / Math.sqrt(2);
        ComplexVector state = new ComplexVector(new Complex[]{new Complex(a, 0), Complex.ZERO,
                Complex.ZERO, new Complex(0, a)});
        int[] counts = CircuitSampler.sample(circuit(2), seeded(4096), state).counts();
        assertEquals(0, counts[1] + counts[2]);
        assertEquals(2048, counts[0], 150);
    }

    @Test
    void midCircuitMeasurementsExecuteIndependentlyAndReadFinalState() {
        Circuit measured = circuit(1, new Hadamard(0), new Measurement(0), new Hadamard(0));
        int[] counts = CircuitSampler.sample(measured, seeded(4096)).counts();
        assertEquals(2048, counts[0], 150);
        assertEquals(4096, Arrays.stream(counts).sum());
        assertArrayEquals(counts, CircuitSampler.sample(measured, seeded(4096)).counts());
        Circuit flipped = circuit(1, new PauliX(0), new Measurement(0), new PauliX(0));
        assertArrayEquals(new int[]{100, 0}, CircuitSampler.sample(flipped, seeded(100)).counts());
    }

    @Test
    void partialMeasurementAndResetUseTheExecutionStreamOnEveryTrajectory() {
        for (Gate operation : new Gate[]{new Measurement(0), new Reset(0)}) {
            Circuit circuit = circuit(2, new Hadamard(0), new ControlledNot(0, 1), operation);
            AtomicInteger factories = new AtomicInteger();
            AtomicInteger draws = new AtomicInteger();
            SamplingOptions options = new SamplingOptions(4).withRandomSource(() -> {
                factories.incrementAndGet();
                return () -> {
                    int draw = draws.getAndIncrement();
                    return (draw / 2) % 2 == 0 ? 0.25 : 0.75;
                };
            });
            int[] counts = CircuitSampler.sample(circuit, options).counts();
            assertEquals(1, factories.get());
            assertEquals(8, draws.get());
            assertArrayEquals(operation instanceof Reset ? new int[]{2, 2, 0, 0} : new int[]{2, 0, 0, 2}, counts);
        }
    }

    @Test
    void resetOfEntangledQubitPreservesPartnersDistributionAcrossShots() {
        Circuit reset = circuit(2, new Hadamard(0), new ControlledNot(0, 1), new Reset(0));
        int[] counts = CircuitSampler.sample(reset, seeded(4096)).counts();
        assertEquals(0, counts[2] + counts[3]);
        assertEquals(2048, counts[0], 150);
        assertEquals(4096, Arrays.stream(counts).sum());
        assertArrayEquals(counts, CircuitSampler.sample(reset, seeded(4096)).counts());
    }

    @Test
    void randomFactoryCreatesAFreshStreamForEachExecution() {
        AtomicInteger factories = new AtomicInteger();
        SamplingOptions options = new SamplingOptions(100).withRandomSource(() -> {
            factories.incrementAndGet();
            return new Random(32)::nextDouble;
        });
        Circuit coin = circuit(1, new Hadamard(0));
        assertArrayEquals(CircuitSampler.sample(coin, options).counts(), CircuitSampler.sample(coin, options).counts());
        assertEquals(2, factories.get());
    }

    @Test
    void invalidPublicInputsAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> new SamplingOptions(0));
        assertThrows(IllegalArgumentException.class, () -> new SamplingOptions(-1));
        assertThrows(IllegalArgumentException.class, () -> new SamplingOptions(10_001));
        assertThrows(IllegalArgumentException.class, () -> seeded(1).withMaxWork(0));
        for (int[] indexes : new int[][]{{}, {-1}, {30}, {0, 0}, {0, 1, 2}}) {
            assertThrows(IllegalArgumentException.class,
                    () -> CircuitSampler.sample(circuit(2), seeded(1).withMeasuredQubits(indexes)));
        }
        assertThrows(IllegalArgumentException.class,
                () -> CircuitSampler.sample(circuit(2), seeded(1).withMeasuredQubits(2)));
        assertThrows(NullPointerException.class, () -> CircuitSampler.sample(null, seeded(1)));
        assertThrows(NullPointerException.class, () -> CircuitSampler.sample(circuit(1), null));
        assertThrows(NullPointerException.class, () -> seeded(1).withMeasuredQubits((int[]) null));
        assertThrows(NullPointerException.class, () -> seeded(1).withRandomSource(null));
        assertThrows(NullPointerException.class,
                () -> CircuitSampler.sample(circuit(1), seeded(1).withRandomSource(() -> null)));
        SamplingResult result = CircuitSampler.sample(circuit(2), seeded(1).withMeasuredQubits(1));
        assertThrows(IllegalArgumentException.class, () -> result.marginal(0));
        assertThrows(IllegalArgumentException.class, () -> result.marginal(1, 1));
        assertThrows(IllegalArgumentException.class, () -> result.marginal());
        assertThrows(NullPointerException.class, () -> result.marginal((int[]) null));
    }

    @Test
    void workBudgetRejectsBeforeRandomFactoryOrRegisterAllocationAndHandlesLargeProducts() {
        AtomicInteger factories = new AtomicInteger();
        SamplingOptions options = seeded(10_000).withRandomSource(() -> {
            factories.incrementAndGet();
            return () -> 0.5;
        });
        Circuit huge = circuit(24, new Hadamard(0));
        assertThrows(JQApiLimitException.class, () -> CircuitSampler.sample(huge, options));
        assertEquals(0, factories.get());
        assertThrows(JQApiLimitException.class,
                () -> CircuitSampler.sample(circuit(1, new Hadamard(0)), seeded(2).withMaxWork(7)));
        assertEquals(2, CircuitSampler.sample(circuit(1, new Hadamard(0)), seeded(2).withMaxWork(8)).shots());
        assertEquals(8, seeded(2).withMaxWork(8).maxWork());
    }

    @Test
    void invalidStateAndRandomValuesAreRejected() {
        for (ComplexVector state : new ComplexVector[]{new ComplexVector(3), new ComplexVector(2),
                new ComplexVector(new Complex[]{new Complex(Double.NaN, 0), Complex.ZERO}),
                new ComplexVector(new Complex[]{new Complex(Double.POSITIVE_INFINITY, 0), Complex.ZERO}),
                new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE})}) {
            assertThrows(IllegalArgumentException.class, () -> CircuitSampler.sample(circuit(1), seeded(1), state));
        }
        assertThrows(NullPointerException.class, () -> CircuitSampler.sample(circuit(1), seeded(1), null));
        for (double value : new double[]{-0.1, 1, Double.NaN, Double.POSITIVE_INFINITY}) {
            assertThrows(IllegalArgumentException.class, () -> CircuitSampler.sample(circuit(1),
                    seeded(1).withRandomSource(() -> () -> value)));
        }
        DoubleSupplier zero = () -> 0;
        assertEquals(1, CircuitSampler.sample(circuit(1, new PauliX(0)),
                seeded(1).withRandomSource(() -> zero)).counts()[1]);
    }
}
