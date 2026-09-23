package org.aitan.jqapi.quantum;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.function.DoubleSupplier;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.utils.Constants;

/**
 * Holds the quantum state of {@code size} qubits as a {@code 2^size} complex
 * amplitude vector. Supports full and partial measurement. By convention qubit
 * 0 is the most significant bit of the state index.
 *
 * @author Gaetano Ferrara
 */
public class QuantumRegister {

    /**
     * Shared source of measurement randomness. {@link SecureRandom} is
     * thread-safe and cryptographically strong, so one instance is reused rather
     * than allocated per register. The security audit (issue #103, finding M-2)
     * kept this implementation: {@code SecureRandomContentionBenchmark} shows a
     * measurement draws once per {@code O(2^n)} state-vector scan, so the shared
     * instance is not a throughput bottleneck. Do not replace it with a
     * non-cryptographic RNG.
     */
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Qubit[] result;
    private final int size;
    private final Qubit[] input;
    private final JQAPIConfig config;
    private final DoubleSupplier random;
    private double[] registerState;

    /** Creates a register of the given size initialised to |0...0>, using the
     *  default configuration.
     *  @param size number of qubits */
    public QuantumRegister(int size) {
        this(size, JQAPIConfig.getDefault());
    }

    /** Creates a register from explicit per-qubit initial states, using the
     *  default configuration.
     *  @param size number of qubits
     *  @param qubits the initial state of each qubit */
    public QuantumRegister(int size, Qubit[] qubits) {
        this(size, JQAPIConfig.getDefault(), qubits);
    }

    /** Creates a register from amplitude coefficients, using the default
     *  configuration.
     *  @param size number of qubits
     *  @param alphas amplitude coefficients of the state vector */
    public QuantumRegister(int size, double... alphas) {
        this(size, JQAPIConfig.getDefault(), alphas);
    }

    /** Creates a register of the given size initialised to |0...0>, bounded by
     *  the supplied configuration.
     *  @param size number of qubits
     *  @param config the configuration bounding the register size */
    public QuantumRegister(int size, JQAPIConfig config) {
        this(size, config, RANDOM::nextDouble);
    }

    /** Creates a register from explicit per-qubit initial states, bounded by
     *  the supplied configuration.
     *  @param size number of qubits
     *  @param config the configuration bounding the register size
     *  @param qubits the initial state of each qubit */
    public QuantumRegister(int size, JQAPIConfig config, Qubit[] qubits) {
        this.random = RANDOM::nextDouble;
        validateSize(size, config.maxQubits());
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.config = config;
        this.initializeQuantumRegister(qubits);
    }

    /** Creates a register from amplitude coefficients, bounded by the supplied
     *  configuration.
     *  @param size number of qubits
     *  @param config the configuration bounding the register size
     *  @param alphas amplitude coefficients of the state vector */
    public QuantumRegister(int size, JQAPIConfig config, double... alphas) {
        this.random = RANDOM::nextDouble;
        validateSize(size, config.maxQubits());
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.config = config;
        this.initializeQuantumRegister(alphas);
    }

    /**
     * Creates a register of the given size initialised to |0...0>, bounded by
     * the supplied configuration.
     *
     * @param size number of qubits
     * @param config the configuration bounding the register size
     * @return a new register initialised to |0...0>
     * @deprecated use {@link #QuantumRegister(int, JQAPIConfig)} instead;
     *             config injection is now uniform across the constructors.
     */
    @Deprecated
    public static QuantumRegister forSimulation(int size, JQAPIConfig config) {
        return new QuantumRegister(size, config);
    }

    /**
     * Creates a register from explicit per-qubit initial states, bounded by the
     * supplied configuration.
     *
     * @param size number of qubits
     * @param config the configuration bounding the register size
     * @param qubits the initial state of each qubit
     * @return a new register initialised from the given qubits
     * @deprecated use {@link #QuantumRegister(int, JQAPIConfig, Qubit[])} instead;
     *             config injection is now uniform across the constructors.
     */
    @Deprecated
    public static QuantumRegister forSimulation(int size, JQAPIConfig config, Qubit[] qubits) {
        return new QuantumRegister(size, config, qubits);
    }

    /**
     * Creates a register from amplitude coefficients, bounded by the supplied
     * configuration.
     *
     * @param size number of qubits
     * @param config the configuration bounding the register size
     * @param alphas amplitude coefficients of the state vector
     * @return a new register initialised from the given amplitudes
     * @deprecated use {@link #QuantumRegister(int, JQAPIConfig, double...)} instead;
     *             config injection is now uniform across the constructors.
     */
    @Deprecated
    public static QuantumRegister forSimulation(int size, JQAPIConfig config, double... alphas) {
        return new QuantumRegister(size, config, alphas);
    }

    /**
     * Creates a zero register with an execution-owned random source. The source
     * must return finite values in [0, 1); seeded sources are for simulation only.
     * @param size number of qubits
     * @param config register resource limits
     * @param random measurement randomness, also used by reset
     */
    public QuantumRegister(int size, JQAPIConfig config, DoubleSupplier random) {
        validateSize(size, config.maxQubits());
        this.random = Objects.requireNonNull(random, "random");
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.config = config;
        this.initializeQuantumRegister();
    }

    /**
     * Creates a register from a copied, normalized complex state vector, in MSB
     * order, with an execution-owned random source.
     * @param size number of qubits
     * @param config register resource limits
     * @param initialState normalized vector of dimension 2^size
     * @param random measurement randomness, also used by reset
     */
    public QuantumRegister(int size, JQAPIConfig config, ComplexVector initialState, DoubleSupplier random) {
        validateSize(size, config.maxQubits());
        Objects.requireNonNull(initialState, "initialState");
        this.random = Objects.requireNonNull(random, "random");
        if (initialState.getDimension() != (1 << size)) {
            throw new IllegalArgumentException("Initial state dimension must equal 2^size");
        }
        double norm = 0;
        for (int i = 0; i < initialState.getDimension(); i++) {
            Complex amplitude = Objects.requireNonNull(initialState.getEntry(i), "amplitude");
            norm += amplitude.getReal() * amplitude.getReal() + amplitude.getImaginary() * amplitude.getImaginary();
        }
        if (!Double.isFinite(norm) || Math.abs(norm - 1.0) > 1e-9) {
            throw new IllegalArgumentException("Initial state must be finite and normalized");
        }
        this.size = size;
        this.config = config;
        this.result = new Qubit[size];
        this.input = null;
        this.registerState = toInterleaved(initialState);
    }

    private double nextRandom() {
        double value = random.getAsDouble();
        if (!Double.isFinite(value) || value < 0 || value >= 1) {
            throw new IllegalArgumentException("Random source must return a finite value in [0, 1)");
        }
        return value;
    }

    private static void validateSize(int size, int maxQubits) {
        if (size <= 0) {
            throw new JQApiLimitException("Register size must be positive, was: " + size);
        }
        if (size > maxQubits) {
            throw new JQApiLimitException("Register size " + size + " exceeds maximum allowed qubits (" + maxQubits + ")");
        }
    }

    /** @return the number of qubits in the register */
    public int getSize() {
        return size;
    }

    /** @return the full complex amplitude vector of the register state */
    public ComplexVector getRegisterState() {
        return this.toComplexVector();
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
        ComplexVector[] factorize = ComplexVector.factorize(this.toComplexVector());
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
        if (registerState.getDimension() != this.registerState.length / 2) {
            throw new IllegalArgumentException("ERROR: Overflow register dimension");
        }
        this.registerState = toInterleaved(registerState);
    }

    /**
     * Applies a 2^k x 2^k gate matrix (operator) to the k target qubits of the register state, in place.
     * For every group of 2^k amplitudes that differ only in the target-qubit bits, the group is multiplied
     * by the operator matrix. Parallelizes the (independent) groups across cores when the state is large
     * (dimension &ge; {@code PARALLEL_MIN_DIMENSION}).
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits) {
        boolean parallel = config.parallelEnabled()
                && (this.registerState.length / 2) >= config.parallelThreshold();
        applyOperator(operator, targetQubits, parallel);
    }

    /**
     * As {@link #applyOperator(ComplexMatrix, List)} but with explicit control over
     * multi-threading. Results are bit-for-bit identical regardless of {@code parallel}:
     * the amplitude groups are independent and there is no cross-group reduction.
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     * @param parallel whether to spread the independent amplitude groups across cores
     * @throws JQApiLimitException if a target index is outside the register
     * @throws IllegalArgumentException if targets repeat, exceed the register size,
     *         or the matrix is not square with dimension 2^k
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits, boolean parallel) {
        Objects.requireNonNull(operator, "operator");
        Objects.requireNonNull(targetQubits, "targetQubits");
        int k = targetQubits.size();
        if (k > size) {
            throw new IllegalArgumentException("Gate has more targets than register qubits");
        }
        int targetMask = 0;
        for (Integer target : targetQubits) {
            Objects.requireNonNull(target, "target qubit");
            if (target < 0 || target >= size) {
                throw new JQApiLimitException("Target qubit index out of range [0," + size + "): " + target);
            }
            int bit = 1 << (size - 1 - target);
            if ((targetMask & bit) != 0) {
                throw new IllegalArgumentException("Duplicate target qubit: " + target);
            }
            targetMask |= bit;
        }
        int localDimension = 1 << k;
        if (operator.getRowDimension() != localDimension || operator.getColumnDimension() != localDimension) {
            throw new IllegalArgumentException("Gate matrix of dimension " + operator.getRowDimension()
                    + "x" + operator.getColumnDimension()
                    + " cannot be applied to " + k + " qubit(s)");
        }
        int dimension = this.registerState.length / 2;

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

        //Flatten the operator once per call: the zero-check happens on the boxed
        //entry (same check as before the migration); the per-amplitude loops
        //below then run entirely on primitives, with no Complex allocation.
        double[] opRe = new double[localDimension * localDimension];
        double[] opIm = new double[localDimension * localDimension];
        boolean[] opNonZero = new boolean[localDimension * localDimension];
        for (int r = 0; r < localDimension; r++) {
            for (int c = 0; c < localDimension; c++) {
                Complex entry = operator.getEntry(r, c);
                int flat = r * localDimension + c;
                opNonZero[flat] = !entry.equals(Complex.ZERO);
                opRe[flat] = entry.getReal();
                opIm[flat] = entry.getImaginary();
            }
        }

        if (parallel) {
            final int fLocalDimension = localDimension;
            final int[] fOffsets = offsets;
            final double[] fOpRe = opRe;
            final double[] fOpIm = opIm;
            final boolean[] fOpNonZero = opNonZero;
            // Delegate to the config's executor: keeps ForkJoinPool / parallel
            // streams out of this class so the TeaVM build (issue #5 phase 2b)
            // can dead-code-eliminate the parallel path.
            config.operatorExecutor().applyGroups(dimension, targetMask, base ->
                    applyOperatorGroup(base, fLocalDimension, fOffsets, fOpRe, fOpIm, fOpNonZero));
        } else {
            for (int base = 0; base < dimension; base++) {
                if ((base & targetMask) == 0) {
                    applyOperatorGroup(base, localDimension, offsets, opRe, opIm, opNonZero);
                }
            }
        }
    }

    /**
     * Negates the amplitudes at the marked basis-state indexes in place.
     * This is Grover's diagonal phase oracle and requires no operator matrix.
     *
     * @param markedIndexes one marker per basis state
     * @throws IllegalArgumentException if the marker count differs from the state dimension
     */
    public void applyPhaseOracle(boolean[] markedIndexes) {
        Objects.requireNonNull(markedIndexes, "markedIndexes");
        int dimension = this.registerState.length / 2;
        if (markedIndexes.length != dimension) {
            throw new IllegalArgumentException("Phase oracle marker count " + markedIndexes.length
                    + " does not match register dimension " + dimension);
        }
        for (int i = 0; i < dimension; i++) {
            if (markedIndexes[i]) {
                this.registerState[2 * i] = -this.registerState[2 * i];
                this.registerState[2 * i + 1] = -this.registerState[2 * i + 1];
            }
        }
    }

    /**
     * Applies Grover's inversion-about-the-mean diffusion operator in place.
     * This is equivalent to {@code 2|s><s| - I} without materializing its dense matrix.
     */
    public void applyGroverDiffusion() {
        int dimension = this.registerState.length / 2;
        double meanRe = 0.0;
        double meanIm = 0.0;
        for (int i = 0; i < dimension; i++) {
            meanRe += this.registerState[2 * i];
            meanIm += this.registerState[2 * i + 1];
        }
        meanRe /= dimension;
        meanIm /= dimension;
        for (int i = 0; i < dimension; i++) {
            this.registerState[2 * i] = 2 * meanRe - this.registerState[2 * i];
            this.registerState[2 * i + 1] = 2 * meanIm - this.registerState[2 * i + 1];
        }
    }

    /**
     * Applies the operator to the single amplitude group whose leader index is
     * {@code base} (all target bits zero). Allocates its own scratch buffers, so
     * it is safe to call concurrently for disjoint {@code base} values.
     */
    private void applyOperatorGroup(int base, int localDimension, int[] offsets,
            double[] opRe, double[] opIm, boolean[] opNonZero) {
        double[] localRe = new double[localDimension];
        double[] localIm = new double[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int amplitudeIndex = base | offsets[t];
            localRe[t] = this.registerState[2 * amplitudeIndex];
            localIm[t] = this.registerState[2 * amplitudeIndex + 1];
        }
        for (int r = 0; r < localDimension; r++) {
            double sumRe = 0.0;
            double sumIm = 0.0;
            for (int c = 0; c < localDimension; c++) {
                int flat = r * localDimension + c;
                if (opNonZero[flat]) {
                    sumRe += opRe[flat] * localRe[c] - opIm[flat] * localIm[c];
                    sumIm += opRe[flat] * localIm[c] + opIm[flat] * localRe[c];
                }
            }
            int amplitudeIndex = base | offsets[r];
            this.registerState[2 * amplitudeIndex] = sumRe;
            this.registerState[2 * amplitudeIndex + 1] = sumIm;
        }
    }

    /** Collapses the whole register to a basis state according to the current
     *  measurement probabilities. */
    public void measure() {
        int indexCollapsed = this.calculateCollapsedIndex();
        //Initialize all register state to 0
        Arrays.fill(this.registerState, 0.0);
        //Set indexCollapsed element of register state to 1
        this.registerState[2 * indexCollapsed] = 1.0;
        //The collapsed state is a computational basis state: read each qubit directly from its bit
        //(qubit 0 is the most significant bit of the index).
        for (int i = 0; i < size; i++) {
            int bit = (indexCollapsed >> (size - 1 - i)) & 1;
            result[i] = bit == 0 ? new QubitZero() : new QubitOne();
        }
    }

    /** Measures only the qubits at the given indexes, renormalising the residual
     *  state.
     *  @param indexes the qubit indexes to measure */
    public void measureQubitAtIndexes(List<Integer> indexes) {
        Objects.requireNonNull(indexes);
        indexes.forEach(index -> {
            if (index == null || index < 0 || index >= size) {
                throw new JQApiLimitException("Measurement index " + index + " out of range [0, " + size + ")");
            }
        });
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

    /**
     * Forces the given qubit to {@code |0>}, regardless of its current state, by
     * collapsing it in the Z basis and applying X if the outcome was 1. Unlike
     * {@link #measureQubitAtIndexes(List)} this does not record a measurement
     * result: it is a reset, not a read-out.
     *
     * @param qubitIndex the qubit to reset
     */
    public void reset(int qubitIndex) {
        if (qubitIndex < 0 || qubitIndex >= size) {
            throw new JQApiLimitException("Reset index " + qubitIndex + " out of range [0, " + size + ")");
        }
        int collapsedValue = this.calculateCollapsedIndex(qubitIndex);
        this.updateRegisterStateAfterQubitCollapsed(qubitIndex, collapsedValue);
        if (collapsedValue == 1) {
            this.applyOperator(Constants.PAULI_X_MATRIX, List.of(qubitIndex));
        }
    }

    /**
     * Resets each listed qubit to {@code |0>}.
     *
     * @param indexes the qubits to reset
     */
    public void resetQubitAtIndexes(List<Integer> indexes) {
        Objects.requireNonNull(indexes);
        indexes.forEach(index -> {
            if (index == null || index < 0 || index >= size) {
                throw new JQApiLimitException("Reset index " + index + " out of range [0, " + size + ")");
            }
        });
        indexes.forEach(this::reset);
    }

    /** @return the input qubits the register was initialised with
     * @throws IllegalStateException when initialized from a full state vector,
     * which need not have a per-qubit factorization */
    public Qubit[] getInput() {
        if (input == null) {
            throw new IllegalStateException("A full initial state vector has no stored per-qubit inputs");
        }
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
        this.registerState = toInterleaved(registerStateToUpdate);
    }

    private void initializeQuantumRegister(Qubit[] qubits) {
        ComplexVector registerStateToUpdate = qubits[0].getValue();
        this.input[0] = qubits[0];
        for (int i = 1; i < size; i++) {
            Qubit qubit = qubits[i];
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = toInterleaved(registerStateToUpdate);
    }

    private void initializeQuantumRegister(double... alphas) {
        ComplexVector registerStateToUpdate = new QubitSuperposition(alphas[0]).getValue();
        this.input[0] = new QubitSuperposition(alphas[0]);
        for (int i = 1; i < size; i++) {
            Qubit qubit = new QubitSuperposition(alphas[i]);
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = toInterleaved(registerStateToUpdate);
    }

    private int calculateCollapsedIndex() {
        double random = nextRandom();
        int lastIndex = this.registerState.length / 2 - 1;
        int j = -1;
        while (random >= 0 && j < lastIndex) {
            j++;
            double re = this.registerState[2 * j];
            double im = this.registerState[2 * j + 1];
            random -= re * re + im * im;
        }
        return j;
    }

    private int calculateCollapsedIndex(int qubitIndex) {
        double random = nextRandom();
        double zeroProbability = 0;

        int dimension = this.registerState.length / 2;
        int shift = size - 1 - qubitIndex; // qubit 0 is the most significant bit
        for (int i = 0; i < dimension; i++) {
            int bitAtIndex = (i >> shift) & 1;
            double re = this.registerState[2 * i];
            double im = this.registerState[2 * i + 1];
            double probability = re * re + im * im;
            zeroProbability += bitAtIndex == 0 ? probability : 0;
        }
        return random < zeroProbability ? 0 : 1;
    }

    private void updateRegisterStateAfterQubitCollapsed(int qubitPos, int collapsedValue) {
        //Probability of the branch we collapsed into: sum of |amplitude|^2 over
        //all basis states whose bit at qubitPos equals the measured value
        int dimension = this.registerState.length / 2;
        int shift = size - 1 - qubitPos; // qubit 0 is the most significant bit
        double branchProbability = 0;
        for (int i = 0; i < dimension; i++) {
            if (((i >> shift) & 1) == collapsedValue) {
                double re = this.registerState[2 * i];
                double im = this.registerState[2 * i + 1];
                branchProbability += re * re + im * im;
            }
        }
        if (branchProbability == 0) {
            throw new IllegalStateException("Qubit " + qubitPos + " collapsed to a zero-probability branch");
        }
        //Zero out the discarded branch and renormalize the surviving amplitudes,
        //dividing by sqrt(p): this preserves the relative phases
        double norm = Math.sqrt(branchProbability);
        for (int i = 0; i < dimension; i++) {
            if (((i >> shift) & 1) == collapsedValue) {
                this.registerState[2 * i] /= norm;
                this.registerState[2 * i + 1] /= norm;
            } else {
                this.registerState[2 * i] = 0.0;
                this.registerState[2 * i + 1] = 0.0;
            }
        }
    }

    /**
     * Verifies that the joint probabilities of the register state match the
     * product of the per-qubit marginal probabilities, i.e. that the state is
     * (probabilistically) separable.
     */
    private void verifySeparable(ComplexVector[] qubitMarginals) {
        int dimension = this.registerState.length / 2;
        //Precompute the marginal probability of |0>/|1> for each qubit once, so the
        //O(2^n) loop below reads doubles instead of boxing a Complex per amplitude.
        double[][] marginalProbability = new double[size][2];
        for (int q = 0; q < size; q++) {
            marginalProbability[q][0] = Math.pow(qubitMarginals[q].getEntry(0).abs(), 2);
            marginalProbability[q][1] = Math.pow(qubitMarginals[q].getEntry(1).abs(), 2);
        }
        for (int i = 0; i < dimension; i++) {
            double product = 1;
            for (int q = 0; q < size; q++) {
                int bit = (i >> (size - 1 - q)) & 1;
                product *= marginalProbability[q][bit];
            }
            double re = this.registerState[2 * i];
            double im = this.registerState[2 * i + 1];
            double actual = re * re + im * im;
            if (Math.abs(product - actual) > 1e-9) {
                throw new IllegalStateException("Register state is entangled and cannot be factorized into independent qubits: use measure() or read the full register state instead");
            }
        }
    }

    /** Flattens a complex vector into the interleaved (re, im) primitive layout. */
    private static double[] toInterleaved(ComplexVector vector) {
        Complex[] data = vector.getData();
        double[] interleaved = new double[data.length * 2];
        for (int i = 0; i < data.length; i++) {
            interleaved[2 * i] = data[i].getReal();
            interleaved[2 * i + 1] = data[i].getImaginary();
        }
        return interleaved;
    }

    /** Builds a fresh complex-vector view of the interleaved primitive state.
     *  Exact 0.0 and 1.0+0.0i amplitudes are canonicalized to the shared
     *  {@link Complex#ZERO}/{@link Complex#ONE} instances: the pre-migration
     *  {@code ComplexVector}-backed representation stored those very
     *  singletons whenever an amplitude was set to exactly zero or one (e.g.
     *  via {@link #measure()}), so callers comparing by reference identity
     *  observe the same behavior after the primitive-array migration. */
    private ComplexVector toComplexVector() {
        int dimension = this.registerState.length / 2;
        Complex[] data = new Complex[dimension];
        for (int i = 0; i < dimension; i++) {
            double re = this.registerState[2 * i];
            double im = this.registerState[2 * i + 1];
            if (re == 0.0 && im == 0.0) {
                data[i] = Complex.ZERO;
            } else if (re == 1.0 && im == 0.0) {
                data[i] = Complex.ONE;
            } else {
                data[i] = new Complex(re, im);
            }
        }
        return new ComplexVector(data);
    }

}
