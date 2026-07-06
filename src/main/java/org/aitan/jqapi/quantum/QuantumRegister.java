package org.aitan.jqapi.quantum;

import java.security.SecureRandom;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.utils.Utils;
import org.apache.commons.math3.complex.Complex;

/**
 * Holds the quantum state of {@code size} qubits as a {@code 2^size} complex
 * amplitude vector. Supports full and partial measurement. By convention qubit
 * 0 is the most significant bit of the state index.
 *
 * @author Gaetano Ferrara
 */
public class QuantumRegister {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final Qubit[] result;
    private final int size;
    private final Qubit[] input;
    private ComplexVector registerState;

    /** Creates a register of the given size initialised to |0...0>.
     *  @param size number of qubits */
    public QuantumRegister(int size) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister();

    }

    /** Creates a register from explicit per-qubit initial states.
     *  @param size number of qubits
     *  @param qubits the initial state of each qubit */
    public QuantumRegister(int size, Qubit[] qubits) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister(qubits);
    }

    /** Creates a register from amplitude coefficients.
     *  @param size number of qubits
     *  @param alphas amplitude coefficients of the state vector */
    public QuantumRegister(int size, double... alphas) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister(alphas);

    }

    /** @return the number of qubits in the register */
    public int getSize() {
        return size;
    }

    /** @return the full complex amplitude vector of the register state */
    public ComplexVector getRegisterState() {
        return new ComplexVector(this.registerState.getData());
    }

    /**
     * Factorizes the register state into single qubits.
     * <p>
     * This is only meaningful for separable (non-entangled) states: for
     * entangled states no such factorization exists and this method throws
     * {@link IllegalStateException}. Note that the factorization is derived
     * from the marginal probabilities of each qubit, so relative phases of
     * the individual qubits are not recovered.
     *
     * @return one qubit per register position
     * @throws IllegalStateException if the register state is entangled
     */
    public Qubit[] getQubitRegisterState() {
        ComplexVector[] factorize = ComplexVector.factorize(this.registerState);
        this.verifySeparable(factorize);
        Qubit[] qubits = new Qubit[size];
        for (int i = 0; i < factorize.length; i++) {
            qubits[i] = factorize[i].getEntry(0).equals(Complex.ONE)?new QubitZero():factorize[i].getEntry(0).equals(Complex.ZERO)?new QubitOne():new QubitSuperposition(factorize[i]);
        }
        return qubits;
    }

    /** @param registerState the new complex amplitude vector
     *  @deprecated Use {@link #applyOperator(ComplexMatrix, List)} instead to apply quantum gates. */
    @Deprecated
    public void setRegisterState(ComplexVector registerState) {
        if (registerState.getDimension() != this.registerState.getDimension()) {
            throw new IllegalArgumentException("ERROR: Overflow register dimension");
        }
        this.registerState = registerState;
    }

    /**
     * Applies a 2^k x 2^k gate matrix (operator) to the k target qubits of the register state, in place.
     * For every group of 2^k amplitudes that differ only in the target-qubit bits, the group is multiplied
     * by the operator matrix.
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits) {
        int k = targetQubits.size();
        int localDimension = 1 << k;
        if (operator.getRowDimension() != localDimension) {
            throw new IllegalArgumentException("Gate matrix of dimension " + operator.getRowDimension()
                    + " cannot be applied to " + k + " qubit(s)");
        }
        int dimension = this.registerState.getDimension();

        //offsets[t] = bits to set in the base index to select the local state t.
        //Qubit q lives at integer bit position (size - 1 - q) because qubit 0
        //is the most significant; local bit j of the gate maps to targetQubits[j].
        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (this.size - 1 - targetQubits.get(j));
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
                local[t] = this.registerState.getEntry(base | offsets[t]);
            }
            for (int r = 0; r < localDimension; r++) {
                Complex sum = Complex.ZERO;
                for (int c = 0; c < localDimension; c++) {
                    Complex entry = operator.getEntry(r, c);
                    if (!entry.equals(Complex.ZERO)) {
                        sum = sum.add(entry.multiply(local[c]));
                    }
                }
                this.registerState.setEntry(base | offsets[r], sum);
            }
        }
    }

    /** Collapses the whole register to a basis state according to the current
     *  measurement probabilities. */
    public void measure() {
        int indexCollapsed = this.calculateCollapsedIndex();
        //Initialize all register state to 0
        for (int i = 0; i < registerState.getDimension(); i++) {
            registerState.setEntry(i, Complex.ZERO);
        }
        //Set indexCollapsed element of register state to 1
        registerState.setEntry(indexCollapsed, Complex.ONE);
        //The collapsed state is a computational basis state: read each qubit directly from its bit
        for (int i = 0; i < size; i++) {
            result[i] = Utils.bitAtIndex(i, indexCollapsed, size) == 0 ? new QubitZero() : new QubitOne();
        }
    }

    /** Measures only the qubits at the given indexes, renormalising the residual
     *  state.
     *  @param indexes the qubit indexes to measure */
    public void measureQubitAtIndexes(List<Integer> indexes) {
        if (indexes.size() < size) {
            indexes.forEach(index -> {
                int collapsedValue = this.calculateCollapsedIndex(index);
                this.result[index] = collapsedValue == 0 ? new QubitZero() : new QubitOne();
                this.updateRegisterStateAfterQubitCollapsed(index, collapsedValue);
            });

        } else {
            this.measure();
        }

    }

    /** @return the input qubits the register was initialised with */
    public Qubit[] getInput() {
        return input;
    }

    /** @return the measured result qubits, available after {@link #measure()} */
    public Qubit[] getResult() {
        return result;
    }

    private void initializeQuantumRegister() {
        ComplexVector registerStateToUpdate = new QubitZero().getValue();
        this.input[0] = new QubitZero();
        for (int i = 1; i < size; i++) {
            registerStateToUpdate = new QubitZero().getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = new QubitZero();
        }
        this.registerState = registerStateToUpdate;
    }

    private void initializeQuantumRegister(Qubit[] qubits) {
        ComplexVector registerStateToUpdate = qubits[0].getValue();
        this.input[0] = qubits[0];
        for (int i = 1; i < size; i++) {
            Qubit qubit = qubits[i];
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = registerStateToUpdate;
    }

    private void initializeQuantumRegister(double... alphas) {
        ComplexVector registerStateToUpdate = new QubitSuperposition(alphas[0]).getValue();
        this.input[0] = new QubitSuperposition(alphas[0]);
        for (int i = 1; i < size; i++) {
            Qubit qubit = new QubitSuperposition(alphas[i]);
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = registerStateToUpdate;
    }

    private int calculateCollapsedIndex() {
        double random = RANDOM.nextDouble();
        int lastIndex = this.registerState.getDimension() - 1;
        int j = -1;
        while (random >= 0 && j < lastIndex) {
            j++;
            random -= Math.pow(this.registerState.getEntry(j).abs(), 2);
        }
        return j;
    }

    private int calculateCollapsedIndex(int qubitIndex) {
        double random = RANDOM.nextDouble();
        double zeroProbability = 0;
        double oneProbability = 0;

        for (int i = 0; i < this.registerState.getDimension(); i++) {
            String toBinary = Utils.toBinary(i, size);
            int bitAtIndex = Integer.parseInt(toBinary.substring(qubitIndex, qubitIndex + 1));
            zeroProbability += bitAtIndex == 0 ? Math.pow(this.registerState.getEntry(i).abs(), 2) : 0;
            oneProbability += bitAtIndex == 1 ? Math.pow(this.registerState.getEntry(i).abs(), 2) : 0;
        }
        return zeroProbability >= random ? 0 : 1;
    }

    private void updateRegisterStateAfterQubitCollapsed(int qubitPos, int collapsedValue) {
        //Probability of the branch we collapsed into: sum of |amplitude|^2 over
        //all basis states whose bit at qubitPos equals the measured value
        double branchProbability = 0;
        for (int i = 0; i < this.registerState.getDimension(); i++) {
            if (Utils.bitAtIndex(qubitPos, i, size) == collapsedValue) {
                branchProbability += Math.pow(this.registerState.getEntry(i).abs(), 2);
            }
        }
        if (branchProbability == 0) {
            throw new IllegalStateException("Qubit " + qubitPos + " collapsed to a zero-probability branch");
        }
        //Zero out the discarded branch and renormalize the surviving amplitudes,
        //dividing by sqrt(p): this preserves the relative phases
        double norm = Math.sqrt(branchProbability);
        for (int i = 0; i < this.registerState.getDimension(); i++) {
            if (Utils.bitAtIndex(qubitPos, i, size) == collapsedValue) {
                this.registerState.setEntry(i, this.registerState.getEntry(i).divide(norm));
            } else {
                this.registerState.setEntry(i, Complex.ZERO);
            }
        }
    }

    /**
     * Verifies that the joint probabilities of the register state match the
     * product of the per-qubit marginal probabilities, i.e. that the state is
     * (probabilistically) separable.
     */
    private void verifySeparable(ComplexVector[] qubitMarginals) {
        for (int i = 0; i < this.registerState.getDimension(); i++) {
            double product = 1;
            for (int q = 0; q < size; q++) {
                int bit = Utils.bitAtIndex(q, i, size);
                product *= Math.pow(qubitMarginals[q].getEntry(bit).abs(), 2);
            }
            double actual = Math.pow(this.registerState.getEntry(i).abs(), 2);
            if (Math.abs(product - actual) > 1e-9) {
                throw new IllegalStateException("Register state is entangled and cannot be factorized into independent qubits: use measure() or read the full register state instead");
            }
        }
    }

}
