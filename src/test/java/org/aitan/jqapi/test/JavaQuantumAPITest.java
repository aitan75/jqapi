package org.aitan.jqapi.test;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitOne;
import org.aitan.jqapi.quantum.QubitSuperposition;
import org.aitan.jqapi.quantum.QubitZero;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledSwap;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.utils.Utils;
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
    public void testTwoQubitTensor() {
        Qubit firstQubit = new QubitOne();
        Qubit secondQubit = new QubitZero();
        ComplexVector tensorProduct = secondQubit.getValue().tensorProduct(firstQubit.getValue());
        ComplexVector expResult11 = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO});
        assertEquals(expResult11, tensorProduct);
        firstQubit = new QubitZero();
        secondQubit = new QubitOne();
        tensorProduct = secondQubit.getValue().tensorProduct(firstQubit.getValue());
        ComplexVector expResult00 = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO});
        assertEquals(expResult00, tensorProduct);
    }

    @Test
    public void testThreeQubitProbabilities() {
        Qubit firstQubit = new QubitSuperposition(Math.sqrt(0.30));
        Qubit secondQubit = new QubitSuperposition(Math.sqrt(0.25));
        Qubit thirdQubit = new QubitSuperposition(Math.sqrt(0.80));
        ComplexVector tensorProduct123 = firstQubit.getValue().tensorProduct(secondQubit.getValue()).tensorProduct(thirdQubit.getValue());
        ComplexVector output000 = new QubitZero().getValue().tensorProduct(new QubitZero().getValue()).tensorProduct(new QubitZero().getValue());
        ComplexVector output001 = new QubitOne().getValue().tensorProduct(new QubitZero().getValue()).tensorProduct(new QubitZero().getValue());
        ComplexVector output010 = new QubitZero().getValue().tensorProduct(new QubitOne().getValue()).tensorProduct(new QubitZero().getValue());
        ComplexVector output011 = new QubitOne().getValue().tensorProduct(new QubitOne().getValue()).tensorProduct(new QubitZero().getValue());
        ComplexVector output100 = new QubitZero().getValue().tensorProduct(new QubitZero().getValue()).tensorProduct(new QubitOne().getValue());
        ComplexVector output101 = new QubitOne().getValue().tensorProduct(new QubitZero().getValue()).tensorProduct(new QubitOne().getValue());
        ComplexVector output110 = new QubitZero().getValue().tensorProduct(new QubitOne().getValue()).tensorProduct(new QubitOne().getValue());
        ComplexVector output111 = new QubitOne().getValue().tensorProduct(new QubitOne().getValue()).tensorProduct(new QubitOne().getValue());
        Double probabilities000 = Math.pow(output000.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities001 = Math.pow(output001.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities010 = Math.pow(output010.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities011 = Math.pow(output011.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities100 = Math.pow(output100.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities101 = Math.pow(output101.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities110 = Math.pow(output110.dotProduct(tensorProduct123).abs(), 2);
        Double probabilities111 = Math.pow(output111.dotProduct(tensorProduct123).abs(), 2);
        double total = probabilities111 + probabilities000 + probabilities001 + probabilities010 + probabilities011 + probabilities100 + probabilities101 + probabilities110;

        //ComplexVector expResult11=new ComplexVector(new Complex[]{Complex.ZERO,Complex.ZERO,Complex.ZERO,Complex.ONE});
        //assertEquals(expectedOutput, probabilities100);
    }

    @Test
    public void testQubitProbabilities() {
        Qubit qubit = new QubitSuperposition(0.4);
        double resultOneProbability = qubit.oneProbability() * 100;
        double resultZeroProbability = qubit.zeroProbability() * 100;
        assertEquals(84.00, resultOneProbability);
        assertEquals(16.00, resultZeroProbability);
    }


    @Test
    public void testSwapGate() {
        Circuit circuit = new Circuit(2);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Swap(0, 1));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, 0.5, 0.8);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        //qreg.measure();
        Qubit[] factorize = qreg.getQubitRegisterState();
        assertEquals(qreg.getInput()[0], factorize[1]);
        assertEquals(qreg.getInput()[1], factorize[0]);
    }

    @Test
    public void testToffoliGate() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Toffoli(0, 1, 2));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit,0,0,0.6);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        //qreg.measure();
        Qubit[] factorize = qreg.getQubitRegisterState();
        assertEquals(new QubitOne(), factorize[0]);
        assertEquals(new QubitOne(), factorize[1]);
        assertEquals(new QubitSuperposition(0.8), factorize[2]);
    }
    
    @Test
    public void testControlledSwapGate() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new ControlledSwap(0, 1, 2));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit,0,1,0);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        //qreg.measure();
        Qubit[] qubits = qreg.getQubitRegisterState();
        assertEquals(new QubitOne(), qubits[0]);
        assertEquals(new QubitOne(), qubits[1]);
        assertEquals(new QubitZero(), qubits[2]);
    }

    @Test
    public void testCircuitSimulator() {
        final int COUNT = 10000;
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

        assertEquals(COUNT, cntZero + cntOne);
        assertTrue(cntZero > 4500 && cntZero < 5500, "cntZero=" + cntZero);
        assertTrue(cntOne > 4500 && cntOne < 5500, "cntOne=" + cntOne);
    }

    @Test
    public void testCoinLaunch() {
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

        assertEquals(25.0, Utils.round((double) results[0] * 100 / COUNT, 2), 2.5);
        assertEquals(25.0, Utils.round((double) results[1] * 100 / COUNT, 2), 2.5);
        assertEquals(25.0, Utils.round((double) results[2] * 100 / COUNT, 2), 2.5);
        assertEquals(25.0, Utils.round((double) results[3] * 100 / COUNT, 2), 2.5);
    }

    @Test
    public void testCNotControlQubitZero() {
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level2.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level1, level2);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measure();
        assertEquals(new QubitZero(), qreg.getResult()[1]);
    }

    @Test
    public void testCNotControlQubitOne() {
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
        assertEquals(new QubitOne(), qreg.getResult()[1]);
    }

    @Test
    public void testBellState() {
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
            boolean firstCoin = qreg.getResult()[0].equals(new QubitZero());
            boolean secondCoin = qreg.getResult()[1].equals(new QubitZero());
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

        assertEquals(50.0, Utils.round((double) results[0] * 100 / COUNT, 2), 2.5);
        assertEquals(50.0, Utils.round((double) results[3] * 100 / COUNT, 2), 2.5);
    }

    @Test
    public void testOracle() {
        final int COUNT = 10000;
        int results[] = new int[4];
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new Hadamard(0));
        ComplexMatrix matrix = createOracle();
        level2.addGate(new Oracle(matrix, 0, 1));
        circuit.addLevel(level1, level2);
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            boolean firstCoin = qreg.getResult()[0].equals(new QubitZero());
            boolean secondCoin = qreg.getResult()[1].equals(new QubitZero());
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

        assertEquals(50.0, Utils.round((double) results[0] * 100 / COUNT, 2), 2.5);
        assertEquals(50.0, Utils.round((double) results[3] * 100 / COUNT, 2), 2.5);
    }

    @Test
    public void testQuantumTeleportation() {
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
            QuantumSimulator simulator = new LocalSimulator(circuit, 0.8, 1, 1);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            //qreg.measure();
            //System.out.println("result: " + qreg.getRegisterState());
            Qubit[] factorizeInput = qreg.getInput();
            Qubit[] factorizeOutput = qreg.getQubitRegisterState();
            assertEquals(factorizeInput[q], factorizeOutput[b]);
        }

    }

    private ComplexMatrix createOracle() {
        return new ControlledNot(0, 1).getMatrix();
    }
}
