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
public class GenericGate extends Gate {

    public GenericGate(ComplexMatrix matrix, int size,Integer...qubitIndex) {
        super(size, matrix, "Generic Gate", qubitIndex);
    }
    
}
