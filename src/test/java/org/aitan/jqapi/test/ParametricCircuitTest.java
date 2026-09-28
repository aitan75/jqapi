package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ParametricCircuitTest {
    private static final JQAPIConfig CONFIG = JQAPIConfig.sequential(3);
    private static final double TOL = 1e-12;

    private static ParametricCircuit template() {
        return new ParametricCircuit(3, CONFIG, List.of(
                new ParametricGate("RX", new int[]{2, 0}, "angle"),
                new ParametricGate("RY", new int[]{0}, "angle"),
                new ParametricGate("RZ", new int[]{2}, "azimuth"),
                new ParametricGate("PHASE", new int[]{1}, "phase"),
                new ParametricGate("U3", new int[]{0}, "angle", "azimuth", "phase")));
    }

    private static Circuit explicit(double angle, double azimuth, double phase) {
        Circuit circuit = new Circuit(3, CONFIG);
        for (Gate gate : List.of(new Rx(angle, 2, 0), new Ry(angle, 0),
                new Rz(azimuth, 2), new Phase(phase, 1), new U3(angle, azimuth, phase, 0))) {
            CircuitLevel level = new CircuitLevel();
            level.addGate(gate);
            circuit.addLevel(level);
        }
        return circuit;
    }

    private static void assertComplex(Complex expected, Complex actual) {
        assertEquals(expected.getReal(), actual.getReal(), TOL);
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOL);
    }

    private static void assertEquivalent(Circuit expected, Circuit actual) {
        assertEquals(expected.getInputSize(), actual.getInputSize());
        assertEquals(expected.getLevels().size(), actual.getLevels().size());
        for (int level = 0; level < expected.getLevels().size(); level++) {
            var e = expected.getLevels().get(level).getGates();
            var a = actual.getLevels().get(level).getGates();
            assertEquals(e.size(), a.size());
            for (int i = 0; i < e.size(); i++) {
                assertEquals(e.get(i).getType(), a.get(i).getType());
                assertEquals(e.get(i).getIndexes(), a.get(i).getIndexes());
                var matrix = e.get(i).getMatrix();
                for (int row = 0; row < matrix.getRowDimension(); row++) {
                    for (int col = 0; col < matrix.getColumnDimension(); col++) {
                        assertComplex(matrix.getEntry(row, col), a.get(i).getMatrix().getEntry(row, col));
                    }
                }
            }
        }
        var e = new LocalSimulator(expected);
        var a = new LocalSimulator(actual);
        e.execute();
        a.execute();
        for (int i = 0; i < (1 << expected.getInputSize()); i++) {
            assertComplex(e.getQuantumRegister().getRegisterState().getEntry(i),
                    a.getQuantumRegister().getRegisterState().getEntry(i));
        }
    }

    @Test
    void allGateBindingsMatchExplicitMatricesTopologyAndState() {
        assertEquivalent(explicit(0.73, -0.29, 1.17),
                template().bind(Map.of("angle", 0.73, "azimuth", -0.29, "phase", 1.17)));
    }

    @Test
    void specRoundTripPreservesAnglesKindsAndSequentialOverlappingTargets() {
        var spec = template().bindToSpec(Map.of("angle", 7 * Math.PI, "azimuth", -0.29, "phase", 1.17));
        assertEquals(5, spec.levels().size());
        var kinds = List.of(GateKind.RX, GateKind.RY, GateKind.RZ, GateKind.PHASE, GateKind.U3);
        for (int i = 0; i < kinds.size(); i++) {
            assertEquals(1, spec.levels().get(i).gates().size());
            assertEquals(kinds.get(i), spec.levels().get(i).gates().getFirst().kind());
        }
        assertEquals(List.of(2, 0), spec.levels().getFirst().gates().getFirst().targets());
        assertEquals(Map.of("theta", 7 * Math.PI, "phi", -0.29, "lambda", 1.17),
                spec.levels().getLast().gates().getFirst().params());
        var restored = CircuitSpecJson.fromJson(CircuitSpecJson.toJson(spec), CONFIG);
        assertEquals(spec, restored);
        assertEquivalent(explicit(7 * Math.PI, -0.29, 1.17), CircuitSpecs.toCircuit(restored, CONFIG));
    }

    @Test
    void sameNameCanFillEveryU3SlotAndAnotherGate() {
        var template = new ParametricCircuit(1, CONFIG, List.of(
                new ParametricGate("U3", new int[]{0}, "shared", "shared", "shared"),
                new ParametricGate("RX", new int[]{0}, "shared")));
        var spec = template.bindToSpec(Map.of("shared", 0.37));
        assertEquals(Map.of("theta", 0.37, "phi", 0.37, "lambda", 0.37),
                spec.levels().getFirst().gates().getFirst().params());
        assertEquals(Map.of("theta", 0.37), spec.levels().getLast().gates().getFirst().params());
        Circuit expected = new Circuit(1, CONFIG);
        for (Gate gate : List.of(new U3(0.37, 0.37, 0.37, 0), new Rx(0.37, 0))) {
            CircuitLevel level = new CircuitLevel();
            level.addGate(gate);
            expected.addLevel(level);
        }
        assertEquivalent(expected, template.bind(Map.of("shared", 0.37)));
    }

    @Test
    void nonAdjacentTargetsRespectMostSignificantBitConvention() {
        var template = new ParametricCircuit(3, CONFIG,
                List.of(new ParametricGate("RY", new int[]{2, 0}, "rotation")));
        var simulator = new LocalSimulator(template.bind(Map.of("rotation", Math.PI)));
        simulator.execute();
        for (int i = 0; i < 8; i++) {
            assertComplex(i == 5 ? Complex.ONE : Complex.ZERO,
                    simulator.getQuantumRegister().getRegisterState().getEntry(i));
        }
    }

    @Test
    void inputAndAccessorArraysAndGateListCannotMutateTemplate() {
        int[] indexes = {0};
        String[] names = {"rotation"};
        var gate = new ParametricGate("RX", indexes, names);
        var gates = new ArrayList<>(List.of(gate));
        var template = new ParametricCircuit(1, CONFIG, gates);
        var before = template.bindToSpec(Map.of("rotation", 0.3));
        indexes[0] = 2;
        names[0] = "other";
        gate.indexes()[0] = 1;
        gate.params()[0] = "changed";
        gates.clear();
        assertEquals("RX", gate.kind());
        assertEquals(before, template.bindToSpec(Map.of("rotation", 0.3)));
    }

    @Test
    void repeatedBindingsAndSpecsDoNotShareMutableState() {
        var template = template();
        var values = new HashMap<>(Map.of("angle", 0.4, "azimuth", 0.2, "phase", -0.3));
        var first = template.bind(values);
        var savedSpec = template.bindToSpec(values);
        values.put("angle", 0.9);
        var second = template.bind(values);
        assertEquivalent(explicit(0.4, 0.2, -0.3), first);
        assertEquivalent(explicit(0.9, 0.2, -0.3), second);
        assertNotSame(first.getLevels().getFirst(), second.getLevels().getFirst());
        assertNotSame(first.getLevels().getFirst().getGates().getFirst(),
                second.getLevels().getFirst().getGates().getFirst());
        first.getLevels().getFirst().getGates().clear();
        first.getLevels().clear();
        assertEquivalent(explicit(0.9, 0.2, -0.3), second);
        assertEquivalent(explicit(0.4, 0.2, -0.3), CircuitSpecs.toCircuit(savedSpec, CONFIG));
        assertEquivalent(explicit(0.9, 0.2, -0.3), template.bind(values));
        assertThrows(UnsupportedOperationException.class,
                () -> savedSpec.levels().getFirst().gates().getFirst().params().put("theta", 9.0));
    }

    @Test
    void missingExtraAndWrongKeysAreRejectedByBothBindingPaths() {
        var template = new ParametricCircuit(1, CONFIG, List.of(new ParametricGate("RX", new int[]{0}, "angle")));
        for (Map<String, Double> values : List.of(Map.<String, Double>of(), Map.of("other", 0.1),
                Map.of("angle", 0.1, "extra", 0.2))) {
            assertThrows(IllegalArgumentException.class, () -> template.bind(values));
            assertThrows(IllegalArgumentException.class, () -> template.bindToSpec(values));
        }
    }

    @Test
    void nullAndNonFiniteValuesAreRejectedByBothBindingPaths() {
        var template = new ParametricCircuit(1, CONFIG, List.of(new ParametricGate("RX", new int[]{0}, "angle")));
        for (Double value : Arrays.asList(null, Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY)) {
            var values = new HashMap<String, Double>();
            values.put("angle", value);
            assertThrows(IllegalArgumentException.class, () -> template.bind(values));
            assertThrows(IllegalArgumentException.class, () -> template.bindToSpec(values));
        }
        assertThrows(NullPointerException.class, () -> template.bind(null));
        assertThrows(NullPointerException.class, () -> template.bindToSpec(null));
    }

    @Test
    void invalidKindsArityAndNamesAreRejectedAtConstruction() {
        assertThrows(IllegalArgumentException.class, () -> new ParametricGate("UNKNOWN", new int[]{0}, "a"));
        for (String kind : List.of("RX", "RY", "RZ", "PHASE")) {
            assertThrows(IllegalArgumentException.class, () -> new ParametricGate(kind, new int[]{0}));
            assertThrows(IllegalArgumentException.class, () -> new ParametricGate(kind, new int[]{0}, "a", "b"));
        }
        assertThrows(IllegalArgumentException.class, () -> new ParametricGate("U3", new int[]{0}, "a"));
        for (String name : Arrays.asList(null, "", "  ")) {
            assertThrows(IllegalArgumentException.class, () -> new ParametricGate("RX", new int[]{0}, name));
        }
        assertThrows(NullPointerException.class, () -> new ParametricGate(null, new int[]{0}, "a"));
        assertThrows(NullPointerException.class, () -> new ParametricGate("RX", null, "a"));
        assertThrows(NullPointerException.class, () -> new ParametricGate("RX", new int[]{0}, (String[]) null));
    }

    @Test
    void invalidTargetsAndResourceLimitsAreRejectedBeforeBinding() {
        for (int[] indexes : List.of(new int[]{}, new int[]{-1}, new int[]{0, 0})) {
            assertThrows(IllegalArgumentException.class, () -> new ParametricGate("RX", indexes, "a"));
        }
        var gates = List.of(new ParametricGate("RX", new int[]{2}, "a"));
        assertThrows(IllegalArgumentException.class, () -> new ParametricCircuit(2, CONFIG, gates));
        assertThrows(JQApiLimitException.class, () -> new ParametricCircuit(0, CONFIG, List.of()));
        assertThrows(JQApiLimitException.class, () -> new ParametricCircuit(4, CONFIG, List.of()));
        assertThrows(NullPointerException.class, () -> new ParametricCircuit(1, null, List.of()));
        assertThrows(NullPointerException.class, () -> new ParametricCircuit(1, CONFIG, null));
        assertThrows(NullPointerException.class, () -> new ParametricCircuit(1, CONFIG, Arrays.asList((ParametricGate) null)));
    }

    @Test
    void emptyTemplateBindsToEmptyCircuitAndSpec() {
        var template = new ParametricCircuit(3, CONFIG, List.of());
        assertTrue(template.bindToSpec(Map.of()).levels().isEmpty());
        assertTrue(template.bind(Map.of()).getLevels().isEmpty());
        assertSame(CONFIG, template.bind(Map.of()).getConfig());
        assertThrows(IllegalArgumentException.class, () -> template.bind(Map.of("unused", 0.1)));
    }
}
