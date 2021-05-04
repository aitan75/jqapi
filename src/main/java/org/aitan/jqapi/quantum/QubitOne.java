/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import org.apache.commons.math3.util.Precision;

/**
 *
 * @author Gaetano Ferrara
 */
public class QubitOne extends Qubit{

    public QubitOne() {
        super(0);
    }
    
    @Override
    public double zeroProbability() {
        return 0.0;
    }

    @Override
    public double oneProbability() {
        return 1.0;
    }
    
}
