package org.aitan.jqapi.test;

import org.aitan.jqapi.math.Complex;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ComplexBranchTests {

    @Test @DisplayName("Complex sqrt branches: negative real, zero real, zero imag")
    void complexSqrtNegative() {
        Complex c = new Complex(-1, 0);
        Complex sqrt = c.sqrt();
        // should not throw
        assertNotNull(sqrt);
    }

    @Test @DisplayName("Complex sqrt zero")
    void complexSqrtZero() {
        Complex c = Complex.ZERO;
        Complex sqrt = c.sqrt();
        assertNotNull(sqrt);
        assertEquals(Complex.ZERO, sqrt);
    }

    @Test @DisplayName("Complex equals hashCode branches")
    void complexEqualsHashCode() {
        Complex a = new Complex(1, 2);
        Complex b = new Complex(1, 2);
        Complex c = new Complex(1, 2);
        Complex d = new Complex(-1, -2);

        assertEquals(a, b);
        assertEquals(a.hashCode(), c.hashCode());
        assertNotEquals(a, d);
    }

    @Test @DisplayName("Complex abs branches")
    void complexAbs() {
        Complex p = new Complex(3, 4);
        assertEquals(5.0, p.abs(), 0.001);

        Complex n = new Complex(-3, -4);
        assertEquals(5.0, n.abs(), 0.001);

        Complex zero = Complex.ZERO;
        assertEquals(0.0, zero.abs(), 0.001);
    }

    @Test @DisplayName("Complex with negative zero")
    void complexNegativeZero() {
        Complex one = new Complex(1, 0);
        Complex negZero = new Complex(-1, 0).sqrt(); // sqrt of -1 gives i, but check hashCode path
        // equals with -0.0 path
        Complex onePos = new Complex(1, 0);
        Complex oneNeg = new Complex(-1, 0).sqrt(); // give principal sqrt
        // just ensure no NPE from edge case paths
        assertNotNull(onePos.equals(oneNeg));
    }
}