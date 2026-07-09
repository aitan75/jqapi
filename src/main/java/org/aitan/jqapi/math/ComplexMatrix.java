package org.aitan.jqapi.math;

import java.util.List;
import org.aitan.jqapi.quantum.gates.Gate;

/**
 * A dense complex matrix, backed by a flat primitive {@code double[]} in
 * row-major, interleaved {@code (re, im)} layout
 * ({@code data[2*(r*cols+c)]} = real, {@code +1} = imaginary).
 * <p>
 * This is the issue #12 replacement for the previous
 * {@code BlockFieldMatrix<Complex>} subclass: the public method names and
 * behavior are preserved, but there is no longer any commons-math3 dependency.
 *
 * @author Gaetano Ferrara
 */
public class ComplexMatrix {

    private final double[] data;
    private final int rows;
    private final int cols;

    private ComplexMatrix(Complex[][] values) {
        this.rows = values.length;
        this.cols = values[0].length;
        this.data = new double[rows * cols * 2];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int flat = r * cols + c;
                this.data[2 * flat] = values[r][c].getReal();
                this.data[2 * flat + 1] = values[r][c].getImaginary();
            }
        }
    }

    /**
     * @param size the matrix dimension
     * @return the {@code size x size} identity matrix
     */
    public static ComplexMatrix createIdentityMatrix(int size) {
        Complex[][] values = new Complex[size][size];
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                values[r][c] = r == c ? Complex.ONE : Complex.ZERO;
            }
        }
        return new ComplexMatrix(values);
    }

    /**
     * @param data the matrix entries (row-major)
     * @return a matrix wrapping the given entries
     */
    public static ComplexMatrix createMatrixWithData(Complex[][] data) {
        return new ComplexMatrix(data);
    }

    /**
     * @param g the gate
     * @return the gate's unitary matrix
     */
    public static ComplexMatrix createGateMatrix(Gate g) {
        return g.getMatrix();
    }

    /**
     * Computes the Kronecker product of the given matrices, folded left to
     * right.
     *
     * @param matrixList the matrices to combine (must be non-empty)
     * @return the Kronecker product
     */
    public static ComplexMatrix kroneckerProduct(List<ComplexMatrix> matrixList) {
        if (matrixList == null || matrixList.isEmpty()) {
            throw new IllegalArgumentException("No input matrices");
        }
        if (matrixList.size() == 1) {
            return matrixList.get(0); // nothing to do, only one matrix
        }
        Complex[][] accumulator = matrixList.get(0).getData();
        for (int m = 1; m < matrixList.size(); m++) {
            accumulator = kron(accumulator, matrixList.get(m).getData());
        }
        return new ComplexMatrix(accumulator);
    }

    private static Complex[][] kron(Complex[][] a, Complex[][] b) {
        int aRows = a.length;
        int aCols = a[0].length;
        int bRows = b.length;
        int bCols = b[0].length;
        Complex[][] out = new Complex[aRows * bRows][aCols * bCols];
        for (int i = 0; i < aRows; i++) {
            for (int j = 0; j < aCols; j++) {
                Complex aij = a[i][j];
                for (int p = 0; p < bRows; p++) {
                    for (int q = 0; q < bCols; q++) {
                        out[i * bRows + p][j * bCols + q] = aij.multiply(b[p][q]);
                    }
                }
            }
        }
        return out;
    }

    /**
     * @param row the row index
     * @param column the column index
     * @return the complex entry at {@code (row, column)}
     */
    public Complex getEntry(int row, int column) {
        int flat = row * cols + column;
        return box(data[2 * flat], data[2 * flat + 1]);
    }

    /** @return the number of rows */
    public int getRowDimension() {
        return rows;
    }

    /** @return the number of columns */
    public int getColumnDimension() {
        return cols;
    }

    /** @return the matrix entries as a row-major 2D array (boxing boundary) */
    public Complex[][] getData() {
        Complex[][] out = new Complex[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int flat = r * cols + c;
                out[r][c] = box(data[2 * flat], data[2 * flat + 1]);
            }
        }
        return out;
    }

    /**
     * Applies this matrix to a vector: {@code result[r] = Σ_c this[r][c] * v[c]}.
     *
     * @param v the vector to multiply (dimension must equal the column count)
     * @return the resulting vector
     */
    public ComplexVector operate(ComplexVector v) {
        if (v.getDimension() != cols) {
            throw new IllegalArgumentException("Vector dimension " + v.getDimension()
                    + " does not match matrix column dimension " + cols);
        }
        ComplexVector out = new ComplexVector(rows);
        for (int r = 0; r < rows; r++) {
            Complex sum = Complex.ZERO;
            for (int c = 0; c < cols; c++) {
                sum = sum.add(this.getEntry(r, c).multiply(v.getEntry(c)));
            }
            out.setEntry(r, sum);
        }
        return out;
    }

    /**
     * Exact, element-wise equality using the same primitive {@code ==}
     * semantics as {@link Complex#equals}.
     */
    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ComplexMatrix)) {
            return false;
        }
        ComplexMatrix o = (ComplexMatrix) other;
        if (this.rows != o.rows || this.cols != o.cols) {
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
        int result = 31 * rows + cols;
        for (double v : data) {
            // Normalize -0.0 to 0.0 to stay consistent with equals().
            result = 31 * result + Double.hashCode(v == 0.0 ? 0.0 : v);
        }
        return result;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("ComplexMatrix{");
        for (int r = 0; r < rows; r++) {
            if (r > 0) {
                sb.append(", ");
            }
            sb.append('[');
            for (int c = 0; c < cols; c++) {
                if (c > 0) {
                    sb.append(", ");
                }
                sb.append(getEntry(r, c));
            }
            sb.append(']');
        }
        return sb.append('}').toString();
    }

    /**
     * Boxes a primitive amplitude, canonicalizing exact zero and one to the
     * shared {@link Complex#ZERO}/{@link Complex#ONE} singletons.
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
