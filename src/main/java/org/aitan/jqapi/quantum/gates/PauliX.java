/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
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
