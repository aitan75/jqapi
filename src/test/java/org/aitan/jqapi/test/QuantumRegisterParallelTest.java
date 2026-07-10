package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumRegisterParallelTest {

    private static final double TOL = 1e-9;

    // A dense state: Hadamard on every qubit (built via the sequential path).
    private static QuantumRegister uniformSuperposition(int n) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int q = 0; q < n; q++) {
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(q), false);
        }
        return reg;
    }

    private static void assertRegistersEqual(QuantumRegister a, QuantumRegister b, int n) {
        ComplexVector va = a.getRegisterState();
        ComplexVector vb = b.getRegisterState();
        int dim = 1 << n;
        for (int i = 0; i < dim; i++) {
            assertEquals(va.getEntry(i), vb.getEntry(i), "amplitude " + i);
        }
    }

    @Test
    void parallel_matchesSequential_hadamard() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), false);
        par.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_cnotNonAdjacent() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), false);
        par.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_rotationZ() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), false);
        par.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void autoPath_largeRegister_hadamardIsCorrect() {
        int n = 16; // dimension 65536 >= PARALLEL_MIN_DIMENSION -> auto parallel
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)); // auto path
        double inv = 1.0 / Math.sqrt(2.0);
        // Qubit 0 is the MSB: its |1> branch is index (1 << (n-1)).
        assertEquals(inv, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(0).getImaginary(), TOL);
        assertEquals(inv, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(12345).getReal(), TOL);
    }

    @Test
    void autoPath_hadamardTwice_isIdentity() {
        int n = 16;
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        assertEquals(1.0, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
    }
}
