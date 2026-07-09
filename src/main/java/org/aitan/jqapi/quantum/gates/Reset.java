package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;

/**
 * Mid-circuit reset: forces each listed qubit to {@code |0>}. Non-unitary — its
 * matrix is the identity and the simulator special-cases it by type, like
 * {@link Measurement}.
 *
 * @author Gaetano Ferrara
 */
public class Reset extends Gate {

    public Reset(Integer... indexes) {
        super(1, ComplexMatrix.createIdentityMatrix(2), Constants.RESET, indexes);
    }
}
