/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import org.aitan.jqapi.math.ComplexVector;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.util.Precision;

/**
 *
 * @author Gaetano Ferrara
 */
public class QubitSuperposition extends Qubit {

    public QubitSuperposition(double alpha) {
        super(alpha);
    }

    public QubitSuperposition(Complex complex) {
        super(complex);
    }

    public QubitSuperposition(ComplexVector vector) {
        this.verify(vector);
        this.vector = vector;
    }

    @Override
    public double zeroProbability() {
        return Precision.round(Math.pow(vector.getEntry(0).abs(), 2), 4);
    }

    @Override
    public double oneProbability() {
        return Precision.round(Math.pow(vector.getEntry(1).abs(), 2), 4);
    }

    private void verify(ComplexVector vector) {
        if (vector.getDimension() != 2) {
            throw new IllegalArgumentException("Qubit must have 2 complex value");
        }
        double totalProbability = Precision.round(Math.pow(vector.getEntry(0).abs(), 2) + Math.pow(vector.getEntry(1).abs(), 2), 2);
        if (totalProbability != 1.0) {
            throw new IllegalArgumentException("Qubit must have total probability of 1");
        }
    }
}
