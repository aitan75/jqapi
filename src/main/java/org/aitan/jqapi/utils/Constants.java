package org.aitan.jqapi.utils;

import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;

/**
 *
 * @author Gaetano Ferrara
 */
public class Constants {

    private Constants() {
    }

    
    private static final double HALF_VALUE = 1. / Math.sqrt(2.);
    public static final Complex HALF_COMPLEX = new Complex(HALF_VALUE, 0.d);
    public static final Complex HALF_NEGATIVE_COMPLEX = new Complex(-HALF_VALUE, 0.d);
    public static final String ZERO_QUANTUM = "|0>";
    public static final String ONE_QUANTUM = "|1>";
    public static final String PSI_QUANTUM = "|ψ>";
    public static final String MEASUREMENT = "M";
    public static final String RESET = "RST";
    public static final String PROBABILITIES = "P";
    public static final String ORACLE = "Oracle";
    public static final String CZ = "CZ";
    public static final String MCZ = "MCZ";
    public static final String CY = "CY";
    public static final String CNot = "CNot";
    public static final String PAULI_X = "X";
    public static final String PAULI_S = "S";
    public static final String PAULI_T = "T";
    public static final String PAULI_Y = "Y";
    public static final String PAULI_Z = "Z";
    public static final String HADAMARD = "H";
    public static final String IDENTITY = "I";
    public static final String SWAP = "Swap";
    public static final String CONTROLLED_SWAP = "CSwap";
    public static final String TOFFOLI = "TOFF";
    public static final String RX = "Rx";
    public static final String RY = "Ry";
    public static final String RZ = "Rz";
    public static final String PHASE = "P";
    public static final String U3 = "U3";
    public static final String MULTI_CONTROLLED = "MC";

    public static final ComplexMatrix CONTROLLED_NOT_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE},
        {Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO}});

    public static final ComplexMatrix CONTROLLED_Z_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE.multiply(-1)}});

    public static final ComplexMatrix CONTROLLED_Y_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.I.multiply(-1)},
        {Complex.ZERO, Complex.ZERO, Complex.I, Complex.ZERO}});

    public static final ComplexMatrix SWAP_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE}});

    public static final ComplexMatrix TOFFOLI_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO}});

    public static final ComplexMatrix CONTROLLED_SWAP_MATRIX
            = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO},
        {Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE}});

    public static final ComplexMatrix HADAMARD_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Constants.HALF_COMPLEX, Constants.HALF_COMPLEX},
        {Constants.HALF_COMPLEX, Constants.HALF_NEGATIVE_COMPLEX}});

    public static final ComplexMatrix PAULI_S_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO},
        {Complex.ZERO, Complex.I}});

    public static final ComplexMatrix PAULI_T_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO},
        {Complex.ZERO, new Complex(Math.cos(Math.PI / 4), (Math.sin(Math.PI / 4)))}});

    public static final ComplexMatrix PAULI_X_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ZERO, Complex.ONE},
        {Complex.ONE, Complex.ZERO}});

    public static final ComplexMatrix PAULI_Y_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ZERO, Complex.I.multiply(-1)},
        {Complex.I, Complex.ZERO}});

    public static final ComplexMatrix PAULI_Z_MATRIX = ComplexMatrix.createMatrixWithData(new Complex[][]{
        {Complex.ONE, Complex.ZERO},
        {Complex.ZERO, Complex.ONE.multiply(-1d)}});

    /** @param theta angle in radians @return the Rx(theta) rotation matrix */
    public static ComplexMatrix rotationXMatrix(double theta) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        Complex diag = new Complex(c, 0);
        Complex offDiag = new Complex(0, -s); // -i sin(theta/2)
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {diag, offDiag},
            {offDiag, diag}});
    }

    /** @param theta angle in radians @return the Ry(theta) rotation matrix */
    public static ComplexMatrix rotationYMatrix(double theta) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {new Complex(c, 0), new Complex(-s, 0)},
            {new Complex(s, 0), new Complex(c, 0)}});
    }

    /** @param theta angle in radians @return the Rz(theta) rotation matrix */
    public static ComplexMatrix rotationZMatrix(double theta) {
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {Complex.expI(-theta / 2), Complex.ZERO},
            {Complex.ZERO, Complex.expI(theta / 2)}});
    }

    /** @param theta angle in radians @return the phase-shift P(theta) matrix */
    public static ComplexMatrix phaseMatrix(double theta) {
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {Complex.ONE, Complex.ZERO},
            {Complex.ZERO, Complex.expI(theta)}});
    }

    /** @return the universal single-qubit U3(theta, phi, lambda) matrix */
    public static ComplexMatrix u3Matrix(double theta, double phi, double lambda) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        Complex m00 = new Complex(c, 0);
        Complex m01 = Complex.expI(lambda).multiply(-s);
        Complex m10 = Complex.expI(phi).multiply(s);
        Complex m11 = Complex.expI(phi + lambda).multiply(c);
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {m00, m01},
            {m10, m11}});
    }
}
