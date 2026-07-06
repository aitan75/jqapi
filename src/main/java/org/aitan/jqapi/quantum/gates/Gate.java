package org.aitan.jqapi.quantum.gates;

import java.util.Arrays;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;

/**
 * Base class for quantum gates. A gate exposes its unitary {@link ComplexMatrix}
 * and the qubit indexes it acts on. In multi-qubit gates the first declared
 * index is the most significant qubit.
 *
 * @author Gaetano Ferrara
 */
public abstract class Gate {

    private final ComplexMatrix matrix;
    private final int numberQubits;
    protected final List<Integer> indexes;
    private final int size;
    private final String type;

    protected Gate(int numberQubits, ComplexMatrix matrix, String type, Integer... idxs) {
        if (!verify(idxs)) {
            throw new IllegalArgumentException("Creating gate that affects 2 or more qubits with the same index"); 
        }
        this.numberQubits = numberQubits;
        this.matrix = matrix;
        this.indexes = Arrays.asList(idxs);
        this.type = type;
        this.size = (int) (Math.pow(2, numberQubits));
    }

    /** @return the unitary matrix representing this gate */
    public ComplexMatrix getMatrix() {
        return matrix;
    }

    /** @return the qubit indexes this gate acts on */
    public List<Integer> getIndexes() {
        return indexes;
    }

    /** @return a human-readable gate type name */
    public String getType() {
        return type;
    }

    /** @return the number of qubits this gate acts on */
    public int getNumberQubits() {
        return numberQubits;
    }

    /** @return the dimension of the gate matrix */
    public int getSize() {
        return size;
    }
   

    private boolean verify(Integer... idxs) {
        return idxs.length > 1 ? Arrays.asList(idxs).stream().distinct().count() == idxs.length : true;
    }

}
