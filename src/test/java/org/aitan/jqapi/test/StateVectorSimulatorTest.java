package org.aitan.jqapi.test;

import java.util.stream.IntStream;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitOne;
import org.aitan.jqapi.quantum.QubitZero;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the state-vector simulator: gates acting on arbitrary,
 * non adjacent qubits and circuits too large for a full 2^n x 2^n operator.
 *
 * @author Gaetano Ferrara
 */
public class StateVectorSimulatorTest {

    private static final double EPS = 1e-9;

    /**
     * CNOT with control on qubit 0 and target on qubit 2, skipping qubit 1:
     * |100> must become |101>.
     */
    @Test
    public void testCNotOnNonAdjacentQubits() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new ControlledNot(0, 2));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitOne(), new QubitZero(), new QubitZero());
        simulator.execute();
        assertBasisState(simulator.getQuantumRegister(), 0b101);
    }

    /**
     * CNOT with control on qubit 2 and target on qubit 0 (declared in reverse
     * order): |001> must become |101>.
     */
    @Test
    public void testCNotWithControlAfterTarget() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new ControlledNot(2, 0));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitZero(), new QubitZero(), new QubitOne());
        simulator.execute();
        assertBasisState(simulator.getQuantumRegister(), 0b101);
    }

    /**
     * Swap between qubit 0 and qubit 2: |100> must become |001>.
     */
    @Test
    public void testSwapOnNonAdjacentQubits() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Swap(0, 2));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitOne(), new QubitZero(), new QubitZero());
        simulator.execute();
        assertBasisState(simulator.getQuantumRegister(), 0b001);
    }

    /**
     * Toffoli with controls on qubits 0 and 2 and target on qubit 1:
     * |101> must become |111>.
     */
    @Test
    public void testToffoliWithNonAdjacentControls() {
        Circuit circuit = new Circuit(3);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Toffoli(0, 2, 1));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitOne(), new QubitZero(), new QubitOne());
        simulator.execute();
        assertBasisState(simulator.getQuantumRegister(), 0b111);
    }

    /**
     * GHZ state on 10 qubits built with CNOTs sharing the same control
     * (all non adjacent except the first): the state must be
     * (|0000000000> + |1111111111>)/sqrt(2) and every measurement must yield
     * all qubits with the same value.
     */
    @Test
    public void testGhzStateOnTenQubits() {
        final int N = 10;
        Circuit circuit = new Circuit(N);
        CircuitLevel hadamardLevel = new CircuitLevel();
        hadamardLevel.addGate(new Hadamard(0));
        circuit.addLevel(hadamardLevel);
        for (int target = 1; target < N; target++) {
            CircuitLevel level = new CircuitLevel();
            level.addGate(new ControlledNot(0, target));
            circuit.addLevel(level);
        }
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();

        int dimension = qreg.getRegisterState().getDimension();
        double invSqrt2 = 1 / Math.sqrt(2);
        assertEquals(invSqrt2, qreg.getRegisterState().getEntry(0).abs(), EPS);
        assertEquals(invSqrt2, qreg.getRegisterState().getEntry(dimension - 1).abs(), EPS);
        for (int i = 1; i < dimension - 1; i++) {
            assertEquals(0.0, qreg.getRegisterState().getEntry(i).abs(), EPS);
        }

        qreg.measure();
        Qubit first = qreg.getResult()[0];
        for (int i = 1; i < N; i++) {
            assertEquals(first, qreg.getResult()[i], "GHZ measurement must be perfectly correlated");
        }
    }

    /**
     * 16-qubit circuit: a full Hadamard layer followed by a non adjacent CNOT.
     * The resulting state is the uniform superposition (the CNOT only permutes
     * basis states), so every amplitude must be 1/2^8. The Kronecker-based
     * simulator would have required a 65536 x 65536 operator for each level.
     */
    @Test
    public void testSixteenQubitCircuit() {
        final int N = 16;
        Circuit circuit = new Circuit(N);
        CircuitLevel hadamardLevel = new CircuitLevel();
        hadamardLevel.addGate(new Hadamard(IntStream.range(0, N).boxed().toArray(Integer[]::new)));
        CircuitLevel cnotLevel = new CircuitLevel();
        cnotLevel.addGate(new ControlledNot(0, N - 1));
        circuit.addLevel(hadamardLevel, cnotLevel);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();

        double expected = 1 / Math.pow(2, N / 2.0);
        double norm = 0;
        for (int i = 0; i < qreg.getRegisterState().getDimension(); i++) {
            assertEquals(expected, qreg.getRegisterState().getEntry(i).abs(), EPS);
            norm += Math.pow(qreg.getRegisterState().getEntry(i).abs(), 2);
        }
        assertEquals(1.0, norm, 1e-6);
    }

    private void assertBasisState(QuantumRegister qreg, int expectedIndex) {
        for (int i = 0; i < qreg.getRegisterState().getDimension(); i++) {
            double expected = i == expectedIndex ? 1.0 : 0.0;
            assertEquals(expected, qreg.getRegisterState().getEntry(i).abs(), EPS,
                    "unexpected amplitude at basis state " + i);
        }
    }
}
