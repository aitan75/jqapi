package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class PauliT extends Gate {

    public PauliT(Integer...indexes) {
        super(1, PAULI_T_MATRIX, PAULI_T, indexes);
    }

}
