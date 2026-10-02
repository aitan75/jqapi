package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.Rz;

/**
 * Matrix-free Hamiltonian evolution using Pauli parity ladders and product formulas.
 * Local qubit 0 is the most significant bit. Terms are applied in the order stored
 * in {@link PauliSum}; symmetric second order then applies them in reverse order.
 * <p>
 * The operator convention is {@code exp(-i H t)}, including its global phase.
 * Identity terms use a scalar one-qubit gate, so {@link UnitaryOperation#controlled()}
 * preserves that phase as a relative phase of the active control branch.
 * No full-register matrix is allocated.
 * <p>
 * Builders accept widths supported by {@link PauliString} (1 to 30). Simulation
 * additionally obeys the destination circuit's configuration. Both the number of
 * input terms visited per slice and the total emitted gate count are capped at
 * {@link UnitaryOperation#DEFAULT_MAX_STEPS}; callers may lower the gate budget.
 */
public final class TrotterEvolution {

    private TrotterEvolution() {
        // Static utilities only.
    }

    /**
     * Exact {@code exp(-i angle P)} via basis changes, parity CNOTs, Rz and uncomputation.
     * Identity words preserve the scalar phase; zero angle produces an empty operation.
     *
     * @param p Pauli word, including identity factors and non-adjacent active qubits
     * @param angle signed finite angle whose doubled value is finite
     * @return phase-preserving unitary
     * @throws IllegalArgumentException if the angle or its doubled value is non-finite
     */
    public static UnitaryOperation pauliExponential(PauliString p, double angle) {
        Objects.requireNonNull(p, "pauli");
        validateAngle(angle);
        List<Gate> gates = new ArrayList<>();
        appendPauliGates(gates, p, angle);
        return UnitaryOperation.of(p.numQubits(), gates.toArray(new Gate[0]));
    }

    /**
     * First-order Trotter evolution with the default gate budget.
     *
     * @param hamiltonian shared Pauli sum, in application order
     * @param time finite, non-negative evolution time
     * @param steps positive number of slices
     * @return approximation to {@code exp(-i H time)}
     */
    public static UnitaryOperation firstOrder(PauliSum hamiltonian, double time, int steps) {
        return firstOrder(hamiltonian, time, steps, UnitaryOperation.DEFAULT_MAX_STEPS);
    }

    /**
     * First-order Trotter: each slice applies all terms with angle {@code c_j time / steps}.
     * For fixed H and time its error is generally O(1/steps).
     *
     * @param hamiltonian non-null Pauli sum (finite coefficients validated by PauliSum)
     * @param time finite, non-negative evolution time
     * @param steps positive number of slices
     * @param maxGates non-negative total gate budget, capped by DEFAULT_MAX_STEPS
     * @return approximation including the identity-term phase
     * @throws IllegalArgumentException for invalid time, steps, budget or overflowing angles
     * @throws JQApiLimitException if the term-work or total gate budget is exceeded
     */
    public static UnitaryOperation firstOrder(PauliSum hamiltonian, double time, int steps, long maxGates) {
        return evolution(hamiltonian, time, steps, maxGates, false);
    }

    /**
     * Symmetric second-order Suzuki evolution with the default gate budget.
     *
     * @param hamiltonian shared Pauli sum, in application order
     * @param time finite, non-negative evolution time
     * @param steps positive number of slices
     * @return approximation to {@code exp(-i H time)}
     */
    public static UnitaryOperation secondOrder(PauliSum hamiltonian, double time, int steps) {
        return secondOrder(hamiltonian, time, steps, UnitaryOperation.DEFAULT_MAX_STEPS);
    }

    /**
     * Symmetric second order: each slice applies forward and reverse term lists,
     * both with angle {@code c_j time / (2 steps)}. For fixed H and time its error
     * is generally O(1/steps^2). Adjacent equal terms are not merged.
     *
     * @param hamiltonian non-null Pauli sum (finite coefficients validated by PauliSum)
     * @param time finite, non-negative evolution time
     * @param steps positive number of slices
     * @param maxGates non-negative total gate budget, capped by DEFAULT_MAX_STEPS
     * @return approximation including the identity-term phase
     * @throws IllegalArgumentException for invalid time, steps, budget or overflowing angles
     * @throws JQApiLimitException if the term-work or total gate budget is exceeded
     */
    public static UnitaryOperation secondOrder(PauliSum hamiltonian, double time, int steps, long maxGates) {
        return evolution(hamiltonian, time, steps, maxGates, true);
    }

    private static UnitaryOperation evolution(PauliSum hamiltonian, double time, int steps,
            long maxGates, boolean symmetric) {
        Objects.requireNonNull(hamiltonian, "hamiltonian");
        if (!Double.isFinite(time) || time < 0) {
            throw new IllegalArgumentException("Time must be finite and non-negative: " + time);
        }
        if (steps <= 0) {
            throw new IllegalArgumentException("Steps must be positive: " + steps);
        }
        if (maxGates < 0) {
            throw new IllegalArgumentException("Gate budget must be non-negative: " + maxGates);
        }
        List<PauliSum.Term> terms = hamiltonian.terms();
        int passes = symmetric ? 2 : 1;
        if ((long) terms.size() * passes > UnitaryOperation.DEFAULT_MAX_STEPS) {
            throw new JQApiLimitException("Too many Pauli terms per slice");
        }
        long budget = Math.min(maxGates, UnitaryOperation.DEFAULT_MAX_STEPS);
        long sliceGates = 0;
        // Preflight all angles and the complete repeated circuit before allocating gates.
        for (PauliSum.Term term : terms) {
            double angle = termAngle(term.coeff(), time, steps, passes);
            validateAngle(angle);
            if (angle != 0) {
                sliceGates += (long) gateCount(term.pauli()) * passes;
            }
        }
        // Division avoids overflow even for Integer.MAX_VALUE slices.
        if (sliceGates > budget / steps) {
            throw new JQApiLimitException("Evolution exceeds total gate budget: " + budget);
        }
        List<Gate> gates = new ArrayList<>((int) sliceGates);
        for (PauliSum.Term term : terms) {
            appendPauliGates(gates, term.pauli(), termAngle(term.coeff(), time, steps, passes));
        }
        if (symmetric) {
            for (int j = terms.size() - 1; j >= 0; j--) {
                PauliSum.Term term = terms.get(j);
                appendPauliGates(gates, term.pauli(), termAngle(term.coeff(), time, steps, passes));
            }
        }
        return UnitaryOperation.of(hamiltonian.numQubits(), gates.toArray(new Gate[0]))
                .power(steps, budget);
    }

    private static double termAngle(double coefficient, double time, int steps, int passes) {
        // Multiply first to avoid losing tiny times before a large coefficient
        // rescales them. If that overflows, divide time before multiplying.
        double product = coefficient * time;
        return Double.isFinite(product) ? product / steps / passes
                : coefficient * (time / steps / passes);
    }

    private static int gateCount(PauliString p) {
        int active = Integer.bitCount(p.xMask() | p.zMask());
        if (active == 0) {
            return 1;
        }
        int x = Integer.bitCount(p.xMask() & ~p.zMask());
        return 2 * x + 4 * p.yCount() + 2 * (active - 1) + 1;
    }

    private static void validateAngle(double angle) {
        if (!Double.isFinite(angle) || !Double.isFinite(2 * angle)) {
            throw new IllegalArgumentException("Angle and doubled angle must be finite: " + angle);
        }
    }

    private static void appendPauliGates(List<Gate> gates, PauliString p, double angle) {
        if (angle == 0) {
            return;
        }
        if ((p.xMask() | p.zMask()) == 0) {
            // (exp(-i angle) I_2) tensor I_rest has the required global phase.
            Complex phase = new Complex(Math.cos(angle), -Math.sin(angle));
            gates.add(new GenericGate(ComplexMatrix.createMatrixWithData(new Complex[][]{
                {phase, Complex.ZERO}, {Complex.ZERO, phase}
            }), 1, 0));
            return;
        }
        List<Integer> active = new ArrayList<>();
        for (int q = 0; q < p.numQubits(); q++) {
            switch (p.get(q)) {
                case I -> { continue; }
                case X -> gates.add(new Hadamard(q));
                case Y -> {
                    gates.add(new Phase(-Math.PI / 2, q));
                    gates.add(new Hadamard(q));
                }
                case Z -> { }
            }
            active.add(q);
        }
        int last = active.get(active.size() - 1);
        for (int i = 0; i < active.size() - 1; i++) {
            gates.add(new ControlledNot(active.get(i), last));
        }
        gates.add(new Rz(2 * angle, last));
        for (int i = active.size() - 2; i >= 0; i--) {
            gates.add(new ControlledNot(active.get(i), last));
        }
        for (int i = active.size() - 1; i >= 0; i--) {
            int q = active.get(i);
            switch (p.get(q)) {
                case X -> gates.add(new Hadamard(q));
                case Y -> {
                    gates.add(new Hadamard(q));
                    gates.add(new Phase(Math.PI / 2, q));
                }
                default -> { }
            }
        }
    }
}
