package org.aitan.jqapi.quantum.simulator;

import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.utils.Constants;
import org.apache.commons.math3.complex.Complex;

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
        this.quantumRegister = new QuantumRegister(circuit.getInputSize());
    }

    /** @param circuit the circuit to simulate
     *  @param qubits the initial per-qubit states */
    public LocalSimulator(Circuit circuit, Qubit... qubits) {

        if (circuit.getInputSize() != qubits.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), qubits);
    }

    /** @param circuit the circuit to simulate
     *  @param alphas the initial amplitude coefficients */
    public LocalSimulator(Circuit circuit, double... alphas) {

        if (circuit.getInputSize() != alphas.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), alphas);
    }

    /** {@inheritDoc} */
    @Override
    public void execute() {
        int numQubits = circuit.getInputSize();
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
                        gate.getIndexes().forEach(index -> applyGate(gate.getMatrix(), Collections.singletonList(index), numQubits));
                    } else {
                        applyGate(gate.getMatrix(), gate.getIndexes(), numQubits);
                    }
                })
        );
    }

    /**
     * Applies a 2^k x 2^k gate matrix to the k target qubits of the register
     * state, in place. For every group of 2^k amplitudes that differ only in
     * the target-qubit bits, the group is multiplied by the gate matrix.
     */
    private void applyGate(ComplexMatrix gateMatrix, List<Integer> targetQubits, int numQubits) {
        int k = targetQubits.size();
        int localDimension = 1 << k;
        if (gateMatrix.getRowDimension() != localDimension) {
            throw new IllegalArgumentException("Gate matrix of dimension " + gateMatrix.getRowDimension()
                    + " cannot be applied to " + k + " qubit(s)");
        }
        ComplexVector state = quantumRegister.getRegisterState();
        int dimension = state.getDimension();

        //offsets[t] = bits to set in the base index to select the local state t.
        //Qubit q lives at integer bit position (numQubits - 1 - q) because qubit 0
        //is the most significant; local bit j of the gate maps to targetQubits[j].
        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (numQubits - 1 - targetQubits.get(j));
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        Complex[] local = new Complex[localDimension];
        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue; //visit each amplitude group once, starting from the index with all target bits at 0
            }
            for (int t = 0; t < localDimension; t++) {
                local[t] = state.getEntry(base | offsets[t]);
            }
            for (int r = 0; r < localDimension; r++) {
                Complex sum = Complex.ZERO;
                for (int c = 0; c < localDimension; c++) {
                    Complex entry = gateMatrix.getEntry(r, c);
                    if (!entry.equals(Complex.ZERO)) {
                        sum = sum.add(entry.multiply(local[c]));
                    }
                }
                state.setEntry(base | offsets[r], sum);
            }
        }
    }

    /** {@inheritDoc} */
    @Override
    public QuantumRegister getQuantumRegister() {
        return this.quantumRegister;
    }

}
