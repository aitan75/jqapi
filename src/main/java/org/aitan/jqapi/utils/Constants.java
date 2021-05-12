/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.utils;

import org.aitan.jqapi.math.ComplexMatrix;
import org.apache.commons.math3.complex.Complex;

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
}
