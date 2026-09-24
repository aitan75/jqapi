package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.render.AsciiCircuitRenderer;
import org.aitan.jqapi.visualization.spec.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CircuitSpecRoundTripV2Test {
    private static final String JSON = """
        {"version":2,"numQubits":2,"numClassicalBits":1,"levels":[
          {"gates":[{"kind":"X","targets":[0],"controls":[]}]},
          {"gates":[{"kind":"MEASUREMENT","targets":[0],"controls":[],"classicalTarget":0}]},
          {"gates":[{"kind":"X","targets":[1],"controls":[],"condition":{"bitIndex":0,"expected":1}}]}
        ]}
        """;

    @Test
    void fullValueEqualityAndExecutionSurviveEveryRoundTrip() {
        CircuitSpec original = CircuitSpecJson.fromJson(JSON);
        assertEquals(original, CircuitSpecJson.fromJson(CircuitSpecJson.toJson(original)));
        assertEquals(original, CircuitSpecs.toSpec(CircuitSpecs.toCircuit(original)));
        LocalSimulator sim = new LocalSimulator(CircuitSpecs.toCircuit(original)); sim.execute();
        assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(3).abs(), 1e-12);
        assertThrows(IllegalArgumentException.class, () -> new AsciiCircuitRenderer().draw(original));
    }

    @Test
    void legacySpecsAndMigrationKeepMeaning() {
        CircuitSpec v1 = CircuitSpecJson.fromJson("{\"version\":1,\"numQubits\":1,\"levels\":[]}");
        assertEquals(1, v1.version());
        assertEquals(0, v1.numClassicalBits());
        assertEquals(v1, CircuitSpecJson.fromJson(CircuitSpecJson.toJson(v1)));
        assertEquals(v1.levels(), CircuitSpec.migrateV1(v1).levels());
        assertEquals(2, CircuitSpec.migrateV1(v1).version());
        assertThrows(IllegalArgumentException.class, () -> CircuitSpec.migrateV1(CircuitSpec.migrateV1(v1)));
        assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(JSON.replace("\"version\":2", "\"version\":1")));
    }

    @Test
    void rejectsInvalidVersionsReferencesValuesAndPrototypeFields() {
        for (String bad : List.of(
                JSON.replace("\"version\":2", "\"version\":999"),
                JSON.replace("\"expected\":1", "\"expected\":2"),
                JSON.replace("\"bitIndex\":0", "\"bitIndex\":1"),
                JSON.replace("\"classicalTarget\":0", "\"classicalTarget\":1"),
                JSON.replace("\"classicalTarget\":0", "\"classicalTarget\":-1"),
                JSON.replace("\"numClassicalBits\":1", "\"numClassicalBits\":0"),
                JSON.replace("\"classicalTarget\":0", "\"classicalTarget\":null"),
                JSON.replace("\"numClassicalBits\":1", "\"measurementRecords\":[]"),
                JSON.replace("\"numClassicalBits\":1", "\"conditions\":[]"),
                JSON.replace("\"MEASUREMENT\"", "\"X\""))) {
            assertThrows(IllegalArgumentException.class, () -> CircuitSpecJson.fromJson(bad), bad);
        }
        assertThrows(RuntimeException.class, () -> CircuitSpecJson.fromJson(JSON.replace("\"numClassicalBits\":1", "\"numClassicalBits\":3"), JQAPIConfig.sequential(2)));
        assertThrows(IllegalArgumentException.class, () -> new CircuitSpec(3, 1, List.of()));
        assertThrows(IllegalArgumentException.class, () -> new CircuitSpec(2, 1, List.of(), -1));
        assertThrows(IllegalArgumentException.class, () -> GateSpec.of(GateKind.RESET, 0).withClassical(null, new Condition(0, 0)));
        assertThrows(IllegalArgumentException.class, () -> GateSpec.of(GateKind.MEASUREMENT, 0, 1).withClassical(0, null));
        assertThrows(IllegalArgumentException.class, () -> new GateSpec(GateKind.MEASUREMENT,
                List.of(0), List.of(1), java.util.Map.of(), null, 0, null));
    }

    @Test
    void sameLevelClassicalDependenciesRejectBeforeConversion() {
        GateSpec measure = GateSpec.of(GateKind.MEASUREMENT, 0).withClassical(0, null);
        GateSpec conditional = GateSpec.of(GateKind.X, 1).withClassical(null, new Condition(0, 1));
        assertThrows(IllegalArgumentException.class, () -> CircuitSpec.of(2, List.of(new LevelSpec(List.of(measure, conditional))), 1));
        assertThrows(IllegalArgumentException.class, () -> CircuitSpec.of(2, List.of(new LevelSpec(List.of(measure, GateSpec.of(GateKind.MEASUREMENT, 1).withClassical(0, null)))), 1));
        assertThrows(IllegalArgumentException.class, () -> new CircuitSpec(1, 2, List.of(new LevelSpec(List.of(conditional)))));
    }

    @Test
    void conditionalIdentityAlsoSurvivesRoundTrip() {
        CircuitSpec spec = CircuitSpec.of(1, List.of(new LevelSpec(List.of(
                GateSpec.of(GateKind.IDENTITY, 0).withClassical(null, new Condition(0, 0))))), 1);
        assertEquals(spec, CircuitSpecs.toSpec(CircuitSpecs.toCircuit(spec)));
        assertThrows(RuntimeException.class, () -> CircuitSpecs.toCircuit(CircuitSpec.of(1, List.of(), 3), JQAPIConfig.sequential(2)));
    }
}
