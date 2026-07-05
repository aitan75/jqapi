package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import static org.aitan.jqapi.utils.Constants.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class Measurement extends Gate {
    
	public Measurement(Integer... indexes) {
		super(1, ComplexMatrix.createIdentityMatrix(2),MEASUREMENT,indexes);
	}
  
}
