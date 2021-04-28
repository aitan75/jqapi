/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.aitan.jqapi.quantum.gates.*;

/**
 *
 * @author Gaetano Ferrara
 */
public class Circuit {

    private final List<CircuitLevel> levels;
    private int inputSize;

    public Circuit(int inputSize) {
        this.inputSize = inputSize;
        this.levels = new ArrayList<>();

    }

    public int getInputSize() {
        return inputSize;
    }

    public void setInputSize(int inputSize) {
        this.inputSize = inputSize;
    }

    public List<CircuitLevel> getLevels() {
        return levels;
    }

    public void addLevel(CircuitLevel... levels) {
        for (CircuitLevel level : levels) {
            this.levels.add(this.initializeLevels(level));
        }
        
    }

    private CircuitLevel initializeLevels(CircuitLevel level) {
        
        boolean errorGate = level.getGates().stream().anyMatch(g -> g.getIndexes().size() > inputSize || !g.getIndexes().stream().allMatch(index -> index >= 0 && index < inputSize));
        if (errorGate) {
            throw new IllegalArgumentException("Adding gate that affect more qubits than circuit size or qubits out of register indexes");
        }
        
        List<Integer> indexes = IntStream.range(0, inputSize).filter(index->level.getGates().stream().allMatch(gate->!gate.getIndexes().contains(index))).boxed().collect(Collectors.toList());
        indexes.forEach(index -> {
            level.addGate(index,new Identity(index));
        });
        
        return level;
    }

}
