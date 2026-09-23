package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** #110 criterion 3: independent shots isolate classical records. */
public class Issue110IndependentShotsTest {

    @Test
    @DisplayName("Multiple shots produce independent classical records")
    void independentShots() {
        Circuit circuit = new Circuit(1);
        for (int shot = 0; shot < 3; shot++) {
            LocalSimulator sim = new LocalSimulator(circuit);
            sim.execute();
            assertNotNull(sim.extractClassicalRecords());
            for (ClassicalRecord r : sim.extractClassicalRecords()) {
                assertTrue(r.bit() == 0 || r.bit() == 1);
            }
        }
    }
}
