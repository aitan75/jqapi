package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.gates.ConditionalGate;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.utils.Constants;

/**
 * An immutable, reusable unitary acting on {@code qubitCount} local qubits,
 * stored as an ordered sequence of small gate steps instead of a full-system
 * matrix. Local qubit 0 is the most significant bit, as everywhere in jqapi.
 * <p>
 * Operations compose ({@link #then}), invert ({@link #adjoint}), repeat
 * ({@link #power}), gain a control qubit ({@link #controlled}) and are remapped
 * onto arbitrary, non-adjacent register qubits ({@link #on},
 * {@link #appendTo}). Each step is dense only over its own support, which is
 * capped at {@link #MAX_DENSE_QUBITS}; the step count, which grows with
 * repetition, is capped by an explicit budget checked before any work.
 */
public final class UnitaryOperation {

    /** Largest support (controls + targets) of a single dense step. */
    public static final int MAX_DENSE_QUBITS = 8;
    /** Default step budget for {@link #power(int)} and {@link #controlledPower(int)}. */
    public static final long DEFAULT_MAX_STEPS = 1L << 20;

    private static final double UNITARY_TOLERANCE = 1e-9;

    /** Base unitary {@code u} controlled by the first {@code controls} local qubits of {@code qubits}. */
    private record Step(ComplexMatrix u, int controls, int[] qubits) {
    }

    private final int qubitCount;
    private final List<Step> steps;

    private UnitaryOperation(int qubitCount, List<Step> steps) {
        this.qubitCount = qubitCount;
        this.steps = Collections.unmodifiableList(steps);
    }

    /**
     * Builds an operation from unitary gates addressed with local indexes.
     * Identity gates are dropped; a single-qubit gate listing several indexes
     * is applied to each of them, as the simulator does.
     *
     * @param qubitCount local width, in {@code [1, ABSOLUTE_MAX_QUBITS]}
     * @param gates unitary gates in application order
     * @return the operation
     * @throws IllegalArgumentException for measurement, reset, conditional or
     *         non-unitary gates, or indexes outside {@code [0, qubitCount)}
     * @throws JQApiLimitException if the width or a gate's support exceeds the
     *         limits, or the gates expand to more than {@link #DEFAULT_MAX_STEPS} steps
     */
    public static UnitaryOperation of(int qubitCount, Gate... gates) {
        validateWidth(qubitCount);
        Objects.requireNonNull(gates, "gates");
        long stepCount = 0;
        for (Gate gate : gates) {
            Objects.requireNonNull(gate, "gate");
            if (!Constants.IDENTITY.equals(gate.getType())) {
                stepCount += gate.getMatrix().getRowDimension() == 2 ? gate.getIndexes().size() : 1;
            }
        }
        List<Step> steps = new ArrayList<>(requireStepBudget(stepCount, DEFAULT_MAX_STEPS));
        for (Gate gate : gates) {
            addGate(steps, qubitCount, gate);
        }
        return new UnitaryOperation(qubitCount, steps);
    }

    /**
     * Builds an operation from every gate of a circuit, level by level.
     *
     * @param circuit a circuit containing only unitary gates
     * @return the operation, with the circuit's width
     */
    public static UnitaryOperation fromCircuit(Circuit circuit) {
        Objects.requireNonNull(circuit, "circuit");
        List<Gate> gates = new ArrayList<>();
        for (CircuitLevel level : circuit.getLevels()) {
            gates.addAll(level.getGates());
        }
        return of(circuit.getInputSize(), gates.toArray(new Gate[0]));
    }

    /**
     * Builds the reversible classical permutation {@code |x> -> |mapping[x]>}
     * as one dense step over {@code log2(mapping.length)} qubits.
     *
     * @param mapping a bijection of {@code [0, mapping.length)}, length a power of two {@code >= 2}
     * @return the operation
     * @throws IllegalArgumentException if {@code mapping} is not such a bijection
     * @throws JQApiLimitException if it needs more than {@link #MAX_DENSE_QUBITS} qubits
     */
    public static UnitaryOperation permutation(int... mapping) {
        Objects.requireNonNull(mapping, "mapping");
        int dimension = mapping.length;
        if (dimension < 2 || Integer.bitCount(dimension) != 1) {
            throw new IllegalArgumentException("Permutation length must be a power of two >= 2, was: " + dimension);
        }
        int width = Integer.numberOfTrailingZeros(dimension);
        requireDenseSupport(width);
        Complex[][] data = new Complex[dimension][dimension];
        for (Complex[] row : data) {
            Arrays.fill(row, Complex.ZERO);
        }
        boolean[] hit = new boolean[dimension];
        for (int x = 0; x < dimension; x++) {
            int image = mapping[x];
            if (image < 0 || image >= dimension || hit[image]) {
                throw new IllegalArgumentException("Permutation is not a bijection at input " + x);
            }
            hit[image] = true;
            data[image][x] = Complex.ONE;
        }
        return new UnitaryOperation(width, new ArrayList<>(List.of(
                new Step(ComplexMatrix.createMatrixWithData(data), 0, identityIndexes(width)))));
    }

    /** @return the number of local qubits */
    public int getQubitCount() {
        return qubitCount;
    }

    /** @return the number of gate steps this operation appends to a circuit */
    public int getStepCount() {
        return steps.size();
    }

    /**
     * @param next operation applied after this one, of the same width
     * @return {@code next · this}
     */
    public UnitaryOperation then(UnitaryOperation next) {
        Objects.requireNonNull(next, "next");
        if (next.qubitCount != qubitCount) {
            throw new IllegalArgumentException("Cannot compose widths " + qubitCount + " and "
                    + next.qubitCount + "; remap with on(...) first");
        }
        requireStepBudget((long) steps.size() + next.steps.size(), DEFAULT_MAX_STEPS);
        List<Step> combined = new ArrayList<>(steps);
        combined.addAll(next.steps);
        return new UnitaryOperation(qubitCount, combined);
    }

    /** @return the inverse: steps reversed, each base unitary conjugate-transposed */
    public UnitaryOperation adjoint() {
        List<Step> inverse = new ArrayList<>(steps.size());
        for (int s = steps.size() - 1; s >= 0; s--) {
            Step step = steps.get(s);
            inverse.add(new Step(conjugateTranspose(step.u()), step.controls(), step.qubits()));
        }
        return new UnitaryOperation(qubitCount, inverse);
    }

    /** @return {@link #power(int, long)} with {@link #DEFAULT_MAX_STEPS} */
    public UnitaryOperation power(int exponent) {
        return power(exponent, DEFAULT_MAX_STEPS);
    }

    /**
     * Repeats this operation. Matrix-free storage does not shrink the work:
     * the result has {@code exponent · getStepCount()} steps, checked against
     * {@code maxSteps} before anything is built.
     *
     * @param exponent repetitions, {@code >= 0} ({@code 0} yields the identity)
     * @param maxSteps step budget, {@code >= 0}
     * @return {@code this^exponent}
     * @throws JQApiLimitException if the result would exceed {@code maxSteps}
     */
    public UnitaryOperation power(int exponent, long maxSteps) {
        if (exponent < 0) {
            throw new IllegalArgumentException("Exponent must be non-negative, was: " + exponent);
        }
        List<Step> repeated = new ArrayList<>(requireStepBudget((long) steps.size() * exponent, maxSteps));
        if (steps.isEmpty()) {
            return this;
        }
        for (int r = 0; r < exponent; r++) {
            repeated.addAll(steps);
        }
        return new UnitaryOperation(qubitCount, repeated);
    }

    /**
     * Adds one control qubit as the new local qubit 0; existing qubits shift
     * by one. Every step is controlled exactly (not up to phase), so a global
     * phase of this operation becomes the relative phase of the control's
     * {@code |1>} branch, and the {@code |0>} branch is left unchanged.
     *
     * @return controlled-{@code this}, one qubit wider
     * @throws JQApiLimitException if the width or a step's support exceeds the limits
     */
    public UnitaryOperation controlled() {
        validateWidth(qubitCount + 1);
        List<Step> controlled = new ArrayList<>(steps.size());
        for (Step step : steps) {
            requireDenseSupport(step.qubits().length + 1);
            int[] qubits = new int[step.qubits().length + 1];
            for (int q = 0; q < step.qubits().length; q++) {
                qubits[q + 1] = step.qubits()[q] + 1;
            }
            controlled.add(new Step(step.u(), step.controls() + 1, qubits));
        }
        return new UnitaryOperation(qubitCount + 1, controlled);
    }

    /**
     * Controlled-{@code this^exponent}, e.g. the {@code C-U^(2^j)} blocks of
     * phase estimation, with the {@link #DEFAULT_MAX_STEPS} budget.
     *
     * @param exponent repetitions, {@code >= 0}
     * @return the controlled power, control on local qubit 0
     */
    public UnitaryOperation controlledPower(int exponent) {
        return power(exponent).controlled();
    }

    /**
     * Embeds this operation in a register of {@code width} qubits: local qubit
     * {@code i} becomes {@code qubits[i]}. Targets may be non-adjacent and in
     * any order.
     *
     * @param width the new local width
     * @param qubits one distinct index in {@code [0, width)} per local qubit
     * @return the remapped operation
     */
    public UnitaryOperation on(int width, int... qubits) {
        validateWidth(width);
        validateMapping(width, qubits);
        List<Step> remapped = new ArrayList<>(steps.size());
        for (Step step : steps) {
            int[] mapped = new int[step.qubits().length];
            for (int q = 0; q < mapped.length; q++) {
                mapped[q] = qubits[step.qubits()[q]];
            }
            remapped.add(new Step(step.u(), step.controls(), mapped));
        }
        return new UnitaryOperation(width, remapped);
    }

    /**
     * Appends this operation to {@code circuit}, one level per step, with local
     * qubit {@code i} placed on circuit qubit {@code qubits[i]}. Plain steps
     * become {@link GenericGate}s and controlled steps {@link MultiControlled}
     * gates, so the simulator only ever sees small local matrices.
     *
     * @param circuit the circuit to extend
     * @param qubits one distinct circuit qubit per local qubit
     */
    public void appendTo(Circuit circuit, int... qubits) {
        Objects.requireNonNull(circuit, "circuit");
        // Build every level first so a failure leaves the circuit untouched.
        List<CircuitLevel> levels = new ArrayList<>(steps.size());
        for (Step step : on(circuit.getInputSize(), qubits).steps) {
            Integer[] indexes = new Integer[step.qubits().length];
            for (int q = 0; q < indexes.length; q++) {
                indexes[q] = step.qubits()[q];
            }
            CircuitLevel level = new CircuitLevel();
            level.addGate(step.controls() == 0
                    ? new GenericGate(step.u(), indexes.length, indexes)
                    : new MultiControlled(step.u(), step.controls(), indexes));
            levels.add(level);
        }
        circuit.addLevel(levels.toArray(new CircuitLevel[0]));
    }

    /**
     * Appends this operation to {@code circuit} on qubits {@code 0..qubitCount-1}.
     *
     * @param circuit a circuit at least as wide as this operation
     */
    public void appendTo(Circuit circuit) {
        appendTo(circuit, identityIndexes(qubitCount));
    }

    private static void addGate(List<Step> steps, int qubitCount, Gate gate) {
        String type = gate.getType();
        // Snapshot: Gate.getIndexes() is a mutable list.
        int[] indexes = gate.getIndexes().stream().mapToInt(Integer::intValue).toArray();
        boolean[] seen = new boolean[qubitCount];
        for (int index : indexes) {
            if (index < 0 || index >= qubitCount) {
                throw new IllegalArgumentException("Gate index " + index + " is outside [0, " + qubitCount + ")");
            }
            if (seen[index]) {
                throw new IllegalArgumentException("Gate indexes must be distinct: " + index);
            }
            seen[index] = true;
        }
        if (Constants.IDENTITY.equals(type)) {
            return;
        }
        if (gate instanceof ConditionalGate || Constants.MEASUREMENT.equals(type) || Constants.RESET.equals(type)) {
            throw new IllegalArgumentException("Unitary operations reject " + type + " gates");
        }
        ComplexMatrix u = gate.getMatrix();
        int arity = Integer.numberOfTrailingZeros(u.getRowDimension());
        requireDenseSupport(arity);
        requireUnitary(u, type);
        if (arity == 1) {
            for (int index : indexes) {
                steps.add(new Step(u, 0, new int[]{index}));
            }
        } else if (indexes.length == arity) {
            steps.add(new Step(u, 0, indexes));
        } else {
            throw new IllegalArgumentException(type + " gate matrix acts on " + arity
                    + " qubit(s) but lists " + indexes.length + " index(es)");
        }
    }

    private static void requireUnitary(ComplexMatrix u, String type) {
        int d = u.getRowDimension();
        if (d < 2 || Integer.bitCount(d) != 1 || u.getColumnDimension() != d) {
            throw new IllegalArgumentException(type + " matrix must be square with power-of-two dimension");
        }
        for (int r = 0; r < d; r++) {
            for (int c = 0; c < d; c++) {
                double re = 0;
                double im = 0;
                for (int k = 0; k < d; k++) {
                    Complex a = u.getEntry(k, r).conjugate();
                    Complex b = u.getEntry(k, c);
                    re += a.getReal() * b.getReal() - a.getImaginary() * b.getImaginary();
                    im += a.getReal() * b.getImaginary() + a.getImaginary() * b.getReal();
                }
                double expectedRe = r == c ? 1 : 0;
                if (!(Math.abs(re - expectedRe) <= UNITARY_TOLERANCE && Math.abs(im) <= UNITARY_TOLERANCE)) {
                    throw new IllegalArgumentException(type + " matrix is not unitary");
                }
            }
        }
    }

    private static ComplexMatrix conjugateTranspose(ComplexMatrix u) {
        int d = u.getRowDimension();
        Complex[][] data = new Complex[d][d];
        for (int r = 0; r < d; r++) {
            for (int c = 0; c < d; c++) {
                data[r][c] = u.getEntry(c, r).conjugate();
            }
        }
        return ComplexMatrix.createMatrixWithData(data);
    }

    private static void validateWidth(int width) {
        if (width < 1 || width > JQAPIConfig.ABSOLUTE_MAX_QUBITS) {
            throw new JQApiLimitException("Operation width must be in [1, "
                    + JQAPIConfig.ABSOLUTE_MAX_QUBITS + "], was: " + width);
        }
    }

    private void validateMapping(int width, int[] qubits) {
        Objects.requireNonNull(qubits, "qubits");
        if (qubits.length != qubitCount) {
            throw new IllegalArgumentException("Expected " + qubitCount + " qubit indexes, got " + qubits.length);
        }
        boolean[] seen = new boolean[width];
        for (int qubit : qubits) {
            if (qubit < 0 || qubit >= width) {
                throw new IllegalArgumentException("Qubit " + qubit + " is outside [0, " + width + ")");
            }
            if (seen[qubit]) {
                throw new IllegalArgumentException("Qubit indexes must be distinct: " + qubit);
            }
            seen[qubit] = true;
        }
    }

    private static void requireDenseSupport(int qubits) {
        if (qubits > MAX_DENSE_QUBITS) {
            throw new JQApiLimitException("Dense step over " + qubits + " qubits exceeds "
                    + MAX_DENSE_QUBITS);
        }
    }

    /** @return {@code steps} as an int, once it fits both the budget and a Java list */
    private static int requireStepBudget(long steps, long maxSteps) {
        if (maxSteps < 0) {
            throw new IllegalArgumentException("Step budget must be non-negative, was: " + maxSteps);
        }
        if (steps > Math.min(maxSteps, Integer.MAX_VALUE - 8)) {
            throw new JQApiLimitException("Operation needs " + steps + " steps, budget is " + maxSteps);
        }
        return (int) steps;
    }

    private static int[] identityIndexes(int width) {
        int[] indexes = new int[width];
        for (int q = 0; q < width; q++) {
            indexes[q] = q;
        }
        return indexes;
    }
}
