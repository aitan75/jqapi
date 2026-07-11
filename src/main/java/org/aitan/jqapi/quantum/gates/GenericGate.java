package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class GenericGate extends Gate {

    public GenericGate(ComplexMatrix matrix, int size,Integer...qubitIndex) {
        super(size, matrix, GENERIC_GATE, qubitIndex);
    }
    
}
