package org.aitan.jqapi.test;

import java.util.Collections;
import java.util.Arrays;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.apache.commons.math3.complex.Complex;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Direct unit tests for the QuantumRegister class.
 */
public class QuantumRegisterTest {

    private static final double EPS = 1e-9;

    @Test
    public void testApplyOperatorDirect() {
        // Create a 2-qubit register initialized to |00>
        QuantumRegister qreg = new QuantumRegister(2);
        
        // H gate matrix
        ComplexMatrix hMatrix = new Hadamard(0).getMatrix();
        
        // Apply H to qubit 0: (|00> + |10>) / sqrt(2)
        qreg.applyOperator(hMatrix, Collections.singletonList(0));
        
        ComplexVector state = qreg.getRegisterState();
        double invSqrt2 = 1.0 / Math.sqrt(2.0);
        
        assertEquals(invSqrt2, state.getEntry(0).getReal(), EPS); // |00>
        assertEquals(invSqrt2, state.getEntry(2).getReal(), EPS); // |10>
        assertEquals(0.0, state.getEntry(1).getReal(), EPS);      // |01>
        assertEquals(0.0, state.getEntry(3).getReal(), EPS);      // |11>
    }

    @Test
    public void testApplyOperatorInvalidDimension() {
        QuantumRegister qreg = new QuantumRegister(2);
        
        // Hadamard is 2x2, but we pass it as target for 2 qubits (which requires 4x4 matrix)
        ComplexMatrix hMatrix = new Hadamard(0).getMatrix();
        
        assertThrows(IllegalArgumentException.class, () -> {
            qreg.applyOperator(hMatrix, Arrays.asList(0, 1));
        });
    }

    @Test
    public void testGetRegisterStateReturnsDefensiveCopy() {
        QuantumRegister qreg = new QuantumRegister(2);
        ComplexVector state1 = qreg.getRegisterState();
        
        // Mutate the returned vector
        state1.setEntry(0, Complex.ZERO);
        
        // Get the state again
        ComplexVector state2 = qreg.getRegisterState();
        
        // The original state should not be affected by the mutation of state1
        assertEquals(Complex.ONE, state2.getEntry(0));
    }
}
