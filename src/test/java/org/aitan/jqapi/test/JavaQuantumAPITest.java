/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.test;

import java.util.Arrays;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.util.Precision;
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
public class JavaQuantumAPITest {

    public JavaQuantumAPITest() {
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
    public void testQubit() throws JQApiException {
        /*testQubit0();
            testQubit1();
            testQubitSuperposition();
            testQubitProbabilities();
            testTwoQubitTensor();
            testThreeQubitTensor();
        testThreeQubitProbabilities();
        testThreeQubitRegister();*/
        testHadamardGate();
        //testCircuitSimulator();
        testCNotControlQubitZero();
        testCNotControlQubitOne();
        testCoinLaunch();
        testBellState();
        testQuantumTeleportation();
        testOracle();

    }

    private void testQubit0() {
        Qubit result = new Qubit();
        String expResult = Constants.PSI_QUANTUM + "=" + Constants.ZERO_QUANTUM;
        assertEquals(expResult, result.toString());
    }

    private void testTwoQubitTensor() {
        Qubit firstQubit = new Qubit(0);
        Qubit secondQubit = new Qubit(1);
        ComplexVector tensorProduct = secondQubit.getValue().tensorProduct(firstQubit.getValue());
        ComplexVector expResult11 = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO});
        assertEquals(expResult11, tensorProduct);
        firstQubit = new Qubit(1);
        secondQubit = new Qubit(0);
        tensorProduct = secondQubit.getValue().tensorProduct(firstQubit.getValue());
        ComplexVector expResult00 = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO});
        assertEquals(expResult00, tensorProduct);
    }

    private void testThreeQubitTensor() {
        Qubit firstQubit = new Qubit(0);
        Qubit secondQubit = new Qubit(1);
        Qubit thirdQubit = new Qubit(0);
        ComplexVector tensorProduct = firstQubit.getValue().tensorProduct(secondQubit.getValue()).tensorProduct(thirdQubit.getValue());
        System.out.println("tensorProduct: " + tensorProduct);
        //ComplexVector expResult11=new ComplexVector(new Complex[]{Complex.ZERO,Complex.ZERO,Complex.ZERO,Complex.ONE});
        //assertEquals(expResult11, tensorProduct);

    }

    private void testThreeQubitProbabilities() {
        Qubit firstQubit = new Qubit(Math.sqrt(0.30));
        Qubit secondQubit = new Qubit(Math.sqrt(0.25));
        Qubit thirdQubit = new Qubit(Math.sqrt(0.80));
        ComplexVector tensorProduct123 = firstQubit.getValue().tensorProduct(secondQubit.getValue()).tensorProduct(thirdQubit.getValue());
        ComplexVector output000 = new Qubit(1).getValue().tensorProduct(new Qubit(1).getValue()).tensorProduct(new Qubit(1).getValue());
        ComplexVector output001 = new Qubit(0).getValue().tensorProduct(new Qubit(1).getValue()).tensorProduct(new Qubit(1).getValue());
        ComplexVector output010 = new Qubit(1).getValue().tensorProduct(new Qubit(0).getValue()).tensorProduct(new Qubit(1).getValue());
        ComplexVector output011 = new Qubit(0).getValue().tensorProduct(new Qubit(0).getValue()).tensorProduct(new Qubit(1).getValue());
        ComplexVector output100 = new Qubit(1).getValue().tensorProduct(new Qubit(1).getValue()).tensorProduct(new Qubit(0).getValue());
        ComplexVector output101 = new Qubit(0).getValue().tensorProduct(new Qubit(1).getValue()).tensorProduct(new Qubit(0).getValue());
        ComplexVector output110 = new Qubit(1).getValue().tensorProduct(new Qubit(0).getValue()).tensorProduct(new Qubit(0).getValue());
        ComplexVector output111 = new Qubit(0).getValue().tensorProduct(new Qubit(0).getValue()).tensorProduct(new Qubit(0).getValue());
        System.out.println("tensorProduct: " + tensorProduct123);
        Double probabilities000 = Math.pow(output000.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities001 = Math.pow(output001.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities010 = Math.pow(output010.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities011 = Math.pow(output011.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities100 = Math.pow(output100.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities101 = Math.pow(output101.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities110 = Math.pow(output110.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities111 = Math.pow(output111.dotProduct(tensorProduct123).abs(), 2);
        double total = probabilities111 + probabilities000 + probabilities001 + probabilities010 + probabilities011 + probabilities100 + probabilities101 + probabilities110;
        System.out.println("probabilities000: " + probabilities000);
        System.out.println("probabilities001: " + probabilities001);
        System.out.println("probabilities010: " + probabilities010);
        System.out.println("probabilities011: " + probabilities011);
        System.out.println("probabilities100: " + probabilities100);
        System.out.println("probabilities101: " + probabilities101);
        System.out.println("probabilities110: " + probabilities110);
        System.out.println("probabilities111: " + probabilities111);
        System.out.println("total: " + total);

        //ComplexVector expResult11=new ComplexVector(new Complex[]{Complex.ZERO,Complex.ZERO,Complex.ZERO,Complex.ONE});
        //assertEquals(expectedOutput, probabilities100);
    }

    private void testQubit1() {
        Qubit result = new Qubit(0);
        String expResult = Constants.PSI_QUANTUM + "=" + Constants.ONE_QUANTUM;
        assertEquals(expResult, result.toString());

    }

    private void testQubitSuperposition() {
        double alpha = 0.5d;
        Qubit result = new Qubit(alpha);
        String expResult = Constants.PSI_QUANTUM + "=" + new Complex(alpha, 0) + Constants.ZERO_QUANTUM + "+" + new Complex(alpha, 0).sqrt1z() + Constants.ONE_QUANTUM;
        assertEquals(expResult, result.toString());
    }

    private void testQubitProbabilities() {
        Qubit qubit = new Qubit(0.4);
        double resultOneProbability = qubit.oneProbability() * 100;
        double resultZeroProbability = qubit.zeroProbability() * 100;
        assertEquals(84.00, resultOneProbability);
        assertEquals(16.00, resultZeroProbability);
    }

    private void testPauliMatrix() {
        Qubit input = new Qubit(Math.sqrt(0.49));
        ComplexMatrix pauliXMatrix = new PauliX(0).getMatrix();
        Qubit output = new Qubit(pauliXMatrix.operate(input.getValue()).toArray()[0].getReal());
        Qubit expResult = new Qubit(Math.sqrt(0.51));
        assertEquals(expResult, output);

    }

    private void testHadamardGate() throws JQApiException {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testHadamardGate()");
        ComplexMatrix hadamardMatrix = new Hadamard(0).getMatrix();
        int cntZero = 0;
        int cntOne = 0;
        for (int j = 0; j < 10000; j++) {
            QuantumRegister qreg = new QuantumRegister(1);
            for (int i = 0; i < qreg.getSize(); i++) {
                //qreg.updateRegisterState(new Qubit(hadamardMatrix.operate(qreg.getResult()[i].getValue()).getEntry(0)), i);
            }

            qreg.measure();
            if (qreg.getRegisterState().getData()[0] == Complex.ONE) {
                cntZero++;
            } else {
                cntOne++;
            }
        }
        System.out.println("Executed 10000 times hadamard gate on single qubit: " + cntZero + " of them were 0 and " + cntOne + " were 1.");

    }

    private void testCircuitSimulator() {
        final int COUNT = 1000;
        Circuit circuit = new Circuit(1);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new PauliX(0));
        level2.addGate(new Hadamard(0));
        circuit.addLevel(level1, level2);
        int cntZero = 0;
        int cntOne = 0;
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            if (qreg.getRegisterState().getData()[0] == Complex.ONE) {
                cntZero++;
            } else {
                cntOne++;
            }
            //System.err.println(Arrays.toString(qreg.getQubits()));

        }

        System.out.println("Executed " + COUNT + " times the hadamard gate on single qubit: " + cntZero + " of them were 0 and " + cntOne + " were 1.");
    }

    private void testCoinLaunch() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testCoinLaunch()");
        final int COUNT = 10000;
        int results[] = new int[4];
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        level1.addGate(new Hadamard(0, 1));
        circuit.addLevel(level1);
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            boolean firstCoin = qreg.getResult()[0].getValue().getEntry(0).equals(Complex.ZERO);
            boolean secondCoin = qreg.getResult()[1].getValue().getEntry(0).equals(Complex.ZERO);

            if (!firstCoin && !secondCoin) {
                results[0]++;
            }
            if (!firstCoin && secondCoin) {
                results[1]++;
            }
            if (firstCoin && !secondCoin) {
                results[2]++;
            }
            if (firstCoin && secondCoin) {
                results[3]++;
            }
            //System.err.println(Arrays.toString(qreg.getQubits()));

        }

        System.out.println("We did " + COUNT + " experiments.");
        System.out.println("0 0 occurred " + results[0] + " times.");
        System.out.println("0 1 occurred " + results[1] + " times.");
        System.out.println("1 0 occurred " + results[2] + " times.");
        System.out.println("1 1 occurred " + results[3] + " times.");
    }

    private void testCNotControlQubitZero() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testCNotControlQubitZero()");
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level2.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level1, level2);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measure();
        System.out.println("QuantumRegister input target qubit: " + qreg.getInput()[1]);
        System.out.println("QuantumRegister output target qubit: " + qreg.getResult()[1]);
        assertEquals(new Qubit(1), qreg.getResult()[1]);
    }

    private void testCNotControlQubitOne() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testCNotControlQubitOne()");
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new PauliX(0));
        level2.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level1, level2);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measure();
        System.out.println("QuantumRegister input target qubit: " + qreg.getInput()[1]);
        System.out.println("QuantumRegister output target qubit: " + qreg.getResult()[1]);
        assertEquals(new Qubit(0), qreg.getResult()[1]);
    }
    
    private void testRegisterStateAfterQubitCollapsed() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testRegisterStateAfterQubitCollapsed()");
        Complex[] complex = new Complex[8];

        for (int i = 0; i < 1000; i++) {
            //Initial register state
            complex[0] = new Complex(0.5); //000
            complex[1] = new Complex(0); //001
            complex[2] = new Complex(0); //010
            complex[3] = new Complex(0.5); //011
            complex[4] = new Complex(0.5); //100
            complex[5] = new Complex(0); //101
            complex[6] = new Complex(0); //110
            complex[7] = new Complex(0.5); //111
            ComplexVector registerState = new ComplexVector(complex);
            QuantumRegister qreg = new QuantumRegister(3);
            qreg.setRegisterState(registerState);
            //Qubit collapsed at index 0 of qubit register
            qreg.measureQubitAtIndexes(Arrays.asList(0, 2));
            System.out.println("result: " + Arrays.toString(qreg.getResult()));
            System.out.println("register: " + qreg.getRegisterState());
        }
    }

    private void testBellState() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testBellState()");
        final int COUNT = 10000;
        int results[] = new int[4];
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new Hadamard(0));
        level2.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level1, level2);
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            boolean firstCoin = qreg.getResult()[0].equals(new Qubit());
            boolean secondCoin = qreg.getResult()[1].equals(new Qubit());
            if (firstCoin && secondCoin) {
                results[0]++;
            }
            if (firstCoin && !secondCoin) {
                results[1]++;
            }
            if (!firstCoin && secondCoin) {
                results[2]++;
            }
            if (!firstCoin && !secondCoin) {
                results[3]++;
            }
            //System.err.println(Arrays.toString(qreg.getQubits()));

        }

        System.out.println("We did " + COUNT + " experiments.");

        System.out.println("00 occurred: " + results[0]);
        System.out.println("10 occurred: " + results[1]);
        System.out.println("01 occurred: " + results[2]);
        System.out.println("11 occurred: " + results[3]);

        assertEquals(50.0, Precision.round((double) results[0] * 100 / COUNT, 2), 1.5);
        assertEquals(50.0, Precision.round((double) results[3] * 100 / COUNT, 2), 1.5);
    }
    
    private void testOracle() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testOracle()");
        final int COUNT = 10000;
        int results[] = new int[4];
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new Hadamard(0));
        ComplexMatrix matrix=createOracle();
        level2.addGate(new Oracle(matrix,0,1));
        circuit.addLevel(level1, level2);
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            boolean firstCoin = qreg.getResult()[0].equals(new Qubit());
            boolean secondCoin = qreg.getResult()[1].equals(new Qubit());
            if (firstCoin && secondCoin) {
                results[0]++;
            }
            if (firstCoin && !secondCoin) {
                results[1]++;
            }
            if (!firstCoin && secondCoin) {
                results[2]++;
            }
            if (!firstCoin && !secondCoin) {
                results[3]++;
            }
            //System.err.println(Arrays.toString(qreg.getQubits()));

        }

        System.out.println("We did " + COUNT + " experiments.");

        System.out.println("00 occurred: " + results[0]);
        System.out.println("10 occurred: " + results[1]);
        System.out.println("01 occurred: " + results[2]);
        System.out.println("11 occurred: " + results[3]);

        assertEquals(50.0, Precision.round((double) results[0] * 100 / COUNT, 2), 1.5);
        assertEquals(50.0, Precision.round((double) results[3] * 100 / COUNT, 2), 1.5);
    }

    private void testQuantumTeleportation() {
        System.out.println("org.aitan.jqapi.test.JavaQuantumAPITest.testQuantumTeleportation()");
        final int COUNT = 10000;
        final int inputSize = 3;
        int q = 0, a = 1, b = 2;
        Circuit circuit = new Circuit(inputSize);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        CircuitLevel level3 = new CircuitLevel();
        CircuitLevel level4 = new CircuitLevel();
        CircuitLevel level5 = new CircuitLevel();
        CircuitLevel level6 = new CircuitLevel();
        CircuitLevel level7 = new CircuitLevel();
        level1.addGate(new Hadamard(a));
        level2.addGate(new ControlledNot(a, b));
        level3.addGate(new ControlledNot(q, a));
        level4.addGate(new Hadamard(q));
        level5.addGate(new Measurement(q, a));
        level6.addGate(new ControlledNot(a, b));
        level7.addGate(new ControlledZ(q, b));
        circuit.addLevel(level1, level2, level3, level4, level5, level6, level7);
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit, 0.8,1,1);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            //qreg.measure();
            //System.out.println("result: " + qreg.getRegisterState());
            Qubit[] factorizeInput = qreg.getInput();
            ComplexVector[] factorizeOutput = ComplexVector.factorize(qreg.getRegisterState());
            assertEquals(factorizeInput[q], new Qubit(factorizeOutput[b]));
        }

    }

    private ComplexMatrix createOracle() {
       return new ControlledNot(0, 1).getMatrix();
    }
}
