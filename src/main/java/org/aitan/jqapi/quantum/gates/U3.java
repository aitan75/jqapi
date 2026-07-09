package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * U3(theta, phi, lambda) — universal single-qubit rotation.
 *
 * @author Gaetano Ferrara
 */
public class U3 extends Gate {

    public U3(double theta, double phi, double lambda, Integer... indexes) {
        super(1, Constants.u3Matrix(theta, phi, lambda), Constants.U3, indexes);
    }
}
