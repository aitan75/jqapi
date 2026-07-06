package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
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
    private final JQAPIConfig config;
    private int inputSize;

    /** Creates a circuit using the default configuration.
     *  @param inputSize number of qubits the circuit operates on */
    public Circuit(int inputSize) {
        this(inputSize, JQAPIConfig.getDefault());
    }

    /** Creates a circuit constrained by the given configuration.
     *  @param inputSize number of qubits the circuit operates on
     *  @param config the configuration bounding the circuit size */
    public Circuit(int inputSize, JQAPIConfig config) {
        this.config = config;
        this.validateInputSize(inputSize);
        this.inputSize = inputSize;
        this.levels = new ArrayList<>();
    }

    /** @return the number of qubits the circuit operates on */
    public int getInputSize() {
        return inputSize;
    }

    /** @return the configuration bounding this circuit */
    public JQAPIConfig getConfig() {
        return config;
    }

    /** @param inputSize the number of qubits the circuit operates on */
    public void setInputSize(int inputSize) {
        this.validateInputSize(inputSize);
        this.inputSize = inputSize;
    }

    private void validateInputSize(int inputSize) {
        if (inputSize <= 0) {
            throw new JQApiLimitException("Circuit size must be positive, was: " + inputSize);
        }
        if (inputSize > this.config.maxQubits()) {
            throw new JQApiLimitException("Circuit size " + inputSize + " exceeds maximum allowed qubits (" + this.config.maxQubits() + ")");
        }
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
