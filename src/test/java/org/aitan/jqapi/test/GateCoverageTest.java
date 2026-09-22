package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.utils.Constants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class GateCoverageTest {

    @Test @DisplayName("Gate verify duplicate indexes branch")
    void gateVerifyDuplicateIndexes() {
        // Gate with 1 qubit should pass verify (idxs.length == 1)
        Hadamard h = new Hadamard(new Integer[]{0});
        assertEquals(1, h.getNumberQubits());
        assertEquals(2, h.getSize());
        assertNotNull(h.getMatrix());
        assertEquals("[0]", h.getIndexes().toString());
        assertEquals(Constants.HADAMARD, h.getType());

        // Gate with duplicate indexes should throw IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () ->
            new Hadamard(new Integer[]{0, 0}) // duplicate
        );

        // Other gates with duplicate indexes
        assertThrows(IllegalArgumentException.class, () ->
            new PauliX(new Integer[]{1, 1})
        );
        assertThrows(IllegalArgumentException.class, () ->
            new ControlledNot(0, 0) // control and target same
        );
    }

    @Test @DisplayName("Gate getters")
    void gateGetters() {
        ComplexMatrix m = ComplexMatrix.createMatrixWithData(new org.aitan.jqapi.math.Complex[][]{
            {Complex.ONE, Complex.ZERO}, {Complex.ZERO, Complex.ONE}
        });
        Gate gate = new Gate(1, m, "TEST", new Integer[]{2}) {
            @Override public String getType() { return "TEST"; }
        };
        assertEquals(m, gate.getMatrix());
        assertEquals(1, gate.getNumberQubits());
        assertEquals(2, gate.getSize());
        assertEquals("[2]", gate.getIndexes().toString());
        assertEquals("TEST", gate.getType());
    }
}