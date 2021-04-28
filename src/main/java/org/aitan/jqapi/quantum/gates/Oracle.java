/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;

/**
 *
 * @author Gaetano Ferrara
 */
public class Oracle extends Gate {

    public Oracle(ComplexMatrix matrix,Integer...indexes) {
        super((int)(Math.log(matrix.getData().length)/Math.log(2)), matrix, Constants.ORACLE,indexes);
    }
    
}
