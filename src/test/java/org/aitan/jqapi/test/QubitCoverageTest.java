package org.aitan.jqapi.test;

import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.utils.Constants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class QubitCoverageTest {

    @Test @DisplayName("Qubit zeroProbability/oneProbability branches")
    void qubitBaseProbabilities() {
        // QubitZero => |0>
        assertEquals(1.0, new QubitZero().zeroProbability());
        assertEquals(0.0, new QubitZero().oneProbability());

        // QubitOne => |1>
        assertEquals(0.0, new QubitOne().zeroProbability());
        assertEquals(1.0, new QubitOne().oneProbability());

        // QubitSuperposition with alpha=0 => |1> (vector [0,1])
        Qubit zero = new QubitSuperposition(0.0);
        assertEquals(0.0, zero.zeroProbability());
        assertEquals(1.0, zero.oneProbability());

        // QubitSuperposition with alpha=1 => |0>
        Qubit one = new QubitSuperposition(1.0);
        assertEquals(1.0, one.zeroProbability());
        assertEquals(0.0, one.oneProbability());

        // QubitSuperposition with alpha=0.5 => superposition
        Qubit half = new QubitSuperposition(0.5);
        assertTrue(half.zeroProbability() > 0 && half.zeroProbability() < 1);
        assertTrue(half.oneProbability() > 0 && half.oneProbability() < 1);
    }

    @Test @DisplayName("Qubit equals hashCode branches")
    void qubitEqualsHashCode() {
        Qubit q1 = new QubitSuperposition(0.6);
        Qubit q2 = new QubitSuperposition(0.6);
        Qubit q3 = new QubitSuperposition(0.7);
        QubitZero z = new QubitZero();
        QubitOne o = new QubitOne();

        assertEquals(q1, q2); // same state
        assertNotEquals(q1, q3);
        assertNotEquals(q1, z);
        assertNotEquals(q1, o);
        assertNotEquals(q1, null);
        assertNotEquals(q1, new Object());

        // hashCode normalization of -0.0
        Complex minusZeroReal = new Complex(-0.0, 0.0);
        Complex plusZeroReal = new Complex(0.0, 0.0);
        Qubit qmz = new QubitSuperposition(minusZeroReal);
        Qubit qpz = new QubitSuperposition(plusZeroReal);
        assertEquals(-0.0, qmz.getValue().getEntry(0).getReal(), 0.0);
        // hashCode should treat -0.0 as 0.0
        assertEquals(qmz.hashCode(), qpz.hashCode());

        // toString branches: zero vs non-zero components
        Qubit zeroQ = new QubitOne(); // |1> => vector [0,1]
        Qubit oneQ = new QubitZero(); // |0> => vector [1,0]
        // zeroQ: entry0 is Complex.ZERO => contains "1" (|1>)
        assertTrue(zeroQ.toString().contains(Constants.ONE_QUANTUM));
        // oneQ: entry1 is Complex.ZERO => contains "0" (|0>)
        assertTrue(oneQ.toString().contains(Constants.ZERO_QUANTUM));

        // Superposition state
        QubitSuperposition superPos = new QubitSuperposition(0.5);
        assertTrue(superPos.toString().contains("+")); // both components non-zero
    }

    @Test @DisplayName("Qubit vector getter")
    void qubitGetValue() {
        Qubit q = new QubitSuperposition(0.3);
        assertNotNull(q.getValue());
        assertEquals(2, q.getValue().getDimension());
    }
}