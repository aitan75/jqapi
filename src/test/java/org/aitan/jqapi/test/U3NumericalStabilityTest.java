package org.aitan.jqapi.test;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.Ry;
import org.aitan.jqapi.quantum.gates.U3;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import static org.junit.jupiter.api.Assertions.*;

class U3NumericalStabilityTest {
    private static final double TOL = 1e-12;
    private static final JQAPIConfig CONFIG = JQAPIConfig.sequential(1);

    static Object[][] finiteAngles() {
        return new Object[][]{
            {0.73, Double.MAX_VALUE, Double.MAX_VALUE},
            {0.73, -Double.MAX_VALUE, -Double.MAX_VALUE},
            {Double.MAX_VALUE, Double.MAX_VALUE, 0.37},
            {-Double.MAX_VALUE, 0.37, -Double.MAX_VALUE},
            {0.73, 1e300, 0.37},
            {0.73, Double.MAX_VALUE, -Double.MAX_VALUE},
            {0.0, Double.MAX_VALUE, Double.MAX_VALUE}
        };
    }

    @ParameterizedTest
    @MethodSource("finiteAngles")
    void finiteExtremeAnglesProduceFiniteUnitaryMatrices(double theta, double phi, double lambda) {
        ComplexMatrix matrix = new U3(theta, phi, lambda, 0).getMatrix();
        for (int row = 0; row < 2; row++) {
            for (int column = 0; column < 2; column++) {
                Complex entry = matrix.getEntry(row, column);
                assertTrue(Double.isFinite(entry.getReal()), "real entry must be finite");
                assertTrue(Double.isFinite(entry.getImaginary()), "imaginary entry must be finite");
                Complex product = Complex.ZERO;
                for (int k = 0; k < 2; k++) {
                    product = product.add(matrix.getEntry(k, row).conjugate().multiply(matrix.getEntry(k, column)));
                }
                assertComplex(row == column ? Complex.ONE : Complex.ZERO, product);
            }
        }
    }

    @ParameterizedTest
    @MethodSource("finiteAngles")
    void simulationMatchesPhaseRyPhaseDecomposition(double theta, double phi, double lambda) {
        // U3 = P(phi) Ry(theta) P(lambda); execution order is right to left.
        // A superposition exercises both columns, including the combined phase.
        var reference = simulate(circuit(new Hadamard(0), new Phase(lambda, 0),
                new Ry(theta, 0), new Phase(phi, 0)));
        var actual = simulate(circuit(new Hadamard(0), new U3(theta, phi, lambda, 0)));
        double norm = 0;
        for (int i = 0; i < 2; i++) {
            assertComplex(reference.getEntry(i), actual.getEntry(i));
            double amplitude = actual.getEntry(i).abs();
            norm += amplitude * amplitude;
        }
        assertEquals(1.0, norm, TOL);
    }

    @ParameterizedTest
    @MethodSource("finiteAngles")
    void boundAndSerializedU3MatchesDecomposition(double theta, double phi, double lambda) {
        var template = new ParametricCircuit(1, CONFIG,
                List.of(new ParametricGate("U3", new int[]{0}, "a", "b", "c")));
        var values = Map.of("a", theta, "b", phi, "c", lambda);
        var spec = template.bindToSpec(values);
        var restored = CircuitSpecJson.fromJson(CircuitSpecJson.toJson(spec), CONFIG);
        assertEquals(spec, restored);
        var reference = simulate(circuit(new Phase(lambda, 0), new Ry(theta, 0), new Phase(phi, 0)));
        for (Circuit bound : List.of(template.bind(values), CircuitSpecs.toCircuit(restored, CONFIG))) {
            var actual = simulate(bound);
            for (int i = 0; i < 2; i++) assertComplex(reference.getEntry(i), actual.getEntry(i));
        }
    }

    private static Circuit circuit(Gate... gates) {
        var circuit = new Circuit(1, CONFIG);
        for (Gate gate : gates) {
            var level = new CircuitLevel();
            level.addGate(gate);
            circuit.addLevel(level);
        }
        return circuit;
    }

    private static ComplexVector simulate(Circuit circuit) {
        var simulator = new LocalSimulator(circuit);
        simulator.execute();
        return simulator.getQuantumRegister().getRegisterState();
    }

    private static void assertComplex(Complex expected, Complex actual) {
        assertEquals(expected.getReal(), actual.getReal(), TOL, "real part");
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOL, "imaginary part");
    }
}
