package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class ControlledY extends Gate {

    public ControlledY(Integer controlQubit, Integer targetQubit) {
        super(2, CONTROLLED_Y_MATRIX, CY, controlQubit, targetQubit);
    }

    
    
}
