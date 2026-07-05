package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import static org.aitan.jqapi.utils.Constants.*;
/**
 *
 * @author Gaetano Ferrara
 */
public class Identity extends Gate {


    public Identity(Integer...qubitIndex) {
        super(1, ComplexMatrix.createIdentityMatrix(2), IDENTITY,qubitIndex);
    }
}
