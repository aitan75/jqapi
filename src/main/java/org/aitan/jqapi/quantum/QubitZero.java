/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

/**
 *
 * @author Gaetano Ferrara
 */
public class QubitZero extends Qubit {

    public QubitZero() {
        super(1);
    }

    @Override
    public double zeroProbability() {
        return 1.0;
    }

    @Override
    public double oneProbability() {
        return 0.0;
    }

}
