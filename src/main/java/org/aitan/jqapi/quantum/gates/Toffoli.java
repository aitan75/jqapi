package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.TOFFOLI;
import static org.aitan.jqapi.utils.Constants.TOFFOLI_MATRIX;

/**
 *
 * @author Gaetano Ferrara
 */
public class Toffoli extends Gate {

    public Toffoli(Integer firstQubit, Integer secondQubit, Integer thirdQubit) {
        super(3, TOFFOLI_MATRIX, TOFFOLI, firstQubit, secondQubit, thirdQubit);
    }
}
