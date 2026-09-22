package org.aitan.jqapi.test;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.Qft;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitSuperposition;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QftTest {

    private static final double TOLERANCE = 1e-9;

    @Test
    void forwardQft_matchesAnalyticDft_forOneToFourQubits() {
        for (int qubitCount = 1; qubitCount <= 4; qubitCount++) {
            int dimension = 1 << qubitCount;
            for (int input = 0; input < dimension; input++) {
                Circuit circuit = basisStateCircuit(qubitCount, input);
                Qft.appendForward(circuit, indexes(qubitCount));
                ComplexVector actual = run(circuit).getQuantumRegister().getRegisterState();

                for (int output = 0; output < dimension; output++) {
                    Complex expected = Complex.expI(2.0 * Math.PI * input * output / dimension)
                            .multiply(1.0 / Math.sqrt(dimension));
                    assertComplexEquals(expected, actual.getEntry(output),
                            "qubits=" + qubitCount + ", input=" + input + ", output=" + output);
                }
            }
        }
    }

    @Test
    void forwardThenInverse_recoversComplexProductState() {
        Circuit circuit = new Circuit(3);
        Qft.appendForward(circuit, 0, 1, 2);
        Qft.appendInverse(circuit, 0, 1, 2);

        Qubit[] input = complexProductState();
        assertSameState(run(new Circuit(3), input).getQuantumRegister().getRegisterState(),
                run(circuit, input).getQuantumRegister().getRegisterState());
    }

    @Test
    void inverseThenForward_recoversComplexProductState() {
        Circuit circuit = new Circuit(3);
        Qft.appendInverse(circuit, 0, 1, 2);
        Qft.appendForward(circuit, 0, 1, 2);

        Qubit[] input = complexProductState();
        assertSameState(run(new Circuit(3), input).getQuantumRegister().getRegisterState(),
                run(circuit, input).getQuantumRegister().getRegisterState());
    }

    @Test
    void qft_usesDeclaredOrderForNonAdjacentTargets_andLeavesOtherQubitsUntouched() {
        Circuit circuit = basisStateCircuit(4, 0b1011);
        Qft.appendForward(circuit, 3, 1);
        ComplexVector actual = run(circuit).getQuantumRegister().getRegisterState();

        for (int localOutput = 0; localOutput < 4; localOutput++) {
            int q3 = (localOutput >> 1) & 1;
            int q1 = localOutput & 1;
            int fullIndex = 0b1010 | (q1 << 2) | q3;
            Complex expected = Complex.expI(Math.PI * localOutput)
                    .multiply(1.0 / 2.0);
            assertComplexEquals(expected, actual.getEntry(fullIndex), "local output=" + localOutput);
        }
        for (int index = 0; index < 16; index++) {
            boolean q0AndQ2RemainOne = (index & 0b1010) == 0b1010;
            if (!q0AndQ2RemainOne) {
                assertComplexEquals(Complex.ZERO, actual.getEntry(index), "external qubits changed at index=" + index);
            }
        }
    }

    @Test
    void rejectsInvalidTargetsBeforeChangingCircuit() {
        Circuit circuit = new Circuit(3);
        assertThrows(IllegalArgumentException.class, () -> Qft.appendForward(circuit));
        assertThrows(IllegalArgumentException.class, () -> Qft.appendForward(circuit, 0, 0));
        assertThrows(IllegalArgumentException.class, () -> Qft.appendInverse(circuit, 0, 3));
        assertEquals(0, circuit.getLevels().size());
    }

    @Test
    void honorsCircuitQubitLimit() {
        assertThrows(JQApiLimitException.class, () -> Qft.forward(0));
        assertThrows(JQApiLimitException.class, () -> Qft.forward(JQAPIConfig.ABSOLUTE_MAX_QUBITS + 1));
    }

    @Test
    void rejectsDuplicateTargets() {
        Circuit c = new Circuit(3);
        assertThrows(IllegalArgumentException.class, () -> Qft.appendForward(c, 0, 0));
    }

    @Test
    void rejectsOutOfRangeTarget() {
        Circuit c = new Circuit(3);
        assertThrows(IllegalArgumentException.class, () -> Qft.appendForward(c, 5));
    }

    @Test
    void rejectsEmptyTargets() {
        Circuit c = new Circuit(3);
        assertThrows(IllegalArgumentException.class, () -> Qft.appendForward(c));
    }

    @Test
    void singleTargetForward() {
        Circuit c = Qft.forward(1);
        assertEquals(1, c.getInputSize());
        assertTrue(c.getLevels().size() > 0);
    }

    @Test
    void singleTargetInverse() {
        Circuit c = Qft.inverse(1);
        assertEquals(1, c.getInputSize());
        assertTrue(c.getLevels().size() > 0);
    }

    // Additional coverage for Qft branches
    @Test
    void qftCoverageExtra() {
        // Forward/inverse with different counts to hit appendBitReversal and loop branches
        for (int n = 2; n <= 5; n++) {
            Circuit fwd = Qft.forward(n);
            assertEquals(n, fwd.getInputSize());
            assertTrue(fwd.getLevels().size() > 0);

            Circuit inv = Qft.inverse(n);
            assertTrue(inv.getLevels().size() > 0);
        }

        // Append on non-empty circuit
        Circuit c = new Circuit(3);
        c.addLevel(new CircuitLevel()); // empty level
        Qft.appendForward(c, 0, 1, 2);
        assertTrue(c.getLevels().size() >= 2);

        // Non-adjacent targets
        Qft.appendInverse(new Circuit(4), 3, 1);
    }

    private static Circuit basisStateCircuit(int qubitCount, int basisState) {
        Circuit circuit = new Circuit(qubitCount);
        CircuitLevel preparation = new CircuitLevel();
        for (int qubit = 0; qubit < qubitCount; qubit++) {
            if (((basisState >> (qubitCount - 1 - qubit)) & 1) != 0) {
                preparation.addGate(new PauliX(qubit));
            }
        }
        if (!preparation.getGates().isEmpty()) {
            circuit.addLevel(preparation);
        }
        return circuit;
    }

    private static int[] indexes(int qubitCount) {
        int[] indexes = new int[qubitCount];
        for (int index = 0; index < qubitCount; index++) {
            indexes[index] = index;
        }
        return indexes;
    }

    private static Qubit[] complexProductState() {
        double amplitude = 1.0 / Math.sqrt(2.0);
        return new Qubit[]{
            new QubitSuperposition(new ComplexVector(new Complex[]{
                new Complex(amplitude, 0), new Complex(0, amplitude)})),
            new QubitSuperposition(new ComplexVector(new Complex[]{
                new Complex(amplitude, 0), new Complex(-amplitude, 0)})),
            new QubitSuperposition(new ComplexVector(new Complex[]{
                new Complex(amplitude, 0), new Complex(amplitude, 0)}))};
    }

    private static LocalSimulator run(Circuit circuit, Qubit... input) {
        LocalSimulator simulator = input.length == 0
                ? new LocalSimulator(circuit)
                : new LocalSimulator(circuit, input);
        simulator.execute();
        return simulator;
    }

    private static void assertSameState(ComplexVector expected, ComplexVector actual) {
        assertEquals(expected.getDimension(), actual.getDimension());
        for (int index = 0; index < expected.getDimension(); index++) {
            assertComplexEquals(expected.getEntry(index), actual.getEntry(index), "index=" + index);
        }
    }

    private static void assertComplexEquals(Complex expected, Complex actual, String message) {
        assertEquals(expected.getReal(), actual.getReal(), TOLERANCE, message + " real");
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOLERANCE, message + " imaginary");
    }
}