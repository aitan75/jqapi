package org.aitan.jqapi.quantum.simulator;

import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
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
    private final QuantumRegister quantumRegister;

    /** @param circuit the circuit to simulate (register initialised to |0...0>) */
    public LocalSimulator(Circuit circuit) {
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig());
    }

    /** @param circuit the circuit to simulate
     *  @param qubits the initial per-qubit states */
    public LocalSimulator(Circuit circuit, Qubit... qubits) {

        if (circuit.getInputSize() != qubits.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), qubits);
    }

    /** @param circuit the circuit to simulate
     *  @param alphas the initial amplitude coefficients */
    public LocalSimulator(Circuit circuit, double... alphas) {

        if (circuit.getInputSize() != alphas.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), circuit.getConfig(), alphas);
    }

    /** {@inheritDoc} */
    @Override
    public void execute() {
        circuit.getLevels().forEach(level ->
                level.getGates().forEach(gate -> {
                    if (gate.getType().equals(Constants.MEASUREMENT)) {
                        quantumRegister.measureQubitAtIndexes(gate.getIndexes());
                        return; //the measurement gate matrix is the identity: nothing else to apply
                    }
                    if (gate.getType().equals(Constants.IDENTITY)) {
                        return; //no-op
                    }
                    if (gate.getNumberQubits() == 1) {
                        //single-qubit gate, possibly replicated on several qubits
                        gate.getIndexes().forEach(index -> quantumRegister.applyOperator(gate.getMatrix(), Collections.singletonList(index)));
                    } else {
                        quantumRegister.applyOperator(gate.getMatrix(), gate.getIndexes());
                    }
                })
        );
    }

    /** {@inheritDoc} */
    @Override
    public QuantumRegister getQuantumRegister() {
        return this.quantumRegister;
    }

}
