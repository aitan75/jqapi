package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.SWAP;
import static org.aitan.jqapi.utils.Constants.SWAP_MATRIX;

/**
 *
 * @author Gaetano Ferrara
 */
public class Swap extends Gate{
    public Swap(Integer firstQubit, Integer secondQubit) {
        super(2, SWAP_MATRIX, SWAP, firstQubit, secondQubit);
    }
}
