package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;

/**
 * Generic multi-controlled gate Cᵐ(U): applies the base unitary {@code u} to its
 * target qubits when all {@code numControls} control qubits are {@code |1>}.
 * Indexes are declared controls-first, then targets; controls are the most
 * significant qubits. {@code new MultiControlled(PAULI_X_MATRIX, 2, c1, c2, t)}
 * reproduces {@link Toffoli}.
 *
 * @author Gaetano Ferrara
 */
public class MultiControlled extends Gate {

    public MultiControlled(ComplexMatrix u, int numControls, Integer... indexes) {
        super(numControls + Integer.numberOfTrailingZeros(u.getRowDimension()),
                ComplexMatrix.multiControlledMatrix(u, numControls),
                Constants.MULTI_CONTROLLED,
                requireIndexCount(u, numControls, indexes));
    }

    private static Integer[] requireIndexCount(ComplexMatrix u, int numControls, Integer[] indexes) {
        int t = Integer.numberOfTrailingZeros(u.getRowDimension());
        int expected = numControls + t;
        if (indexes.length != expected) {
            throw new IllegalArgumentException("MultiControlled expects " + expected
                    + " indexes (" + numControls + " controls + " + t + " targets), got " + indexes.length);
        }
        return indexes;
    }
}
