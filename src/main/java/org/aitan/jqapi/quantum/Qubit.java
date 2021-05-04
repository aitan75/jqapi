/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.complex.ComplexUtils;
import org.apache.commons.math3.util.Precision;

/**
 *
 * @author Gaetano Ferrara
 */
public abstract class Qubit {

    protected ComplexVector vector;

    private double theta = 0;
    private double phi = 0;

    public Qubit() {
        this.vector = new ComplexVector(new Complex[]{Complex.ONE,Complex.ZERO});

    }

    public Qubit(double alpha) {
        double beta=Math.sqrt(1-Math.pow(alpha, 2));
        this.vector=new ComplexVector(ComplexUtils.convertToComplex(new double[]{alpha,beta}));
    }
    
    public Qubit(Complex a) {
        Complex b = a.sqrt1z();
        this.vector = new ComplexVector(new Complex[]{a,b});
    }

    public abstract double zeroProbability();

    public abstract double oneProbability();

    @Override
    public String toString() {
        String toString = vector.getEntry(0).equals(Complex.ZERO) ? Constants.ONE_QUANTUM : vector.getEntry(1).equals(Complex.ZERO) ? Constants.ZERO_QUANTUM : vector.getEntry(0) + Constants.ZERO_QUANTUM + "+" + vector.getEntry(1) + Constants.ONE_QUANTUM;
        return Constants.PSI_QUANTUM + "=" + toString;
    }
    
    public ComplexVector getValue() {
        return this.vector;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        double real0 = Precision.round(this.vector.getEntry(0).getReal(),4);
        double imaginary0 = Precision.round(this.vector.getEntry(0).getImaginary(),4);
        double real1 = Precision.round(this.vector.getEntry(1).getReal(),4);
        double imaginary1 = Precision.round(this.vector.getEntry(1).getImaginary(),4);
        double realObj0 = Precision.round(((Qubit) obj).vector.getEntry(0).getReal(),4);
        double imaginarObj0 = Precision.round(((Qubit) obj).vector.getEntry(0).getImaginary(),4);
        double realObj1 = Precision.round(((Qubit) obj).vector.getEntry(1).getReal(),4);
        double imaginaryObj1 = Precision.round(((Qubit) obj).vector.getEntry(1).getImaginary(),4);
        
        return real0==realObj0&&imaginary0==imaginarObj0&&real1==realObj1&&imaginary1==imaginaryObj1;
        
    }

    
    

}
