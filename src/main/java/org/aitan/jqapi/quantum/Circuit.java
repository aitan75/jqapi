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
    private final int numClassicalBits;

    /** Creates a circuit using the default configuration.
     *  @param inputSize number of qubits the circuit operates on */
    public Circuit(int inputSize) {
        this(inputSize, JQAPIConfig.getDefault());
    }

    /** Creates a circuit constrained by the given configuration.
     *  @param inputSize number of qubits the circuit operates on
     *  @param config the configuration bounding the circuit size */
    public Circuit(int inputSize, JQAPIConfig config) {
        this(inputSize, 0, config);
    }

    /** Creates a circuit with a zero-initialized classical register. */
    public Circuit(int inputSize, int numClassicalBits) {
        this(inputSize, numClassicalBits, JQAPIConfig.getDefault());
    }

    public Circuit(int inputSize, int numClassicalBits, JQAPIConfig config) {
        this.config = java.util.Objects.requireNonNull(config, "config");
        if (numClassicalBits < 0 || numClassicalBits > config.maxQubits()) {
            throw new JQApiLimitException("Classical register exceeds configured qubit budget");
        }
        this.numClassicalBits = numClassicalBits;
        this.validateInputSize(inputSize);
        this.inputSize = inputSize;
        this.levels = new ArrayList<>();
    }

    public int getNumClassicalBits() { return numClassicalBits; }

    /** Checks classical references and same-level dependencies, including after mutable edits. */
    public void validateClassicalOperations() {
        for (CircuitLevel level : levels) validateClassicalLevel(level);
    }

    private void validateClassicalLevel(CircuitLevel level) {
        boolean[] writes = new boolean[numClassicalBits];
        boolean[] reads = new boolean[numClassicalBits];
        for (Gate gate : level.getGates()) {
            if (gate instanceof Measurement measurement && measurement.classicalTarget() != null) {
                int bit = measurement.classicalTarget();
                validateClassicalIndex(bit);
                if (measurement.getIndexes().size() != 1) throw new IllegalArgumentException("Stored measurement needs one qubit");
                if (writes[bit]) throw new IllegalArgumentException("Repeated classical write within one level");
                writes[bit] = true;
            }
            if (gate instanceof ConditionalGate conditional) {
                int bit = conditional.condition().bitIndex();
                validateClassicalIndex(bit);
                reads[bit] = true;
            }
        }
        for (int bit = 0; bit < numClassicalBits; bit++) {
            if (reads[bit] && writes[bit]) throw new IllegalArgumentException("Same-level classical read/write dependency");
        }
    }

    private void validateClassicalIndex(int bit) {
        if (bit < 0 || bit >= numClassicalBits) throw new IllegalArgumentException("Classical bit is outside register");
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
        validateClassicalLevel(level);

        boolean errorGate = level.getGates().stream().anyMatch(g -> g.getIndexes().size() > inputSize || !g.getIndexes().stream().allMatch(index -> index >= 0 && index < inputSize));
        if (errorGate) {
            throw new IllegalArgumentException("Adding gate that affect more qubits than circuit size or qubits out of register indexes");
        }

        List<Integer> indexes = IntStream.range(0, inputSize).filter(index -> level.getGates().stream().allMatch(gate -> !gate.getIndexes().contains(index))).boxed().collect(Collectors.toList());
        indexes.forEach(index -> level.addGate(index, new Identity(index)));
        return level;
    }

}
