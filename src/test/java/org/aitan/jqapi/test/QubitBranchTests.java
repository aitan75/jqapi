package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class QubitBranchTests {

    @Test @DisplayName("QubitZero all branches")
    void qubitZero() {
        QubitZero z = new QubitZero();
        assertEquals(1.0, z.zeroProbability());
        assertEquals(0.0, z.oneProbability());
        assertNotNull(z.toString());
        assertEquals(z, new QubitZero());
        assertEquals(z.hashCode(), z.hashCode());
    }

    @Test @DisplayName("QubitOne all branches")
    void qubitOne() {
        QubitOne o = new QubitOne();
        assertEquals(0.0, o.zeroProbability());
        assertEquals(1.0, o.oneProbability());
        assertEquals(2, o.getValue().getDimension());
    }

    @Test @DisplayName("QubitSuperposition branches")
    void superposition() {
        QubitSuperposition s = new QubitSuperposition(0.6);
        assertTrue(s.zeroProbability() > 0);

        QubitSuperposition s2 = new QubitSuperposition(new org.aitan.jqapi.math.Complex(0.7071, 0));
        assertNotNull(s2);

        assertThrows(IllegalArgumentException.class, () -> new QubitSuperposition(new org.aitan.jqapi.math.ComplexVector(new org.aitan.jqapi.math.Complex[]{org.aitan.jqapi.math.Complex.ONE})));
        assertThrows(IllegalArgumentException.class, () -> new QubitSuperposition(new org.aitan.jqapi.math.ComplexVector(new org.aitan.jqapi.math.Complex[]{org.aitan.jqapi.math.Complex.ZERO, org.aitan.jqapi.math.Complex.ZERO})));
    }
}
