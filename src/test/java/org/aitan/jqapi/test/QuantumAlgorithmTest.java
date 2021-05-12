/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.test;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.aitan.jqapi.Algorithm;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.test.data.Person;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.util.Precision;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
    public void testAlgorithm() {
        testDeutschJoszaAlgorithm();
        testFunctionSearchAlgorithm();
        testRandomBit();
        testGroverSearchAlgorithm();
    }

    private void testRandomBit() {
        System.out.println("org.aitan.jqapi.test.QuantumAlgorithmTest.testRandomBit()");
        final int COUNT = 10000;
        int cntZero = 0;
        int cntOne = 0;
        for (int j = 0; j < COUNT; j++) {
            int randomBit = Algorithm.randomBit();
            if (randomBit==0) {
                cntZero++;
            } else {
                cntOne++;
            }
        }
        System.out.println("Executed " + COUNT + " times random bit: " + cntZero + " of them were 0 and " + cntOne + " were 1.");
        assertEquals(50.0, Precision.round((double) cntZero * 100 / COUNT, 2), 1.5);
        assertEquals(50.0, Precision.round((double) cntOne * 100 / COUNT, 2), 1.5);
    }

    private void testDeutschJoszaAlgorithm() {
        System.out.println("org.aitan.jqapi.test.QuantumAlgorithmTest.testDeutschJoszaAlgorithm()");
        final int N_INPUT = 3;
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 10; i++) {
            Circuit circuit = new Circuit(N_INPUT + 1);
            CircuitLevel level1 = new CircuitLevel();
            CircuitLevel level2 = new CircuitLevel();
            CircuitLevel level3 = new CircuitLevel();
            CircuitLevel level4 = new CircuitLevel();
            level1.addGate(new PauliX(N_INPUT));
            Integer[] qubitIndexes = IntStream.range(0, N_INPUT + 1).boxed().toArray(Integer[]::new);
            Integer[] qubitIndexesExceptAncilla = IntStream.range(0, N_INPUT).boxed().toArray(Integer[]::new);
            level2.addGate(new Hadamard(qubitIndexes));
            int function = random.nextInt(4);
            level3.addGate(createDeutschJoszaOracle(function, N_INPUT + 1, qubitIndexes));
            level4.addGate(new Hadamard(qubitIndexesExceptAncilla));
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

    private void testFunctionSearchAlgorithm() {
        System.out.println("org.aitan.jqapi.test.QuantumAlgorithmTest.testFunctionSearchAlgorithm()");
        boolean found = false;
        List<Person> persons = createListPersons();
        Function<Person, Boolean> function = search();
        int index = 0;
        while (!found && (index < persons.size())) {
            Person target = persons.get(index++);
            found = function.apply(target);

        }
        System.out.println("Got result after " + index + " tries: " + persons.get(index - 1));
    }

    private void testGroverSearchAlgorithm() {
        System.out.println("org.aitan.jqapi.test.QuantumAlgorithmTest.testGroverSearchAlgorithm()");
        try {
            List<Person> persons = createListPersons();
            Collections.shuffle(persons);
            Person found = Algorithm.search(persons, search());
            System.out.println("Person found: " + found);
        } catch (JQApiException ex) {
            System.out.println(ex.getMessage());
        }
    }

    private Oracle createDeutschJoszaOracle(int function, int numberOfInputs, Integer[] qubitIndexes) {
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
                return new Oracle(ComplexMatrix.createIdentityMatrix(size), qubitIndexes);
            }
            case 1 -> {
                for (int i = 0; i < size; i++) {
                    if (i < half) {
                        matrix[i][i] = Complex.ONE;
                    } else {
                        matrix[i][size + half - i - 1] = Complex.ONE;
                    }
                }
                return new Oracle(ComplexMatrix.createMatrixWithData(matrix), qubitIndexes);
            }
            case 2 -> {
                for (int i = 0; i < size; i++) {
                    if (i < half) {
                        matrix[i][half - i - 1] = Complex.ONE;
                    } else {
                        matrix[i][i] = Complex.ONE;
                    }
                }
                return new Oracle(ComplexMatrix.createMatrixWithData(matrix), qubitIndexes);
            }
            case 3 -> {
                List<ComplexMatrix> matrices = new ArrayList<>();
                for (int i = 0; i < numberOfInputs - 1; i++) {
                    matrices.add(ComplexMatrix.createIdentityMatrix(2));
                }
                matrices.add(Constants.PAULI_X_MATRIX);
                return new Oracle(ComplexMatrix.kroneckerProduct(matrices), qubitIndexes);
            }
            default ->
                throw new IllegalArgumentException("Matrix index not available");
        }
    }

    private Function<Person, Boolean> search() {
        return (Person p) -> p.age() == 45&&p.name().startsWith("P");
    }

    private List<Person> createListPersons() {
        List<Person> persons = new ArrayList<>();
        persons.add(new Person("Gaetano", 46));
        persons.add(new Person("Marilena", 45));
        persons.add(new Person("Sara", 5));
        persons.add(new Person("Giulia", 1));
        persons.add(new Person("Maurizio", 43));
        persons.add(new Person("Valerio", 39));
        persons.add(new Person("Pippo", 45));
        persons.add(new Person("Francesco", 72));
        persons.add(new Person("Pina", 75));

        return persons;
    }

}
