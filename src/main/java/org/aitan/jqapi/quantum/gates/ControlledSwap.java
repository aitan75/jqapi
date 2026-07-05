package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class ControlledSwap extends Gate {

    public ControlledSwap(Integer firstQubit, Integer secondQubit, Integer thirdQubit) {
        super(3, CONTROLLED_SWAP_MATRIX, CONTROLLED_SWAP, firstQubit, secondQubit, thirdQubit);
    }
}
