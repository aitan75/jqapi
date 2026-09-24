package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.classical.*;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.aitan.jqapi.test.ClassicalTestSupport.*;

class Issue110IndependentShotsTest {
    @Test
    void shotsStartWithZeroRecordsAndAggregateStoredOutcomesBeforeFinalReadout() {
        Circuit c = circuit(2, 2, new ConditionalGate(new PauliX(1), new Condition(0, 1)),
                new Hadamard(0), Measurement.into(0, 0), new Reset(0));
        SamplingOptions options = new SamplingOptions(100).withClassicalBits(1, 0).withSeed(110).withMaxWork(100_000).withMeasuredQubits(1);
        SamplingResult result = CircuitSampler.sample(c, options);
        assertArrayEquals(new int[]{100, 0}, result.counts());
        assertEquals(100, java.util.Arrays.stream(result.classicalCounts()).sum());
        assertTrue(result.classicalCounts()[0] > 0 && result.classicalCounts()[1] > 0);
        assertEquals(0, result.classicalCounts()[2] + result.classicalCounts()[3]);
        assertArrayEquals(result.classicalCounts(), CircuitSampler.sample(c, options).classicalCounts());
        assertArrayEquals(new int[]{1, 0}, result.classicalBits());
        result.classicalCounts()[0] = -1; result.classicalBits()[0] = -1;
        assertTrue(result.classicalCounts()[0] >= 0);
        assertEquals(1, result.classicalBits()[0]);
        assertArrayEquals(result.classicalCounts(), result.marginal(1).classicalCounts());
    }

    @Test
    void selectedClassicalOrderAndInitialStateHaveIndependentMeaning() {
        Circuit c = circuit(2, 2, Measurement.into(0, 1), Measurement.into(1, 0));
        ComplexVector state = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO});
        int[] selected = {1, 0};
        SamplingOptions options = new SamplingOptions(4).withClassicalBits(selected).withSeed(1);
        selected[0] = 0;
        assertArrayEquals(new int[]{0, 0, 4, 0}, CircuitSampler.sample(c, options, state).classicalCounts());
        assertThrows(IllegalArgumentException.class, () -> new SamplingOptions(1).withClassicalBits(0, 0));
        assertThrows(IllegalArgumentException.class, () -> CircuitSampler.sample(c, new SamplingOptions(1).withClassicalBits(2)));
        Circuit large = circuit(1, 24);
        int[] all = java.util.stream.IntStream.range(0, 24).toArray();
        assertThrows(org.aitan.jqapi.exceptions.JQApiLimitException.class,
                () -> CircuitSampler.sample(large, new SamplingOptions(1).withClassicalBits(all).withMaxWork(100)));
    }
}
