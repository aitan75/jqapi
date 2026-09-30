package org.aitan.jqapi.test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.Qft;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.UnitaryOperation;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.gates.ConditionalGate;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Identity;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.PauliT;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.Reset;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

class UnitaryOperationTest {

    private static final double TOLERANCE = 1e-9;
    private static final Complex H = new Complex(1 / Math.sqrt(2), 0);

    @Test
    void composition_matchesAnalyticProduct_andAdjointInverts() {
        double theta = 0.37;
        UnitaryOperation op = UnitaryOperation.of(2,
                new Hadamard(0), new ControlledNot(0, 1), new PauliT(1), new Rx(theta, 0));

        Complex c = new Complex(Math.cos(theta / 2), 0);
        Complex s = new Complex(0, -Math.sin(theta / 2));
        Complex[][] hadamard = {{H, H}, {H, H.multiply(-1)}};
        Complex[][] t = diag(Complex.ONE, Complex.expI(Math.PI / 4));
        Complex[][] rx = {{c, s}, {s, c}};
        Complex[][] cnot = permutationMatrix(0, 1, 3, 2);
        Complex[][] expected = multiply(kron(rx, identity(2)), multiply(kron(identity(2), t),
                multiply(cnot, kron(hadamard, identity(2)))));

        assertMatrixEquals(expected, denseMatrix(op));
        assertMatrixEquals(conjugateTranspose(expected), denseMatrix(op.adjoint()));
        assertMatrixEquals(identity(4), denseMatrix(op.then(op.adjoint())));
    }

    @Test
    void remapping_placesLocalQubitsOnNonAdjacentReversedIndexes() {
        // CNOT with local control 0 -> qubit 2 and local target 1 -> qubit 0.
        UnitaryOperation op = UnitaryOperation.of(2, new ControlledNot(0, 1)).on(3, 2, 0);

        int[] image = new int[8];
        for (int x = 0; x < 8; x++) {
            image[x] = (x & 1) == 1 ? x ^ 0b100 : x; // qubit 2 is the LSB, qubit 0 the MSB
        }
        assertMatrixEquals(permutationMatrix(image), denseMatrix(op));
    }

    @Test
    void fromCircuit_reusesQftAsComposableInverse() {
        UnitaryOperation qft = UnitaryOperation.fromCircuit(Qft.forward(3));
        Circuit inverse = Qft.inverse(3);

        assertMatrixEquals(denseMatrix(UnitaryOperation.fromCircuit(inverse)), denseMatrix(qft.adjoint()));
        assertMatrixEquals(identity(8), denseMatrix(qft.then(qft.adjoint())));
    }

    @Test
    void rejectsNonUnitaryInputs() {
        Complex[][] projector = diag(Complex.ONE, Complex.ZERO);
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(1, new Measurement(0)));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(1, new Reset(0)));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(1,
                new ConditionalGate(new PauliX(0), new Condition(0, 1))));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(1,
                new GenericGate(ComplexMatrix.createMatrixWithData(projector), 1, 0)));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(1, new PauliX(1)));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.permutation(0, 0, 1, 2));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.permutation(0, 1, 2));
    }

    @Test
    void controlledPower_matchesReference_andKeepsGlobalPhaseAsRelativePhase() {
        UnitaryOperation t = UnitaryOperation.of(1, new PauliT(0));
        assertMatrixEquals(diag(Complex.ONE, Complex.ONE, Complex.ONE, Complex.expI(3 * Math.PI / 4)),
                denseMatrix(t.controlledPower(3)));

        // e^{i phi} I is unobservable alone but becomes a relative phase under control.
        Complex phase = Complex.expI(0.9);
        UnitaryOperation global = UnitaryOperation.of(1,
                new GenericGate(ComplexMatrix.createMatrixWithData(diag(phase, phase)), 1, 0));
        assertMatrixEquals(diag(Complex.ONE, Complex.ONE, phase.multiply(phase), phase.multiply(phase)),
                denseMatrix(global.controlledPower(2)));
    }

    @Test
    void controlled_leavesInactiveBranchUnchanged_andAppliesUOnActiveBranch() {
        UnitaryOperation u = UnitaryOperation.of(2, new Hadamard(0), new ControlledNot(0, 1), new PauliT(1));
        Complex[][] expected = blockDiag(identity(4), denseMatrix(u));

        assertMatrixEquals(expected, denseMatrix(u.controlled()));
        assertMatrixEquals(blockDiag(identity(4), conjugateTranspose(denseMatrix(u))),
                denseMatrix(u.controlled().adjoint()));
    }

    @Test
    void structuredGrover_embeddedOnNonAdjacentQubits_matchesMatrixFreeReference() {
        int marked = 0b101;
        UnitaryOperation iteration = groverOracle(marked).then(groverDiffusion());
        UnitaryOperation search = UnitaryOperation.of(3, new Hadamard(0, 1, 2)).then(iteration.power(2));

        // Matrix-free reference: phase oracle + inversion about the mean on a bare register.
        QuantumRegister reference = new QuantumRegister(3);
        for (int q = 0; q < 3; q++) {
            reference.applyOperator(ComplexMatrix.createMatrixWithData(new Complex[][]{{H, H}, {H, H.multiply(-1)}}),
                    List.of(q));
        }
        boolean[] marks = new boolean[8];
        marks[marked] = true;
        for (int i = 0; i < 2; i++) {
            reference.applyPhaseOracle(marks);
            reference.applyGroverDiffusion();
        }

        // Search qubits 0,1,2 of the operation live on qubits 3,0,2 of a 5-qubit circuit.
        Circuit circuit = new Circuit(5);
        search.appendTo(circuit, 3, 0, 2);
        ComplexVector state = run(circuit, basis(5, 0));
        for (int x = 0; x < 8; x++) {
            int index = ((x >> 1) & 1) << 4 | (x & 1) << 2 | (x >> 2) << 1; // x = q3 q0 q2
            // Grover's operators are real; the textbook diffusion is -(2|s><s| - I).
            assertComplexEquals(reference.getRegisterState().getEntry(x), state.getEntry(index), "x=" + x);
        }
        assertEquals(0.9453125, Math.pow(state.getEntry(0b00110).abs(), 2), TOLERANCE);
    }

    @Test
    void reversiblePermutation_composesPowersAdjointAndControl() {
        UnitaryOperation increment = UnitaryOperation.permutation(1, 2, 3, 4, 5, 6, 7, 0);

        assertMatrixEquals(identity(8), denseMatrix(increment.power(8)));
        assertMatrixEquals(permutationMatrix(7, 0, 1, 2, 3, 4, 5, 6), denseMatrix(increment.adjoint()));
        assertMatrixEquals(permutationMatrix(3, 4, 5, 6, 7, 0, 1, 2), denseMatrix(increment.power(3)));

        int[] controlledImage = new int[16];
        for (int x = 0; x < 16; x++) {
            controlledImage[x] = x < 8 ? x : 8 + ((x - 8 + 2) & 7);
        }
        assertMatrixEquals(permutationMatrix(controlledImage), denseMatrix(increment.controlledPower(2)));
    }

    @Test
    void phaseEstimation_acceptsEntangledComplexEigenstate() {
        // |01> and |10> both pick up e^{2 pi i / 4}, so (|01> + i|10>)/sqrt2 is an entangled eigenstate.
        UnitaryOperation u = UnitaryOperation.of(2, new Phase(Math.PI / 2, 0), new Phase(Math.PI / 2, 1),
                new ControlledZ(0, 1));
        Complex amp = new Complex(1 / Math.sqrt(2), 0);
        ComplexVector target = new ComplexVector(new Complex[]{Complex.ZERO, amp, amp.multiply(Complex.I), Complex.ZERO});

        Circuit circuit = new Circuit(4);
        circuit.addLevel(level(new Hadamard(0, 1)));
        u.controlledPower(2).appendTo(circuit, 0, 2, 3); // counting MSB controls U^2
        u.controlledPower(1).appendTo(circuit, 1, 2, 3);
        Qft.appendInverse(circuit, 0, 1);
        ComplexVector state = run(circuit, countingZeroTimes(target));

        double countingIsOne = 0;
        for (int t = 0; t < 4; t++) {
            countingIsOne += Math.pow(state.getEntry(0b0100 | t).abs(), 2);
        }
        assertEquals(1.0, countingIsOne, TOLERANCE); // phase 1/4 -> counting register |01>

        ComplexVector unnormalized = new ComplexVector(new Complex[]{Complex.ONE, Complex.ONE, Complex.ZERO, Complex.ZERO});
        assertThrows(IllegalArgumentException.class, () -> run(circuit, countingZeroTimes(unnormalized)));
        assertThrows(IllegalArgumentException.class, () -> run(circuit, target));
    }

    @Test
    void limitsAreCheckedBeforeWork() {
        UnitaryOperation x = UnitaryOperation.of(1, new PauliX(0), new PauliZ(0));

        assertThrows(JQApiLimitException.class, () -> x.power(Integer.MAX_VALUE));
        assertThrows(JQApiLimitException.class, () -> x.power(11, 20));
        assertEquals(20, x.power(10, 20).getStepCount());
        assertEquals(0, x.power(0).getStepCount());
        assertThrows(IllegalArgumentException.class, () -> x.power(-1));
        assertThrows(JQApiLimitException.class, () -> x.controlledPower(1 << 20));
        assertThrows(JQApiLimitException.class, () -> x.on(30, 29).controlled());
        assertThrows(JQApiLimitException.class, () -> UnitaryOperation.of(0));
        assertThrows(JQApiLimitException.class, () -> UnitaryOperation.permutation(new int[1 << 9]));
        assertThrows(JQApiLimitException.class, () -> UnitaryOperation.permutation(identityPermutation(1 << 8))
                .controlled());
        assertThrows(IllegalArgumentException.class, () -> x.on(3, 3));
        assertThrows(IllegalArgumentException.class, () -> x.on(3, 0, 1));
        assertThrows(IllegalArgumentException.class, () -> x.then(x.on(2, 1)));
    }

    @Test
    void factoriesEnforceStepBudgetAndSnapshotValidatedIndexes() {
        Gate[] tooMany = new Gate[(int) UnitaryOperation.DEFAULT_MAX_STEPS + 1];
        Arrays.fill(tooMany, new PauliX(0));
        assertThrows(JQApiLimitException.class, () -> UnitaryOperation.of(1, tooMany));

        // Gate.getIndexes() is mutable: a duplicate injected after construction is still rejected.
        Gate swap = new Swap(0, 1);
        swap.getIndexes().set(1, 0);
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(2, swap));
        assertThrows(IllegalArgumentException.class, () -> UnitaryOperation.of(2, new Identity(5)));
    }

    @Test
    void powerOfEmptyOperationReturnsWithoutRepeating() {
        UnitaryOperation empty = UnitaryOperation.of(1);
        UnitaryOperation result = assertTimeoutPreemptively(Duration.ofSeconds(1),
                () -> empty.power(Integer.MAX_VALUE));
        assertEquals(0, result.getStepCount());
    }

    // --- fixtures -----------------------------------------------------------

    private static UnitaryOperation groverOracle(int marked) {
        // Flip the phase of |marked>: X on its zero bits, CCZ, undo the X gates.
        List<Integer> zeros = new ArrayList<>();
        for (int q = 0; q < 3; q++) {
            if (((marked >> (2 - q)) & 1) == 0) {
                zeros.add(q);
            }
        }
        UnitaryOperation flips = zeros.isEmpty() ? UnitaryOperation.of(3)
                : UnitaryOperation.of(3, new PauliX(zeros.toArray(new Integer[0])));
        return flips.then(ccz()).then(flips);
    }

    private static UnitaryOperation groverDiffusion() {
        UnitaryOperation hx = UnitaryOperation.of(3, new Hadamard(0, 1, 2), new PauliX(0, 1, 2));
        return hx.then(ccz()).then(hx.adjoint());
    }

    private static UnitaryOperation ccz() {
        return UnitaryOperation.of(1, new PauliZ(0)).controlled().controlled();
    }

    // --- dense references (tiny systems only) --------------------------------

    private static Complex[][] denseMatrix(UnitaryOperation op) {
        int n = op.getQubitCount();
        int d = 1 << n;
        Complex[][] matrix = new Complex[d][d];
        for (int column = 0; column < d; column++) {
            Circuit circuit = new Circuit(n);
            op.appendTo(circuit);
            ComplexVector out = run(circuit, basis(n, column));
            for (int row = 0; row < d; row++) {
                matrix[row][column] = out.getEntry(row);
            }
        }
        return matrix;
    }

    private static ComplexVector run(Circuit circuit, ComplexVector initial) {
        LocalSimulator simulator = new LocalSimulator(circuit, initial, () -> 0.5);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    private static ComplexVector basis(int n, int index) {
        Complex[] values = new Complex[1 << n];
        Arrays.fill(values, Complex.ZERO);
        values[index] = Complex.ONE;
        return new ComplexVector(values);
    }

    /** |00> (counting, most significant) tensor the 2-qubit target. */
    private static ComplexVector countingZeroTimes(ComplexVector target) {
        Complex[] values = basis(4, 0).getData();
        System.arraycopy(target.getData(), 0, values, 0, 4);
        return new ComplexVector(values);
    }

    private static CircuitLevel level(Gate gate) {
        CircuitLevel level = new CircuitLevel();
        level.addGate(gate);
        return level;
    }

    private static ComplexMatrix com(Complex[][] data) {
        return ComplexMatrix.createMatrixWithData(data);
    }

    private static int[] identityPermutation(int d) {
        int[] mapping = new int[d];
        for (int i = 0; i < d; i++) {
            mapping[i] = i;
        }
        return mapping;
    }

    private static Complex[][] identity(int d) {
        return permutationMatrix(identityPermutation(d));
    }

    private static Complex[][] diag(Complex... entries) {
        Complex[][] m = zeros(entries.length);
        for (int i = 0; i < entries.length; i++) {
            m[i][i] = entries[i];
        }
        return m;
    }

    /** Column x holds |image[x]>. */
    private static Complex[][] permutationMatrix(int... image) {
        Complex[][] m = zeros(image.length);
        for (int x = 0; x < image.length; x++) {
            m[image[x]][x] = Complex.ONE;
        }
        return m;
    }

    private static Complex[][] blockDiag(Complex[][] a, Complex[][] b) {
        Complex[][] m = zeros(a.length + b.length);
        for (int r = 0; r < a.length; r++) {
            System.arraycopy(a[r], 0, m[r], 0, a.length);
        }
        for (int r = 0; r < b.length; r++) {
            System.arraycopy(b[r], 0, m[a.length + r], a.length, b.length);
        }
        return m;
    }

    private static Complex[][] zeros(int d) {
        Complex[][] m = new Complex[d][d];
        for (Complex[] row : m) {
            Arrays.fill(row, Complex.ZERO);
        }
        return m;
    }

    private static Complex[][] multiply(Complex[][] a, Complex[][] b) {
        int d = a.length;
        Complex[][] m = zeros(d);
        for (int r = 0; r < d; r++) {
            for (int c = 0; c < d; c++) {
                for (int k = 0; k < d; k++) {
                    m[r][c] = m[r][c].add(a[r][k].multiply(b[k][c]));
                }
            }
        }
        return m;
    }

    private static Complex[][] kron(Complex[][] a, Complex[][] b) {
        return ComplexMatrix.kroneckerProduct(List.of(com(a), com(b))).getData();
    }

    private static Complex[][] conjugateTranspose(Complex[][] a) {
        Complex[][] m = zeros(a.length);
        for (int r = 0; r < a.length; r++) {
            for (int c = 0; c < a.length; c++) {
                m[r][c] = a[c][r].conjugate();
            }
        }
        return m;
    }

    private static void assertMatrixEquals(Complex[][] expected, Complex[][] actual) {
        assertEquals(expected.length, actual.length, "dimension");
        for (int r = 0; r < expected.length; r++) {
            for (int c = 0; c < expected.length; c++) {
                assertComplexEquals(expected[r][c], actual[r][c], "entry (" + r + "," + c + ")");
            }
        }
    }

    private static void assertComplexEquals(Complex expected, Complex actual, String message) {
        assertEquals(expected.getReal(), actual.getReal(), TOLERANCE, message + " real");
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOLERANCE, message + " imaginary");
    }
}
