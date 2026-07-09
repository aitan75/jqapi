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

    @Test
    void rotationX_matchesFormula() {
        // Rx(0) = I
        assertMatrix2(ComplexMatrix.createIdentityMatrix(2),
                org.aitan.jqapi.utils.Constants.rotationXMatrix(0));
        // Rx(pi) = [[0, -i],[-i, 0]]  (= -i * X)
        ComplexMatrix rx = org.aitan.jqapi.utils.Constants.rotationXMatrix(Math.PI);
        assertComplex(new Complex(0, 0), rx.getEntry(0, 0));
        assertComplex(new Complex(0, -1), rx.getEntry(0, 1));
        assertComplex(new Complex(0, -1), rx.getEntry(1, 0));
        assertComplex(new Complex(0, 0), rx.getEntry(1, 1));
    }

    @Test
    void rotationY_matchesFormula() {
        // Ry(pi) = [[0, -1],[1, 0]]
        ComplexMatrix ry = org.aitan.jqapi.utils.Constants.rotationYMatrix(Math.PI);
        assertComplex(new Complex(0, 0), ry.getEntry(0, 0));
        assertComplex(new Complex(-1, 0), ry.getEntry(0, 1));
        assertComplex(new Complex(1, 0), ry.getEntry(1, 0));
        assertComplex(new Complex(0, 0), ry.getEntry(1, 1));
    }

    @Test
    void rotationZ_matchesFormula() {
        // Rz(pi) = diag(e^{-i pi/2}, e^{i pi/2}) = diag(-i, i)
        ComplexMatrix rz = org.aitan.jqapi.utils.Constants.rotationZMatrix(Math.PI);
        assertComplex(new Complex(0, -1), rz.getEntry(0, 0));
        assertComplex(new Complex(0, 0), rz.getEntry(0, 1));
        assertComplex(new Complex(0, 0), rz.getEntry(1, 0));
        assertComplex(new Complex(0, 1), rz.getEntry(1, 1));
    }

    @Test
    void phase_matchesFormula() {
        // P(pi/2) = diag(1, i)
        ComplexMatrix p = org.aitan.jqapi.utils.Constants.phaseMatrix(Math.PI / 2);
        assertComplex(Complex.ONE, p.getEntry(0, 0));
        assertComplex(Complex.ZERO, p.getEntry(0, 1));
        assertComplex(Complex.ZERO, p.getEntry(1, 0));
        assertComplex(new Complex(0, 1), p.getEntry(1, 1));
    }

    @Test
    void unitarity_UtimesUDagger_isIdentity() {
        double[] angles = {0.3, 1.0, Math.PI / 2, Math.PI, 2.0};
        for (double a : angles) {
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationXMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationXMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationYMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationYMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationZMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationZMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.phaseMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.phaseMatrix(a))));
        }
        assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.u3Matrix(1.0, 0.5, 2.0),
                dagger(org.aitan.jqapi.utils.Constants.u3Matrix(1.0, 0.5, 2.0))));
    }

    @Test
    void u3_knownEquivalences() {
        // U3(pi, 0, pi) = X
        assertMatrix2(org.aitan.jqapi.utils.Constants.PAULI_X_MATRIX,
                org.aitan.jqapi.utils.Constants.u3Matrix(Math.PI, 0, Math.PI));
        // U3(pi/2, 0, pi) = H
        assertMatrix2(org.aitan.jqapi.utils.Constants.HADAMARD_MATRIX,
                org.aitan.jqapi.utils.Constants.u3Matrix(Math.PI / 2, 0, Math.PI));
        // U3(0, 0, lambda) = P(lambda)
        double lambda = 0.7;
        assertMatrix2(org.aitan.jqapi.utils.Constants.phaseMatrix(lambda),
                org.aitan.jqapi.utils.Constants.u3Matrix(0, 0, lambda));
    }

    @Test
    void rz_isPhaseUpToGlobalPhase() {
        // Rz(theta) = e^{-i theta/2} * P(theta), entrywise
        double theta = 1.3;
        ComplexMatrix rz = org.aitan.jqapi.utils.Constants.rotationZMatrix(theta);
        ComplexMatrix p = org.aitan.jqapi.utils.Constants.phaseMatrix(theta);
        Complex global = Complex.expI(-theta / 2);
        assertComplex(p.getEntry(0, 0).multiply(global), rz.getEntry(0, 0));
        assertComplex(p.getEntry(1, 1).multiply(global), rz.getEntry(1, 1));
    }
}
