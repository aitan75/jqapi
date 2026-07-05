package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class PauliS extends Gate {

    public PauliS(Integer...indexes) {
        super(1, PAULI_S_MATRIX, PAULI_S,indexes);
    }
}
