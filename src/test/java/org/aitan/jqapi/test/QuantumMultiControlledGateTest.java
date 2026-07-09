package org.aitan.jqapi.test;

import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumMultiControlledGateTest {

    @Test
    void c1x_equals_controlledNot() {
        assertEquals(Constants.CONTROLLED_NOT_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 1));
    }

    @Test
    void c1z_equals_controlledZ() {
        assertEquals(Constants.CONTROLLED_Z_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_Z_MATRIX, 1));
    }

    @Test
    void c2x_equals_toffoli() {
        assertEquals(Constants.TOFFOLI_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 2));
    }

    @Test
    void c3x_hasDimension16() {
        ComplexMatrix m = ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 3);
        assertEquals(16, m.getRowDimension());
        assertEquals(16, m.getColumnDimension());
    }

    @Test
    void factory_rejectsInvalidInput() {
        // numControls < 1
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 0));
        // non-square U
        ComplexMatrix nonSquare = ComplexMatrix.createMatrixWithData(new org.aitan.jqapi.math.Complex[][]{
            {org.aitan.jqapi.math.Complex.ONE, org.aitan.jqapi.math.Complex.ZERO}});
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(nonSquare, 1));
        // dimension not a power of two (3x3)
        ComplexMatrix threeByThree = ComplexMatrix.createIdentityMatrix(3);
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(threeByThree, 1));
    }

    // Runs the circuit and returns the resulting register state.
    private static QuantumRegister run(CircuitLevel... levels) {
        Circuit circuit = new Circuit(3);
        for (CircuitLevel level : levels) {
            circuit.addLevel(level);
        }
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        return sim.getQuantumRegister();
    }

    // Asserts the 3-qubit register is exactly the basis state |index>.
    private static void assertBasisState(QuantumRegister reg, int index) {
        for (int i = 0; i < 8; i++) {
            Complex amp = reg.getRegisterState().getEntry(i);
            if (i == index) {
                assertEquals(Complex.ONE, amp, "amplitude at " + i);
            } else {
                assertEquals(Complex.ZERO, amp, "amplitude at " + i);
            }
        }
    }

    // Prepares the 3-qubit basis state |index> by applying X to each set bit
    // (qubit 0 is the most significant bit).
    private static CircuitLevel basisPrep(int index) {
        CircuitLevel level = new CircuitLevel();
        for (int q = 0; q < 3; q++) {
            int bit = (index >> (2 - q)) & 1;
            if (bit == 1) {
                level.addGate(new PauliX(q));
            }
        }
        return level;
    }

    @Test
    void gate_exposesMatrixAndType() {
        MultiControlled g = new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2);
        assertEquals(ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 2), g.getMatrix());
        assertEquals(Constants.MULTI_CONTROLLED, g.getType());
    }

    @Test
    void gate_rejectsWrongIndexCount() {
        // C2(X) needs 2 controls + 1 target = 3 indexes; give 2.
        assertThrows(IllegalArgumentException.class,
                () -> new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1));
    }

    @Test
    void c2x_flipsTarget_whenAllControlsSet() {
        // Prepare |110> (q0=1,q1=1,q2=0 = index 6), then C2(X) on controls 0,1 target 2 -> |111> (index 7).
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        prep.addGate(new PauliX(1));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
        assertBasisState(run(prep, mc), 7);
    }

    @Test
    void c2x_noFlip_whenNotAllControlsSet() {
        // Prepare |100> (index 4), C2(X) controls 0,1: q1=0 so no flip -> stays |100>.
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
        assertBasisState(run(prep, mc), 4);
    }

    @Test
    void c2x_equivalentToToffoliGate_onAllBasisInputs() {
        for (int input = 0; input < 8; input++) {
            CircuitLevel prepA = basisPrep(input);
            CircuitLevel mc = new CircuitLevel();
            mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
            QuantumRegister a = run(prepA, mc);

            CircuitLevel prepB = basisPrep(input);
            CircuitLevel toff = new CircuitLevel();
            toff.addGate(new Toffoli(0, 1, 2));
            QuantumRegister b = run(prepB, toff);

            for (int i = 0; i < 8; i++) {
                assertEquals(a.getRegisterState().getEntry(i), b.getRegisterState().getEntry(i),
                        "input " + input + " amplitude " + i);
            }
        }
    }

    @Test
    void c2x_nonAdjacent_controls0and2_target1() {
        // Prepare |101> (q0=1,q1=0,q2=1 = index 5). Controls 0 and 2 are both 1 -> flip q1 -> |111> (index 7).
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        prep.addGate(new PauliX(2));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 2, 1));
        assertBasisState(run(prep, mc), 7);
    }
}
