package org.aitan.jqapi.math;

import java.util.Arrays;
import org.aitan.jqapi.utils.Utils;

/**
 * A dense complex vector, backed by a primitive {@code double[]} in interleaved
 * {@code (re, im)} layout ({@code data[2i]} = real, {@code data[2i+1]} = imaginary).
 * <p>
 * This is the issue #12 replacement for the previous
 * {@code ArrayFieldVector<Complex>} subclass: the public method names and
 * behavior are preserved, but there is no longer any commons-math3 dependency.
 *
 * @author Gaetano Ferrara
 */
public class ComplexVector {

    private final double[] data;

    /**
     * Creates a zero-filled vector.
     *
     * @param size number of complex entries
     */
    public ComplexVector(int size) {
        this.data = new double[size * 2];
    }

    /**
     * Creates a vector from complex values (boxing boundary).
     *
     * @param values the complex entries
     */
    public ComplexVector(Complex[] values) {
        this.data = new double[values.length * 2];
        for (int i = 0; i < values.length; i++) {
            this.data[2 * i] = values[i].getReal();
            this.data[2 * i + 1] = values[i].getImaginary();
        }
    }

    /**
     * @param index the entry index
     * @return the complex entry at {@code index}
     */
    public Complex getEntry(int index) {
        return box(data[2 * index], data[2 * index + 1]);
    }

    /**
     * @param index the entry index
     * @param value the complex value to store
     */
    public void setEntry(int index, Complex value) {
        data[2 * index] = value.getReal();
        data[2 * index + 1] = value.getImaginary();
    }

    /** @return the number of complex entries */
    public int getDimension() {
        return data.length / 2;
    }

    /** @return the complex entries of this vector (boxing boundary) */
    public Complex[] getData() {
        int dimension = getDimension();
        Complex[] out = new Complex[dimension];
        for (int i = 0; i < dimension; i++) {
            out[i] = box(data[2 * i], data[2 * i + 1]);
        }
        return out;
    }

    /**
     * @param vector the right-hand vector
     * @return the outer product {@code this ⊗ vectorᵀ} as a matrix whose entry
     *         {@code (i, j)} is {@code this[i] * vector[j]}
     */
    public ComplexMatrix outerProduct(ComplexVector vector) {
        int rows = this.getDimension();
        int cols = vector.getDimension();
        Complex[][] product = new Complex[rows][cols];
        for (int r = 0; r < rows; r++) {
            Complex left = this.getEntry(r);
            for (int c = 0; c < cols; c++) {
                product[r][c] = left.multiply(vector.getEntry(c));
            }
        }
        return ComplexMatrix.createMatrixWithData(product);
    }

    /**
     * Computes the (non-conjugated) dot product {@code Σ this[i] * vector[i]},
     * matching the field-vector semantics of the previous implementation.
     *
     * @param vector the right-hand vector
     * @return the dot product
     */
    public Complex dotProduct(ComplexVector vector) {
        Complex sum = Complex.ZERO;
        int dimension = getDimension();
        for (int i = 0; i < dimension; i++) {
            sum = sum.add(this.getEntry(i).multiply(vector.getEntry(i)));
        }
        return sum;
    }

    /**
     * @param vector the right-hand vector
     * @return the tensor (Kronecker) product of this vector with {@code vector}
     */
    public ComplexVector tensorProduct(ComplexVector vector) {
        ComplexMatrix outer = this.outerProduct(vector);
        int rows = this.getDimension();
        int cols = vector.getDimension();
        ComplexVector output = new ComplexVector(rows * cols);
        for (int c = 0; c < cols; c++) {
            for (int r = 0; r < rows; r++) {
                output.setEntry(c * rows + r, outer.getEntry(r, c));
            }
        }
        return output;
    }

    /**
     * Factorizes a state vector into per-qubit marginal amplitude vectors,
     * derived from the marginal measurement probabilities.
     *
     * @param vector the state vector to factorize
     * @return one two-component vector per qubit
     */
    public static ComplexVector[] factorize(ComplexVector vector) {
        int vectorSize = vector.getDimension();
        int size = (int) Math.ceil((Math.log(vectorSize) / Math.log(2)));
        Complex[] toArray = vector.getData();
        ComplexVector[] output = new ComplexVector[size];
        for (int i = 0; i < output.length; i++) {
            output[i] = new ComplexVector(2);
        }

        for (int j = 0; j < size; j++) {
            int i = 0;
            for (Complex complex : toArray) {
                int bitAtIndex = Utils.bitAtIndex(j, i, size);
                Complex newValue = output[j].getEntry(bitAtIndex).add(Math.pow(complex.abs(), 2));
                output[j].setEntry(bitAtIndex, newValue);
                i++;
            }
            output[j].setEntry(0, output[j].getEntry(0).sqrt());
            output[j].setEntry(1, output[j].getEntry(1).sqrt());
        }

        return output;
    }

    /**
     * Exact, element-wise equality using the same primitive {@code ==}
     * semantics as {@link Complex#equals} (so {@code -0.0} equals {@code 0.0}).
     */
    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ComplexVector)) {
            return false;
        }
        ComplexVector o = (ComplexVector) other;
        if (this.data.length != o.data.length) {
            return false;
        }
        for (int i = 0; i < data.length; i++) {
            if (data[i] != o.data[i]) {
                return false;
            }
        }
        return true;
    }

    @Override
    public int hashCode() {
        int result = data.length;
        for (double v : data) {
            // Normalize -0.0 to 0.0 to stay consistent with equals().
            result = 31 * result + Double.hashCode(v == 0.0 ? 0.0 : v);
        }
        return result;
    }

    @Override
    public String toString() {
        return "ComplexVector{" + Arrays.toString(this.getData()) + '}';
    }

    /**
     * Boxes a primitive amplitude, canonicalizing exact zero and one to the
     * shared {@link Complex#ZERO}/{@link Complex#ONE} singletons so that callers
     * relying on reference identity (e.g. {@code getData()[0] == Complex.ONE})
     * observe the same behavior as the pre-migration representation.
     */
    private static Complex box(double re, double im) {
        if (re == 0.0 && im == 0.0) {
            return Complex.ZERO;
        }
        if (re == 1.0 && im == 0.0) {
            return Complex.ONE;
        }
        return new Complex(re, im);
    }
}
