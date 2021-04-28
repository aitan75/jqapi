/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
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
