package org.aitan.jqapi.test;

import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class QuantumRegisterOperatorValidationTest {
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void invalidTargetsAreRejectedBeforeChangingState(boolean parallel) {
        QuantumRegister register = new QuantumRegister(2, JQAPIConfig.sequential(2));
        assertThrows(JQApiLimitException.class,
                () -> register.applyOperator(Constants.HADAMARD_MATRIX, List.of(-1), parallel));
        assertThrows(JQApiLimitException.class,
                () -> register.applyOperator(Constants.HADAMARD_MATRIX, List.of(2), parallel));
        assertThrows(IllegalArgumentException.class,
                () -> register.applyOperator(ComplexMatrix.createIdentityMatrix(4), List.of(0, 0), parallel));
        // Java masks shift distances: validate arity before computing 1 << k.
        assertThrows(IllegalArgumentException.class,
                () -> register.applyOperator(ComplexMatrix.createIdentityMatrix(1), Collections.nCopies(32, 0), parallel));
        assertThrows(NullPointerException.class,
                () -> register.applyOperator(Constants.HADAMARD_MATRIX, Collections.singletonList(null), parallel));
        assertEquals(Complex.ONE, register.getRegisterState().getEntry(0));
        for (int i = 1; i < 4; i++) {
            assertEquals(Complex.ZERO, register.getRegisterState().getEntry(i));
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void rectangularOperatorIsRejectedBeforeChangingState(boolean parallel) {
        QuantumRegister register = new QuantumRegister(1, JQAPIConfig.sequential(1));
        for (int columns : new int[]{1, 3}) {
            Complex[][] data = new Complex[2][columns];
            for (Complex[] row : data) {
                java.util.Arrays.fill(row, Complex.ONE);
            }
            ComplexMatrix operator = ComplexMatrix.createMatrixWithData(data);
            assertThrows(IllegalArgumentException.class,
                    () -> register.applyOperator(operator, List.of(0), parallel));
        }
        assertEquals(Complex.ONE, register.getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, register.getRegisterState().getEntry(1));
    }
}
