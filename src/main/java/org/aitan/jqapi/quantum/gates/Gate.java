/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum.gates;

import java.util.Arrays;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;

/**
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

    public ComplexMatrix getMatrix() {
        return matrix;
    }

    public List<Integer> getIndexes() {
        return indexes;
    }

    public String getType() {
        return type;
    }

    public int getNumberQubits() {
        return numberQubits;
    }

    public int getSize() {
        return size;
    }
   

    private boolean verify(Integer... idxs) {
        return idxs.length > 1 ? Arrays.asList(idxs).stream().distinct().count() == idxs.length : true;
    }

}
