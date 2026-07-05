package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class PauliZ extends Gate {

    public PauliZ(Integer...indexes) {
        super(1, PAULI_Z_MATRIX, PAULI_Z, indexes);
    }
}
