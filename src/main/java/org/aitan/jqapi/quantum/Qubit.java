/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import java.util.Objects;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.complex.ComplexUtils;
import org.apache.commons.math3.util.MathUtils;
import org.apache.commons.math3.util.Precision;

/**
 *
 * @author Gaetano Ferrara
 */
public class Qubit {

    private final ComplexVector vector;

    private double theta = 0;
    private double phi = 0;

    public Qubit() {
        this.vector = new ComplexVector(new Complex[]{Complex.ONE,Complex.ZERO});

    }

    public Qubit(double alpha) {
        double beta=Math.sqrt(1-Math.pow(alpha, 2));
        this.vector=new ComplexVector(ComplexUtils.convertToComplex(new double[]{alpha,beta}));
//        Complex a = new Complex(alpha, 0);
//        Complex b = a.sqrt1z();
//        this.vector = new ComplexVector(new Complex[]{a,b});
    }
    
    public Qubit(Complex a) {
        Complex b = a.sqrt1z();
        this.vector = new ComplexVector(new Complex[]{a,b});
    }
    
    public Qubit(ComplexVector vector) {
        this.verify(vector);
        this.vector=vector;
    }

    public double zeroProbability() {
        return Precision.round(Math.pow(vector.getEntry(0).abs(),2),4);
    }

    public double oneProbability() {
        return Precision.round(Math.pow(vector.getEntry(1).abs(),2),4);
    }

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

    private void verify(ComplexVector vector) {
        if(vector.getDimension()!=2) {
            throw new IllegalArgumentException("Qubit must have 2 complex value");
        }
        double totalProbability=Precision.round(Math.pow(vector.getEntry(0).abs(),2)+Math.pow(vector.getEntry(1).abs(),2),2);
        if(totalProbability!=1.0) {
            throw new IllegalArgumentException("Qubit must have total probability of 1");
        }
    }
    
    

}
