package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Phase-shift gate P(theta) = diag(1, e^(i·theta)).
 *
 * @author Gaetano Ferrara
 */
public class Phase extends Gate {

    public Phase(double theta, Integer... indexes) {
        super(1, Constants.phaseMatrix(theta), Constants.PHASE, indexes);
    }
}
