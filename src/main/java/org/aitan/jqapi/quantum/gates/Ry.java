package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Ry(theta) — rotation about the Y axis.
 *
 * @author Gaetano Ferrara
 */
public class Ry extends Gate {

    public Ry(double theta, Integer... indexes) {
        super(1, Constants.rotationYMatrix(theta), Constants.RY, indexes);
    }
}
