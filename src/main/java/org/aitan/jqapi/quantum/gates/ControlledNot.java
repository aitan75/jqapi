package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class ControlledNot extends Gate {



    public ControlledNot(Integer controlQubit, Integer targetQubit) {
        super(2, CONTROLLED_NOT_MATRIX, CNot, controlQubit, targetQubit);
    }

    
    
}
