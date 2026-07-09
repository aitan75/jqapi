package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Reset;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumResetGateTest {

    private static final double TOL = 1e-9;

    // Marginal probability that qubit `q` (0 = most significant) is |1>.
    private static double marginalP1(QuantumRegister reg, int q, int nQubits) {
        double p = 0.0;
        int dim = 1 << nQubits;
        for (int i = 0; i < dim; i++) {
            int bit = (i >> (nQubits - 1 - q)) & 1;
            if (bit == 1) {
                Complex a = reg.getRegisterState().getEntry(i);
                p += a.getReal() * a.getReal() + a.getImaginary() * a.getImaginary();
            }
        }
        return p;
    }

    private static double norm(QuantumRegister reg, int nQubits) {
        double n = 0.0;
        int dim = 1 << nQubits;
        for (int i = 0; i < dim; i++) {
            Complex a = reg.getRegisterState().getEntry(i);
            n += a.getReal() * a.getReal() + a.getImaginary() * a.getImaginary();
        }
        return n;
    }

    @Test
    void reset_ket1_becomesKet0() {
        QuantumRegister reg = new QuantumRegister(1);
        reg.applyOperator(Constants.PAULI_X_MATRIX, List.of(0)); // |0> -> |1>
        reg.reset(0);
        assertEquals(Complex.ONE, reg.getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, reg.getRegisterState().getEntry(1));
    }

    @Test
    void reset_ket0_staysKet0() {
        QuantumRegister reg = new QuantumRegister(1);
        reg.reset(0);
        assertEquals(Complex.ONE, reg.getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, reg.getRegisterState().getEntry(1));
    }

    @Test
    void reset_superposition_isDeterministicallyKet0() {
        // Collapse is random, but the reset qubit must always end |0>.
        for (int run = 0; run < 50; run++) {
            QuantumRegister reg = new QuantumRegister(1);
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)); // |+>
            reg.reset(0);
            assertEquals(0.0, marginalP1(reg, 0, 1), TOL, "run " + run);
            assertEquals(1.0, norm(reg, 1), TOL, "run " + run);
        }
    }

    @Test
    void reset_entangledQubit_zeroesMarginal_keepsNorm() {
        // Bell state (|00> + |11>)/sqrt2, then reset qubit 0.
        for (int run = 0; run < 50; run++) {
            QuantumRegister reg = new QuantumRegister(2);
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
            reg.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, 1));
            reg.reset(0);
            assertEquals(0.0, marginalP1(reg, 0, 2), TOL, "run " + run);
            assertEquals(1.0, norm(reg, 2), TOL, "run " + run);
        }
    }

    @Test
    void reset_rejectsOutOfRangeIndex() {
        QuantumRegister reg = new QuantumRegister(2);
        assertThrows(JQApiLimitException.class, () -> reg.reset(5));
        assertThrows(JQApiLimitException.class, () -> reg.resetQubitAtIndexes(List.of(5)));
    }

    @Test
    void resetGate_exposesType() {
        assertEquals(Constants.RESET, new Reset(0).getType());
    }

    @Test
    void simulator_resetsQubitToKet0() {
        // |0> --X--> |1> --Reset--> |0>
        Circuit circuit = new Circuit(1);
        CircuitLevel flip = new CircuitLevel();
        flip.addGate(new PauliX(0));
        CircuitLevel reset = new CircuitLevel();
        reset.addGate(new Reset(0));
        circuit.addLevel(flip);
        circuit.addLevel(reset);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        assertEquals(Complex.ONE, sim.getQuantumRegister().getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, sim.getQuantumRegister().getRegisterState().getEntry(1));
    }

    @Test
    void simulator_multiIndexReset_returnsAllZeroState() {
        // Flip qubits 0 and 1, then Reset(0,1) -> |000> (index 0).
        Circuit circuit = new Circuit(3);
        CircuitLevel flip = new CircuitLevel();
        flip.addGate(new PauliX(0));
        flip.addGate(new PauliX(1));
        CircuitLevel reset = new CircuitLevel();
        reset.addGate(new Reset(0, 1));
        circuit.addLevel(flip);
        circuit.addLevel(reset);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        assertEquals(Complex.ONE, sim.getQuantumRegister().getRegisterState().getEntry(0));
        for (int i = 1; i < 8; i++) {
            assertEquals(Complex.ZERO, sim.getQuantumRegister().getRegisterState().getEntry(i), "index " + i);
        }
    }
}
