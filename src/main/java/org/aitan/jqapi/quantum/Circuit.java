package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.aitan.jqapi.quantum.gates.*;

/**
 * A quantum circuit: an ordered sequence of {@link CircuitLevel}s applied to a
 * register of {@code inputSize} qubits. Levels are executed left to right by a
 * {@link org.aitan.jqapi.quantum.simulator.QuantumSimulator}.
 *
 * @author Gaetano Ferrara
 */
public class Circuit {

    private final List<CircuitLevel> levels;
    private int inputSize;

    /** @param inputSize number of qubits the circuit operates on */
    public Circuit(int inputSize) {
        this.inputSize = inputSize;
        this.levels = new ArrayList<>();

    }

    /** @return the number of qubits the circuit operates on */
    public int getInputSize() {
        return inputSize;
    }

    /** @param inputSize the number of qubits the circuit operates on */
    public void setInputSize(int inputSize) {
        this.inputSize = inputSize;
    }

    /** @return the ordered list of levels composing this circuit */
    public List<CircuitLevel> getLevels() {
        return levels;
    }

    /** Appends one or more levels to the end of the circuit.
     *  @param levels the levels to append, in order */
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

        List<Integer> indexes = IntStream.range(0, inputSize).filter(index -> level.getGates().stream().allMatch(gate -> !gate.getIndexes().contains(index))).boxed().collect(Collectors.toList());
        indexes.forEach(index -> level.addGate(index, new Identity(index)));
        return level;
    }

}
