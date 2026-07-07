package org.aitan.jqapi.test;

import java.util.Arrays;
import java.util.Collections;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledSwap;
import org.aitan.jqapi.quantum.gates.ControlledY;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliS;
import org.aitan.jqapi.quantum.gates.PauliT;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.PauliY;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Golden-master characterization tests for issue #12 phase 2: the expected
 * amplitudes below were captured from the pre-migration, Complex-based
 * QuantumRegister and must keep passing unmodified after the internal state
 * migrates to a primitive double[]. Every state is prepared deterministically
 * via applyOperator (no measurement). Conventions: qubit 0 is the most
 * significant bit of the state index; in a multi-qubit gate the first target
 * qubit is the most significant bit of the gate's local basis.
 */
public class QuantumRegisterGoldenMasterTest {

    private static final double EPS = 1e-9;
    private static final double INV_SQRT2 = 1.0 / Math.sqrt(2.0);
    /** Uniform amplitude of a 3-qubit register after H on every qubit. */
    private static final double UNIFORM_3 = 1.0 / (2.0 * Math.sqrt(2.0));

    /** Asserts every amplitude of the register, given as interleaved (re, im) pairs. */
    private static void assertState(QuantumRegister qreg, double... expectedInterleaved) {
        ComplexVector state = qreg.getRegisterState();
        assertEquals(expectedInterleaved.length / 2, state.getDimension(), "state dimension");
        for (int i = 0; i < state.getDimension(); i++) {
            assertEquals(expectedInterleaved[2 * i], state.getEntry(i).getReal(), EPS, "re[" + i + "]");
            assertEquals(expectedInterleaved[2 * i + 1], state.getEntry(i).getImaginary(), EPS, "im[" + i + "]");
        }
    }

    //--- single-qubit gates on a 1-qubit register ---

    @Test
    public void testHadamardOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        //H|0> = (|0> + |1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, INV_SQRT2, 0);
    }

    @Test
    public void testPauliXOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        //X|0> = |1>
        assertState(qreg, 0, 0, 1, 0);
    }

    @Test
    public void testPauliYOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new PauliY(0).getMatrix(), Collections.singletonList(0));
        //Y|0> = i|1>
        assertState(qreg, 0, 0, 0, 1);
    }

    @Test
    public void testPauliZOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliZ(0).getMatrix(), Collections.singletonList(0));
        //ZH|0> = (|0> - |1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, -INV_SQRT2, 0);
    }

    @Test
    public void testPauliSOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliS(0).getMatrix(), Collections.singletonList(0));
        //SH|0> = (|0> + i|1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0, INV_SQRT2);
    }

    @Test
    public void testPauliTOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliT(0).getMatrix(), Collections.singletonList(0));
        //TH|0> = (|0> + e^{i*pi/4}|1>)/sqrt(2); e^{i*pi/4}/sqrt(2) = 0.5 + 0.5i
        assertState(qreg, INV_SQRT2, 0, 0.5, 0.5);
    }

    //--- single-qubit gates applied to one target (qubit 1) of a 2-qubit register ---

    @Test
    public void testHadamardOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        //(|00> + |01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, INV_SQRT2, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliXOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        //|01>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliYOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliY(1).getMatrix(), Collections.singletonList(1));
        //i|01>
        assertState(qreg, 0, 0, 0, 1, 0, 0, 0, 0);
    }

    @Test
    public void testPauliZOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliZ(1).getMatrix(), Collections.singletonList(1));
        //(|00> - |01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, -INV_SQRT2, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliSOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliS(1).getMatrix(), Collections.singletonList(1));
        //(|00> + i|01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0, INV_SQRT2, 0, 0, 0, 0);
    }

    @Test
    public void testPauliTOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliT(1).getMatrix(), Collections.singletonList(1));
        //(|00> + e^{i*pi/4}|01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0.5, 0.5, 0, 0, 0, 0);
    }

    //--- 2-qubit gates on a 2-qubit register ---

    @Test
    public void testControlledNotOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CNOT(control 0, target 1)|10> = |11>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 1, 0);
    }

    @Test
    public void testControlledZOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledZ(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CZ on the uniform 2-qubit state flips the sign of |11> only
        assertState(qreg, 0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0);
    }

    @Test
    public void testControlledYOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledY(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CY on (|10> + |11>)/sqrt(2): |10> <- -i/sqrt(2), |11> <- i/sqrt(2)
        assertState(qreg, 0, 0, 0, 0, 0, -INV_SQRT2, 0, INV_SQRT2);
    }

    @Test
    public void testSwapOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Swap(0, 1).getMatrix(), Arrays.asList(0, 1));
        //Swap|10> = |01>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    //--- 2-qubit gates on a 3-qubit register, non-adjacent targets (qubits 0 and 2) ---

    @Test
    public void testControlledNotOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 2).getMatrix(), Arrays.asList(0, 2));
        //CNOT(control 0, target 2)|100> = |101>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    @Test
    public void testControlledZOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledZ(0, 2).getMatrix(), Arrays.asList(0, 2));
        //Uniform over qubits 0 and 2 (qubit 1 stays |0>): |000>,|001>,|100>,|101> at 1/2;
        //CZ(0,2) flips the sign of |101> only
        assertState(qreg, 0.5, 0, 0.5, 0, 0, 0, 0, 0, 0.5, 0, -0.5, 0, 0, 0, 0, 0);
    }

    @Test
    public void testControlledYOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledY(0, 2).getMatrix(), Arrays.asList(0, 2));
        //CY(0,2) on (|100> + |101>)/sqrt(2): |100> <- -i/sqrt(2), |101> <- i/sqrt(2)
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, -INV_SQRT2, 0, INV_SQRT2, 0, 0, 0, 0);
    }

    @Test
    public void testSwapOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Swap(0, 2).getMatrix(), Arrays.asList(0, 2));
        //Swap(0,2)|100> = |001>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    //--- 3-qubit gates on a 3-qubit register ---

    @Test
    public void testToffoliOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new Toffoli(0, 1, 2).getMatrix(), Arrays.asList(0, 1, 2));
        //Toffoli|110> = |111>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0);
    }

    @Test
    public void testControlledSwapOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledSwap(0, 1, 2).getMatrix(), Arrays.asList(0, 1, 2));
        //CSwap(control 0)|110> = |101>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    //--- multi-level circuits on a 3-qubit register ---

    @Test
    public void testMultiLevelHadamardAllThenControlledNot() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledNot(0, 1).getMatrix(), Arrays.asList(0, 1));
        //The uniform state is invariant under the CNOT permutation: all amplitudes 1/(2*sqrt(2))
        assertState(qreg,
                UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0,
                UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0);
    }

    @Test
    public void testMultiLevelHadamardPauliTThenControlledNot() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliT(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 2).getMatrix(), Arrays.asList(0, 2));
        //H(0) then T(0): (|000> + e^{i*pi/4}|100>)/sqrt(2); CNOT(0,2) moves |100> to |101>.
        //Entangled final state: |000>/sqrt(2) + (0.5 + 0.5i)|101>
        assertState(qreg, INV_SQRT2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 0);
    }
}
