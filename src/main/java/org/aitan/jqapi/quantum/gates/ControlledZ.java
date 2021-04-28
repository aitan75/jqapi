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
public class ControlledZ extends Gate {

    public ControlledZ(Integer controlQubit, Integer targetQubit) {
        super(2, CONTROLLED_Z_MATRIX, CZ, controlQubit, targetQubit);
    }

    
    
}
