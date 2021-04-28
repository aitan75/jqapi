/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.gates.Identity;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.linear.FieldVector;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class LinearAlgebraTest {

    public LinearAlgebraTest() {
    }

    @BeforeAll
    public static void setUpClass() {
    }

    @AfterAll
    public static void tearDownClass() {
    }

    @BeforeEach
    public void setUp() {
    }

    @AfterEach
    public void tearDown() {
    }

    @Test
    public void testLinearAlgebra() {
        testIdentityMatrix();
        testKroneckerProduct();
    }

    private void testIdentityMatrix() {
        ComplexMatrix result = ComplexMatrix.createIdentityMatrix(2);
        ComplexMatrix expResult = new Identity().getMatrix();
        assertEquals(expResult, result);
    }

    private void testKroneckerProduct() {
        ComplexMatrix matrix1 = ComplexMatrix.createGateMatrix(new Identity());
        ComplexMatrix matrix2 = ComplexMatrix.createGateMatrix(new PauliX(0));
        List<ComplexMatrix> matrixList = new ArrayList<>();
        matrixList.add(matrix1);
        matrixList.add(matrix2);
        ComplexMatrix matrix = ComplexMatrix.kroneckerProduct(matrixList);
        ComplexVector first= new ComplexVector(new Complex[]{Complex.ONE,Complex.ZERO});
        ComplexVector second= new ComplexVector(new Complex[]{Complex.ONE,Complex.ZERO});
        
        FieldVector<Complex> operate = matrix.operate(first.tensorProduct(second));
        ComplexVector[] factorize = ComplexVector.factorize(operate);
        assertEquals(first, factorize[0]);
        assertEquals(new ComplexVector(new Complex[]{Complex.ZERO,Complex.ONE}), factorize[1]);
        
        

    }
}
