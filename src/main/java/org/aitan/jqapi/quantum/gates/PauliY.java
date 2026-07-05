package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class PauliY extends Gate {

    public PauliY(Integer...indexes) {
        super(1, PAULI_Y_MATRIX, PAULI_Y,indexes);
    }
}
