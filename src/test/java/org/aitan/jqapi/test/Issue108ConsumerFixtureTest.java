package org.aitan.jqapi.test;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.Expectation;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.observable.PauliSum.Term;
import org.aitan.jqapi.observable.PauliSumJson;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Ry;
import org.aitan.jqapi.quantum.simulator.ExpectationSampler;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.SampledExpectation;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;
import org.junit.jupiter.api.Test;
import static org.aitan.jqapi.test.ClassicalTestSupport.circuit;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Issue #108 phase E: standalone consumer contracts for the shared observable API,
 * written the way #32 (VQE/QAOA), #51 (QML kernels) and #50 (Trotter) will use it,
 * without depending on those algorithms.
 */
class Issue108ConsumerFixtureTest {

    private static Term term(double coeff, String label) {
        return new Term(coeff, PauliString.fromLabel(label));
    }

    private static ComplexVector state(Circuit circuit) {
        LocalSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    /** #32 VQE: energy of a one-parameter ansatz, exact and shot-based. */
    @Test
    void vqeEnergyOfRyAnsatz() {
        PauliSum h = PauliSum.of(term(1, "Z"), term(0.5, "X"));
        for (double theta = -Math.PI; theta <= Math.PI; theta += Math.PI / 8) {
            ComplexVector psi = state(circuit(1, 0, new Ry(theta, 0)));
            assertEquals(Math.cos(theta) + 0.5 * Math.sin(theta), Expectation.of(psi, h), 1e-12, "theta " + theta);
        }
        double theta = 2.1;
        SampledExpectation sampled = ExpectationSampler.estimate(circuit(1, 0, new Ry(theta, 0)), h,
                new SamplingOptions(SamplingOptions.MAX_SHOTS).withSeed(32));
        double exact = Math.cos(theta) + 0.5 * Math.sin(theta);
        assertTrue(Math.abs(sampled.value() - exact) <= 4 * sampled.standardError(),
                "sampled " + sampled.value() + " exact " + exact + " se " + sampled.standardError());
    }

    /** #32 QAOA: MaxCut cost C = Σ_(i,j) ½(I − Z_i Z_j) on a triangle. */
    @Test
    void qaoaMaxCutCostOnTriangle() {
        PauliSum cost = PauliSum.of(term(1.5, "III"), term(-0.5, "ZZI"), term(-0.5, "IZZ"), term(-0.5, "ZIZ"));
        assertEquals(0, Expectation.of(state(circuit(3, 0)), cost), 1e-12);
        assertEquals(2, Expectation.of(state(circuit(3, 0, new PauliX(2))), cost), 1e-12);
        assertEquals(2, Expectation.of(state(circuit(3, 0, new PauliX(0))), cost), 1e-12);
        assertEquals(2, Expectation.of(state(circuit(3, 0, new PauliX(0), new PauliX(1))), cost), 1e-12);
        assertEquals(0, Expectation.of(state(circuit(3, 0, new PauliX(0), new PauliX(1), new PauliX(2))), cost), 1e-12);
        // Uniform superposition: every edge is cut with probability 1/2.
        assertEquals(1.5, Expectation.of(state(circuit(3, 0, new Hadamard(0), new Hadamard(1), new Hadamard(2))), cost), 1e-12);
    }

    /** #51 QML: quantum kernel k(a, b) = |⟨φ(a)|φ(b)⟩|² for an Ry feature map. */
    @Test
    void qmlKernelFromFeatureMapFidelity() {
        double[] features = {-1.3, 0, 0.4, 2.2};
        for (double a : features) {
            for (double b : features) {
                double kernel = Expectation.fidelity(state(circuit(1, 0, new Ry(a, 0))), state(circuit(1, 0, new Ry(b, 0))));
                double expected = Math.pow(Math.cos((a - b) / 2), 2);
                assertEquals(expected, kernel, 1e-12, a + " vs " + b);
            }
        }
    }

    /** #50 Trotter: transverse-field Ising H = −J Σ Z_i Z_(i+1) − h Σ X_i on 3 qubits. */
    @Test
    void trotterIsingHamiltonianOnKnownStates() {
        double j = 1.0;
        double field = 0.7;
        PauliSum ising = PauliSum.of(term(-j, "ZZI"), term(-j, "IZZ"),
                term(-field, "XII"), term(-field, "IXI"), term(-field, "IIX"));
        assertEquals(-2 * j, Expectation.of(state(circuit(3, 0)), ising), 1e-12);
        assertEquals(-3 * field, Expectation.of(state(circuit(3, 0, new Hadamard(0), new Hadamard(1), new Hadamard(2))), ising), 1e-12);
        assertEquals(2 * j, Expectation.of(state(circuit(3, 0, new PauliX(1))), ising), 1e-12);
    }

    /** Consumers can exchange Hamiltonians as the same JSON the bridge will accept. */
    @Test
    void hamiltoniansTravelAsObservableJson() {
        PauliSum ising = PauliSum.of(term(-1, "ZZI"), term(-1, "IZZ"), term(-0.7, "XII"));
        PauliSum restored = PauliSumJson.fromJson(PauliSumJson.toJson(ising), JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS));
        ComplexVector psi = state(circuit(3, 0, new Hadamard(0), new Ry(0.9, 1), new Ry(-0.3, 2)));
        assertEquals(Expectation.of(psi, ising), Expectation.of(psi, restored), 0);
    }
}
