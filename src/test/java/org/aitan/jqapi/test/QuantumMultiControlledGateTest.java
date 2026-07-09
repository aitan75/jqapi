package org.aitan.jqapi.test;

import org.aitan.jqapi.math.ComplexMatrix;
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
}
