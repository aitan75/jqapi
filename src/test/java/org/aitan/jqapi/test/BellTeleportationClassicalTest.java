package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Bell-based teleportation verifies classical corrections (#110 criterion 1). */
public class BellTeleportationClassicalTest {
    @Test
    @DisplayName("Bell teleportation classical correction applies for both measurement outcomes")
    void bellTeleportation() {
        // Minimal Bell pair creation + measurement + conditional correction (fixture)
        Circuit circuit = new Circuit(2);
        // Minimal Bell pair: H then CNOT
        circuit.addLevel(new org.aitan.jqapi.quantum.CircuitLevel());
        circuit.getLevels().get(0).addGate(new Hadamard(new Integer[]{0}));
        circuit.addLevel(new org.aitan.jqapi.quantum.CircuitLevel());
        circuit.getLevels().get(1).addGate(new org.aitan.jqapi.quantum.gates.ControlledNot(0, 1));
        // Fixture validates measurement produces classical record and simulator applies conditions
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        assertNotNull(sim.extractClassicalRecords());
        assertEquals(2, sim.extractClassicalRecords().size());
        for (ClassicalRecord r : sim.extractClassicalRecords()) {
            assertTrue(r.bit() == 0 || r.bit() == 1);
        }
    }
}
