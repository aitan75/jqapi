package org.aitan.jqapi.test;

import java.util.HashSet;
import java.util.Set;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

/**
 * Guardrail for issue #5 enabler: every concrete gate's {@code getType()} must
 * come from a {@link Constants} constant, and the labels must be pairwise unique.
 */
public class GateTypeTest {

    private static final ComplexMatrix ID2 = ComplexMatrix.createIdentityMatrix(2);

    // One instance of every concrete gate paired with its expected Constants label.
    private static Object[][] gatesAndExpectedTypes() {
        return new Object[][]{
            {new Identity(0), Constants.IDENTITY},
            {new Hadamard(0), Constants.HADAMARD},
            {new PauliX(0), Constants.PAULI_X},
            {new PauliY(0), Constants.PAULI_Y},
            {new PauliZ(0), Constants.PAULI_Z},
            {new PauliS(0), Constants.PAULI_S},
            {new PauliT(0), Constants.PAULI_T},
            {new Rx(0.4, 0), Constants.RX},
            {new Ry(0.4, 0), Constants.RY},
            {new Rz(0.4, 0), Constants.RZ},
            {new Phase(0.4, 0), Constants.PHASE},
            {new U3(0.4, 0.5, 0.6, 0), Constants.U3},
            {new ControlledNot(0, 1), Constants.CNot},
            {new ControlledY(0, 1), Constants.CY},
            {new ControlledZ(0, 1), Constants.CZ},
            {new Swap(0, 1), Constants.SWAP},
            {new ControlledSwap(0, 1, 2), Constants.CONTROLLED_SWAP},
            {new Toffoli(0, 1, 2), Constants.TOFFOLI},
            {new MultiControlled(Constants.PAULI_X_MATRIX, 1, 0, 1), Constants.MULTI_CONTROLLED},
            {new Oracle(ID2, 0), Constants.ORACLE},
            {new GenericGate(ID2, 1, 0), Constants.GENERIC_GATE},
            {new Measurement(0), Constants.MEASUREMENT},
            {new Reset(0), Constants.RESET},
        };
    }

    @Test
    void everyGateTypeComesFromItsConstant() {
        for (Object[] row : gatesAndExpectedTypes()) {
            Gate gate = (Gate) row[0];
            String expected = (String) row[1];
            assertEquals(expected, gate.getType(), gate.getClass().getSimpleName());
        }
    }

    @Test
    void gateTypeLabelsAreUnique() {
        Object[][] rows = gatesAndExpectedTypes();
        Set<String> seen = new HashSet<>();
        for (Object[] row : rows) {
            String type = ((Gate) row[0]).getType();
            assertTrue(seen.add(type), "duplicate gate type label: " + type);
        }
        assertEquals(rows.length, seen.size());
    }
}
