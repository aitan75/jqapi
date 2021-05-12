/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.math;

import java.util.List;
import org.aitan.jqapi.quantum.gates.Gate;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.complex.ComplexField;
import org.apache.commons.math3.linear.BlockFieldMatrix;
import org.apache.commons.math3.linear.FieldMatrix;
import org.apache.commons.math3.linear.MatrixUtils;

/**
 *
 * @author Gaetano Ferrara
 */
public class ComplexMatrix extends BlockFieldMatrix<Complex> {


    private ComplexMatrix(Complex[][] data) {
        super(data);
    }
    private ComplexMatrix(FieldMatrix<Complex> matrix) {
        super(matrix.getData());
    }
    
    public static ComplexMatrix createIdentityMatrix(int size) {
        return new ComplexMatrix(MatrixUtils.createFieldIdentityMatrix(ComplexField.getInstance(), size));
    }
    
    public static ComplexMatrix createMatrixWithData(Complex[][] data) {
        return new ComplexMatrix(data);
    }
    
    public static ComplexMatrix createGateMatrix(Gate g) {
        return g.getMatrix();
    }
    
    public static ComplexMatrix kroneckerProduct(List<ComplexMatrix> matrixList) {
        if (matrixList == null || matrixList.size() <= 0)
            throw new IllegalArgumentException("No input matrices");
        if (matrixList.size() == 1)
            return matrixList.get(0); // nothing to do, only one matrix

        // calculate the dimensions of the Kronecker product matrix
        int totalRows = 1;
        int totalCols = 1;
        for(ComplexMatrix matrix: matrixList)
        {
            totalRows *= matrix.getRowDimension();
            totalCols *= matrix.getColumnDimension();
        }

        // create a matrix to hold the data
        Complex[][] productData = new Complex[totalRows][totalCols];
        // initialize to 1 (allows us to multiple the contents of each matrix
        // onto the result sequentially
        for(int prodRow = 0; prodRow < totalRows; prodRow++)
        {
            for(int prodCol = 0; prodCol < totalCols; prodCol++)
            {
                productData[prodRow][prodCol] = Complex.ONE;
            }
        }

        // multiply the contents of each matrix onto the result
        int maxRow = totalRows;
        int maxCol = totalCols;
        for(ComplexMatrix matrix: matrixList)
        {
            maxRow /= matrix.getRowDimension();
            maxCol /= matrix.getColumnDimension();
            int matrixRow = 0;
            int matrixCol = 0;
            // multiply onto the result
            for(int prodRow = 0, sectionRow = 0; prodRow < totalRows; prodRow++, sectionRow++)
            {
                matrixCol = 0;
                Complex value = matrix.getEntry(matrixRow, matrixCol);
                for(int prodCol = 0, sectionCol = 0; prodCol < totalCols; prodCol++, sectionCol++)
                {
                    productData[prodRow][prodCol] = productData[prodRow][prodCol].multiply(value);
                    if (sectionCol >= maxCol - 1)
                    {
                        matrixCol++;
                        if (matrixCol >= matrix.getColumnDimension()) matrixCol = 0;
                        sectionCol = -1;
                        value = matrix.getEntry(matrixRow, matrixCol);
                    }
                }
                if (sectionRow >= maxRow-1)
                {
                    matrixRow++;
                    if (matrixRow >= matrix.getRowDimension()) matrixRow = 0;
                    sectionRow = -1;
                }
            }
        }
        // return a new matrix containing the Kronecker product
        return new ComplexMatrix(productData);
    
    }
    
    @Override
    public String toString() {
        return "ComplexMatrix{" + super.toString()+'}';
    }

}
