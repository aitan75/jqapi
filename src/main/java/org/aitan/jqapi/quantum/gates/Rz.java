package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Rz(theta) — rotation about the Z axis.
 *
 * @author Gaetano Ferrara
 */
public class Rz extends Gate {

    public Rz(double theta, Integer... indexes) {
        super(1, Constants.rotationZMatrix(theta), Constants.RZ, indexes);
    }
}
