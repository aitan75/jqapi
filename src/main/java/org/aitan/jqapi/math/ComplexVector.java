/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.math;

import java.util.Arrays;
import org.aitan.jqapi.utils.Utils;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.complex.ComplexField;
import org.apache.commons.math3.linear.ArrayFieldVector;
import org.apache.commons.math3.linear.FieldMatrix;
import org.apache.commons.math3.linear.FieldVector;

/**
 *
 * @author Gaetano Ferrara
 */
public class ComplexVector extends ArrayFieldVector<Complex> {

    public ComplexVector(int size) {
        super(ComplexField.getInstance(), size);
    }

    public ComplexVector(Complex[] complex) {
        super(complex, false);
    }

    public ComplexVector tensorProduct(ComplexVector vector) {
        return this.matrixVectorization(this.outerProduct(vector));

    }

    public ComplexVector matrixVectorization(FieldMatrix<Complex> matrix) {
        ComplexVector output = new ComplexVector(matrix.getRowDimension() * matrix.getColumnDimension());
        int rowDimension = matrix.getRowDimension();
        int columnDimension = matrix.getColumnDimension();
        for (int i = 0; i < columnDimension; i++) {
            output.set(i * rowDimension, new ComplexVector(matrix.getColumn(i)));
        }
        return output;
    }

    public static ComplexVector[] factorize(FieldVector<Complex> vector) {
        int vectorSize = vector.getDimension();
        int size = (int) (Math.log(vectorSize) / Math.log(2));
        Complex[] toArray = vector.toArray();
        ComplexVector[] output = new ComplexVector[size];
        for (int i = 0; i < output.length; i++) {
            output[i] = new ComplexVector(2);
        }

        for (int j=0;j<size;j++) {
            int i = 0;
            for (Complex complex : toArray) {
                int bitAtIndex =  Utils.bitAtIndex(j, i, size);
                Complex newValue = output[j].getEntry(bitAtIndex).add(Math.pow(complex.abs(), 2));
                output[j].setEntry(bitAtIndex, newValue);
                i++;
            }
            output[j].setEntry(0, output[j].getEntry(0).sqrt());
            output[j].setEntry(1, output[j].getEntry(1).sqrt());
        }

        return output;
    }

    @Override
    public String toString() {
        return "ComplexVector{" + Arrays.toString(this.getData()) + '}';
    }

}
