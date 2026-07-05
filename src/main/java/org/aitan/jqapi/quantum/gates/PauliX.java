package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class PauliX extends Gate {

    public PauliX(Integer... indexes) {
        super(1, PAULI_X_MATRIX, PAULI_X, indexes);
    }

}
