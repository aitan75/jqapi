package org.aitan.jqapi.quantum.simulator;

import java.util.Objects;
import java.util.function.DoubleSupplier;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitOne;
import org.aitan.jqapi.quantum.gates.Gate;

/** Reusable, stateless sampler of final computational-basis outcomes. */
public final class CircuitSampler {
    private CircuitSampler() { }

    /**
     * Starts every shot at |0...0>. Do not mutate the circuit during sampling.
     * @param circuit circuit to execute
     * @param options shots, output indexes, random source and work limit
     * @return final basis counts (not intermediate measurement records)
     */
    public static SamplingResult sample(Circuit circuit, SamplingOptions options) {
        return execute(circuit, options, null);
    }

    /**
     * Starts every shot from a fresh copy of the specified complex state vector.
     * Do not mutate inputs during sampling. Each shot executes all gates, including
     * measurement/reset, then measures the final register. No trajectory is reused.
     * @param circuit circuit to execute
     * @param options execution options
     * @param initialState finite normalized vector, dimension 2^qubits, qubit 0 = MSB
     * @return final basis counts
     */
    public static SamplingResult sample(Circuit circuit, SamplingOptions options, ComplexVector initialState) {
        return execute(circuit, options, Objects.requireNonNull(initialState, "initialState"));
    }

    private static SamplingResult execute(Circuit circuit, SamplingOptions options, ComplexVector initialState) {
        Objects.requireNonNull(circuit, "circuit");
        Objects.requireNonNull(options, "options");
        int size = circuit.getInputSize();
        int[] indexes = options.indexesFor(size);
        long work = (long) options.shots() * (1L << size);
        long passes = 1;
        for (CircuitLevel level : circuit.getLevels()) {
            for (Gate gate : level.getGates()) {
                passes += gate.getIndexes().size();
            }
        }
        if (work > options.maxWork() / passes) {
            throw new JQApiLimitException("Sampling exceeds the amplitude-visit work budget");
        }
        DoubleSupplier random = options.newRandom();
        int[] counts = new int[1 << indexes.length];
        QubitOne one = new QubitOne();
        for (int shot = 0; shot < options.shots(); shot++) {
            LocalSimulator simulator = initialState == null
                    ? new LocalSimulator(circuit, random)
                    : new LocalSimulator(circuit, initialState, random);
            simulator.execute();
            simulator.getQuantumRegister().measure();
            Qubit[] measured = simulator.getQuantumRegister().getResult();
            int outcome = 0;
            for (int index : indexes) {
                outcome = (outcome << 1) | (measured[index].equals(one) ? 1 : 0);
            }
            counts[outcome]++;
        }
        return new SamplingResult(options.shots(), indexes, counts);
    }
}
