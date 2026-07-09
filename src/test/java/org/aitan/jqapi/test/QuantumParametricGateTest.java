package org.aitan.jqapi.test;

import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumParametricGateTest {

    private static final double TOL = 1e-9;

    private static void assertComplex(Complex expected, Complex actual) {
        assertEquals(expected.getReal(), actual.getReal(), TOL, "real part");
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOL, "imag part");
    }

    private static ComplexMatrix dagger(ComplexMatrix m) {
        Complex[][] d = new Complex[2][2];
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                Complex e = m.getEntry(c, r);
                d[r][c] = new Complex(e.getReal(), -e.getImaginary());
            }
        }
        return ComplexMatrix.createMatrixWithData(d);
    }

    private static Complex[][] mul2x2(ComplexMatrix a, ComplexMatrix b) {
        Complex[][] p = new Complex[2][2];
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                Complex sum = Complex.ZERO;
                for (int k = 0; k < 2; k++) {
                    sum = sum.add(a.getEntry(r, k).multiply(b.getEntry(k, c)));
                }
                p[r][c] = sum;
            }
        }
        return p;
    }

    private static void assertMatrix2(ComplexMatrix expected, ComplexMatrix actual) {
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                assertComplex(expected.getEntry(r, c), actual.getEntry(r, c));
            }
        }
    }

    private static void assertIdentity2(Complex[][] m) {
        assertComplex(Complex.ONE, m[0][0]);
        assertComplex(Complex.ZERO, m[0][1]);
        assertComplex(Complex.ZERO, m[1][0]);
        assertComplex(Complex.ONE, m[1][1]);
    }

    @Test
    void expI_returnsUnitCirclePoints() {
        assertComplex(new Complex(1, 0), Complex.expI(0));
        assertComplex(new Complex(0, 1), Complex.expI(Math.PI / 2));
        assertComplex(new Complex(-1, 0), Complex.expI(Math.PI));
    }
}
