package org.aitan.jqapi.test;

import java.util.Arrays;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitOne;
import org.aitan.jqapi.quantum.QubitSuperposition;
import org.aitan.jqapi.quantum.QubitZero;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.apache.commons.math3.complex.Complex;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Regression tests for measurement correctness:
 * - renormalization after partial measurement with non-uniform amplitudes
 * - phase preservation after partial measurement
 * - rejection of single-qubit factorization on entangled states
 *
 * @author Gaetano Ferrara
 */
public class QuantumMeasurementTest {

    private static final double EPS = 1e-9;

    @Test
    public void testMeasurement() {
        testPartialMeasurementRenormalizationNonUniform();
        testPartialMeasurementPreservesPhase();
        testEntangledStateFactorizationRejected();
        testSeparableStateFactorizationStillWorks();
    }

    /**
     * State sqrt(0.8)|00> + sqrt(0.2)|11>. After measuring qubit 0 the register
     * must be a properly normalized basis state (|00> or |11>).
     */
    private void testPartialMeasurementRenormalizationNonUniform() {
        Circuit circuit = new Circuit(2);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitSuperposition(Math.sqrt(0.8)), new QubitZero());
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measureQubitAtIndexes(Arrays.asList(0));

        assertEquals(1.0, norm2(qreg), EPS);

        Complex amp00 = qreg.getRegisterState().getEntry(0);
        Complex amp11 = qreg.getRegisterState().getEntry(3);
        boolean collapsedToZero = amp00.abs() > 0.5;
        Complex survivor = collapsedToZero ? amp00 : amp11;
        assertEquals(1.0, survivor.abs(), EPS);
        // the untouched entries must be exactly zero
        assertEquals(0.0, qreg.getRegisterState().getEntry(1).abs(), EPS);
        assertEquals(0.0, qreg.getRegisterState().getEntry(2).abs(), EPS);
        // measured qubit result must be consistent with the surviving branch
        Qubit expected = collapsedToZero ? new QubitZero() : new QubitOne();
        assertEquals(expected, qreg.getResult()[0]);
    }

    /**
     * State (|00> - |11>)/sqrt(2). When qubit 0 collapses to 1, the surviving
     * amplitude must be exactly -1: the relative phase must not be discarded.
     */
    private void testPartialMeasurementPreservesPhase() {
        boolean sawOne = false;
        boolean sawZero = false;
        for (int i = 0; i < 200 && !(sawOne && sawZero); i++) {
            Circuit circuit = new Circuit(2);
            CircuitLevel level1 = new CircuitLevel();
            CircuitLevel level2 = new CircuitLevel();
            CircuitLevel level3 = new CircuitLevel();
            level1.addGate(new Hadamard(0));
            level2.addGate(new ControlledNot(0, 1));
            level3.addGate(new PauliZ(0));
            circuit.addLevel(level1, level2, level3);
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measureQubitAtIndexes(Arrays.asList(0));

            assertEquals(1.0, norm2(qreg), EPS);
            Complex amp00 = qreg.getRegisterState().getEntry(0);
            Complex amp11 = qreg.getRegisterState().getEntry(3);
            if (amp11.abs() > 0.5) {
                sawOne = true;
                assertEquals(-1.0, amp11.getReal(), EPS);
                assertEquals(0.0, amp11.getImaginary(), EPS);
            } else {
                sawZero = true;
                assertEquals(1.0, amp00.getReal(), EPS);
                assertEquals(0.0, amp00.getImaginary(), EPS);
            }
        }
        assertTrue(sawOne, "never observed qubit 0 collapsing to 1 in 200 runs");
        assertTrue(sawZero, "never observed qubit 0 collapsing to 0 in 200 runs");
    }

    /**
     * A Bell state cannot be factorized into independent qubits:
     * getQubitRegisterState() must fail loudly instead of returning a
     * misleading product state.
     */
    private void testEntangledStateFactorizationRejected() {
        Circuit circuit = new Circuit(2);
        CircuitLevel level1 = new CircuitLevel();
        CircuitLevel level2 = new CircuitLevel();
        level1.addGate(new Hadamard(0));
        level2.addGate(new ControlledNot(0, 1));
        circuit.addLevel(level1, level2);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        assertThrows(IllegalStateException.class, () -> qreg.getQubitRegisterState());
    }

    /**
     * Factorization must keep working for separable states.
     */
    private void testSeparableStateFactorizationStillWorks() {
        Circuit circuit = new Circuit(2);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new PauliZ(0));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit, new QubitZero(), new QubitOne());
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        Qubit[] qubits = qreg.getQubitRegisterState();
        assertEquals(new QubitZero(), qubits[0]);
        assertEquals(new QubitOne(), qubits[1]);
    }

    private double norm2(QuantumRegister qreg) {
        double norm = 0;
        for (int i = 0; i < qreg.getRegisterState().getDimension(); i++) {
            norm += Math.pow(qreg.getRegisterState().getEntry(i).abs(), 2);
        }
        return norm;
    }
}
