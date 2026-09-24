package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.classical.*;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.aitan.jqapi.test.ClassicalTestSupport.*;

class Issue110ClassicalDependenciesTest {
    @Test
    void unwrittenBitsAreZeroAndLaterWritesReplaceEarlierValues() {
        Circuit c = circuit(2, 2, new ConditionalGate(new PauliX(1), new Condition(1, 0)),
                new PauliX(0), Measurement.into(0, 0), new PauliX(0), Measurement.into(0, 0));
        LocalSimulator sim = new LocalSimulator(c);
        sim.execute();
        assertEquals(List.of(new ClassicalRecord(0), new ClassicalRecord(0)), sim.extractClassicalRecords());
        assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(1).abs(), 1e-12);
        assertEquals(List.of(), new LocalSimulator(new Circuit(1)).extractClassicalRecords());
    }

    @Test
    void quantumResetAndFinalReadoutPreserveStoredOutcomeAndSnapshots() {
        Circuit c = circuit(1, 1, new PauliX(0), Measurement.into(0, 0), new Reset(0));
        LocalSimulator sim = new LocalSimulator(c);
        sim.execute();
        var records = sim.extractClassicalRecords();
        sim.getQuantumRegister().measure();
        assertEquals(1, records.getFirst().bit());
        assertEquals(records, sim.extractClassicalRecords());
        assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(0).abs(), 1e-12);
        assertThrows(UnsupportedOperationException.class, () -> records.clear());
        assertEquals(0, new LocalSimulator(c).extractClassicalRecords().getFirst().bit());
    }

    @Test
    void sameLevelReadWriteAndRepeatedWritesAreRejectedInEitherOrder() {
        for (boolean reversed : new boolean[]{false, true}) {
            Gate write = Measurement.into(0, 0);
            Gate read = new ConditionalGate(new PauliX(1), new Condition(0, 1));
            assertThrows(IllegalArgumentException.class, () -> append(circuit(2, 1), reversed ? read : write, reversed ? write : read));
        }
        assertThrows(IllegalArgumentException.class, () -> append(circuit(2, 1), Measurement.into(0, 0), Measurement.into(1, 0)));
        Circuit independent = circuit(2, 1);
        append(independent, new ConditionalGate(new PauliX(0), new Condition(0, 0)), new ConditionalGate(new PauliX(1), new Condition(0, 0)));
        LocalSimulator sim = new LocalSimulator(independent); sim.execute();
        assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(3).abs(), 1e-12);
    }

    @Test
    void invalidReferencesAndBudgetAreRejectedEvenAfterMutableEdits() {
        assertThrows(IllegalArgumentException.class, () -> circuit(1, 0, Measurement.into(0, 0)));
        assertThrows(IllegalArgumentException.class, () -> circuit(1, 1, new ConditionalGate(new PauliX(0), new Condition(1, 0))));
        assertThrows(IllegalArgumentException.class, () -> Measurement.into(0, -1));
        assertThrows(IllegalArgumentException.class, () -> Measurement.into(30, 0));
        assertThrows(RuntimeException.class, () -> new Circuit(1, 3, JQAPIConfig.sequential(2)));
        Circuit c = circuit(2, 1, Measurement.into(0, 0));
        LocalSimulator sim = new LocalSimulator(c);
        c.getLevels().getFirst().getGates().clear();
        c.getLevels().getFirst().getGates().add(new ConditionalGate(new PauliX(0), new Condition(1, 0)));
        assertThrows(IllegalArgumentException.class, sim::execute);
    }
}
