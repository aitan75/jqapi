package org.aitan.jqapi.quantum.simulator;

import java.util.Collections;
import java.util.ArrayList;
import java.util.List;
import java.util.function.DoubleSupplier;
import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitOne;
import org.aitan.jqapi.quantum.gates.ConditionalGate;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.utils.Constants;

/**
 * Local state-vector simulator.
 * <p>
 * Gates are applied directly to the state vector, one gate at a time: for a
 * gate acting on k qubits only the 2^k amplitudes of each affected group are
 * combined, so the full 2^n x 2^n operator of a circuit level is never
 * materialized. This keeps memory usage at O(2^n) and allows gates to act on
 * arbitrary, non adjacent qubits (e.g. a CNOT between qubit 0 and qubit 2).
 * <p>
 * Conventions: qubit 0 is the most significant bit of the state index; within
 * a multi-qubit gate, the first declared qubit is the most significant bit of
 * the gate matrix (e.g. in {@code new ControlledNot(control, target)} the
 * control qubit is the first one).
 *
 * @author Gaetano Ferrara
 */

public class LocalSimulator implements QuantumSimulator {

    private final Circuit circuit;
    private final int[] classicalBits;
    private final QuantumRegister quantumRegister;

    /**
     * Creates a zero-state simulator with execution-owned measurement/reset randomness.
     * @param circuit circuit to simulate
     * @param random source returning finite values in [0, 1)
     */
    public LocalSimulator(Circuit circuit, DoubleSupplier random) {
        circuit.validateClassicalOperations();
        this.circuit = circuit;
        this.classicalBits = new int[circuit.getNumClassicalBits()];
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), random);
    }

    /**
     * Creates a simulator from a copied, normalized complex state vector in MSB order.
     * @param circuit circuit to simulate
     * @param initialState vector of dimension 2^circuit.getInputSize()
     * @param random source returning finite values in [0, 1)
     */
    public LocalSimulator(Circuit circuit, ComplexVector initialState, DoubleSupplier random) {
        circuit.validateClassicalOperations();
        this.circuit = circuit;
        this.classicalBits = new int[circuit.getNumClassicalBits()];
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), initialState, random);
    }

    /** @param circuit the circuit to simulate (register initialised to |0...0>) */
    public LocalSimulator(Circuit circuit) {
        circuit.validateClassicalOperations();
        this.circuit = circuit;
        this.classicalBits = new int[circuit.getNumClassicalBits()];
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig());
    }

    /** @param circuit the circuit to simulate
     *  @param qubits the initial per-qubit states */
    public LocalSimulator(Circuit circuit, Qubit... qubits) {

        if (circuit.getInputSize() != qubits.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        circuit.validateClassicalOperations();
        this.circuit = circuit;
        this.classicalBits = new int[circuit.getNumClassicalBits()];
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), qubits);
    }

    /** @param circuit the circuit to simulate
     *  @param alphas the initial amplitude coefficients */
    public LocalSimulator(Circuit circuit, double... alphas) {

        if (circuit.getInputSize() != alphas.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        circuit.validateClassicalOperations();
        this.circuit = circuit;
        this.classicalBits = new int[circuit.getNumClassicalBits()];
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), alphas);
    }

    /**
     * Observes execution one operation at a time, after the operation has been
     * processed; identity padding is not reported.
     */
    @FunctionalInterface
    public interface OperationListener {
        /**
         * @param level zero-based circuit level
         * @param gateIndex zero-based gate index within the level
         * @param gate the processed gate
         * @param applied false when a conditional gate was skipped
         */
        void onOperation(int level, int gateIndex, Gate gate, boolean applied);
    }

    /** {@inheritDoc} */
    @Override
    public void execute() {
        execute((level, gateIndex, gate, applied) -> { });
    }

    /**
     * Executes the circuit, notifying {@code listener} after every non-identity
     * operation. Random draws are identical to {@link #execute()}.
     * @param listener callback receiving each processed operation
     */
    public void execute(OperationListener listener) {
        circuit.validateClassicalOperations();
        List<CircuitLevel> levels = circuit.getLevels();
        for (int l = 0; l < levels.size(); l++) {
            List<Gate> gates = levels.get(l).getGates();
            for (int g = 0; g < gates.size(); g++) {
                Gate gate = gates.get(g);
                if (gate.getType().equals(Constants.IDENTITY)) continue;
                listener.onOperation(l, g, gate, step(gate));
            }
        }
    }

    /** Applies one gate; returns false when a conditional gate is skipped. */
    private boolean step(Gate gate) {
        if (gate instanceof ConditionalGate conditional
                && classicalBits[conditional.condition().bitIndex()] != conditional.condition().expected()) return false;
        if (gate.getType().equals(Constants.MEASUREMENT)) {
            quantumRegister.measureQubitAtIndexes(gate.getIndexes());
            if (gate instanceof Measurement measurement && measurement.classicalTarget() != null) {
                classicalBits[measurement.classicalTarget()] = quantumRegister.getResult()[gate.getIndexes().getFirst()] instanceof QubitOne ? 1 : 0;
            }
            return true; //the measurement gate matrix is the identity: nothing else to apply
        }
        if (gate.getType().equals(Constants.RESET)) {
            quantumRegister.resetQubitAtIndexes(gate.getIndexes());
            return true; //non-unitary: handled at register level, nothing else to apply
        }
        if (gate.getNumberQubits() == 1) {
            //single-qubit gate, possibly replicated on several qubits
            gate.getIndexes().forEach(index -> quantumRegister.applyOperator(gate.getMatrix(), Collections.singletonList(index)));
        } else {
            quantumRegister.applyOperator(gate.getMatrix(), gate.getIndexes());
        }
        return true;
    }

    /** Immutable snapshot of execution-owned classical bits, in address order. */
    public List<ClassicalRecord> extractClassicalRecords() {
        List<ClassicalRecord> records = new ArrayList<>(classicalBits.length);
        for (int bit : classicalBits) records.add(new ClassicalRecord(bit));
        return List.copyOf(records);
    }

    /** {@inheritDoc} */
    @Override
    public QuantumRegister getQuantumRegister() {
        return this.quantumRegister;
    }

}
