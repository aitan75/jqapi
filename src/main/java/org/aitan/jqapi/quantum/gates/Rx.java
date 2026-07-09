package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Rx(theta) — rotation about the X axis.
 *
 * @author Gaetano Ferrara
 */
public class Rx extends Gate {

    public Rx(double theta, Integer... indexes) {
        super(1, Constants.rotationXMatrix(theta), Constants.RX, indexes);
    }
}
