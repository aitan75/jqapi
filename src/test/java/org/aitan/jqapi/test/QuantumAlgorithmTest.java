/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 *
 * @author Gaetano Ferrara
 */
public class QuantumAlgorithmTest {

    public QuantumAlgorithmTest() {
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
    public void testAlgorithm() throws JQApiException {
        testDeutschJoszaAlgorithm();
    }


    private void testDeutschJoszaAlgorithm() {
        final int N_INPUT = 3;
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            Circuit circuit = new Circuit(N_INPUT + 1);
            CircuitLevel level1 = new CircuitLevel();
            CircuitLevel level2 = new CircuitLevel();
            CircuitLevel level3 = new CircuitLevel();
            CircuitLevel level4 = new CircuitLevel();
            level1.addGate(new PauliX(N_INPUT));
            Integer[] qubitIndexes = IntStream.range(0, N_INPUT + 1).boxed().toArray(Integer[]::new);
            Integer[] qubitIndexesExceptLast = IntStream.range(0, N_INPUT).boxed().toArray(Integer[]::new);
            level2.addGate(new Hadamard(qubitIndexes));
            int function = random.nextInt(4);
            level3.addGate(new Oracle(createDeutschJoszaOracle(function, N_INPUT + 1), qubitIndexes));
            level4.addGate(new Hadamard(qubitIndexesExceptLast));
            circuit.addLevel(level1, level2, level3, level4);
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            Qubit[] input = qreg.getInput();
            String message = qreg.getResult()[0].equals(input[0]) ? "constant" : "balanced";
            System.out.println("f" + function + " is " + message);
        }

    }

    private ComplexMatrix createDeutschJoszaOracle(int function, int numberOfInputs) {
        int size = (int) Math.pow(2, numberOfInputs);
        int half = size / 2;
        Complex[][] matrix = new Complex[size][size];
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                matrix[i][j] = Complex.ZERO;
            }
        }
        
        switch (function) {
            case 0 -> {
                return ComplexMatrix.createIdentityMatrix(size);
            }
            case 1 -> {
                for (int i = 0; i < size; i++) {
                    if (i < half) {
                        matrix[i][i] = Complex.ONE;
                    } else {
                        matrix[i][size + half - i - 1] = Complex.ONE;
                    }
                }
                return ComplexMatrix.createMatrixWithData(matrix);
            }
            case 2 -> {
                for (int i = 0; i < size; i++) {
                    if (i < half) {
                        matrix[i][half-i-1] = Complex.ONE;
                    } else {
                        matrix[i][i] = Complex.ONE;
                    }
                }
                return ComplexMatrix.createMatrixWithData(matrix);
            }
            case 3 -> {
                List<ComplexMatrix> matrices = new ArrayList<>();
                for (int i = 0; i < numberOfInputs - 1; i++) {
                    matrices.add(ComplexMatrix.createIdentityMatrix(2));
                }
                matrices.add(Constants.PAULI_X_MATRIX);
                return ComplexMatrix.kroneckerProduct(matrices);
            }
            default ->
                throw new IllegalArgumentException("Matrix index not available");
        }
    }

}
