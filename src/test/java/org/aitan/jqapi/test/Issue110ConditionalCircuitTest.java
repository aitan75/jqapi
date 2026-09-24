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

class Issue110ConditionalCircuitTest {
    @Test
    void measuredOutcomesControlXOnNonzeroTargetBeforeLaterGates() {
        for (int outcome = 0; outcome <= 1; outcome++) {
            for (int expected = 0; expected <= 1; expected++) {
                Circuit c = circuit(3, 1);
                if (outcome == 1) append(c, new PauliX(0));
                append(c, Measurement.into(0, 0));
                append(c, new ConditionalGate(new PauliX(2), new Condition(0, expected)));
                append(c, new ControlledNot(2, 1));
                LocalSimulator sim = new LocalSimulator(c);
                sim.execute();
                int corrected = outcome == expected ? 1 : 0;
                int basis = (outcome << 2) | (corrected << 1) | corrected;
                assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(basis).abs(), 1e-12);
                assertEquals(List.of(new ClassicalRecord(outcome)), sim.extractClassicalRecords());
            }
        }
    }

    @Test
    void conditionalZChangesPhaseForBothMeasurementOutcomes() {
        for (int outcome = 0; outcome <= 1; outcome++) {
            Circuit c = circuit(2, 1);
            if (outcome == 1) append(c, new PauliX(0));
            append(c, Measurement.into(0, 0));
            append(c, new Hadamard(1));
            append(c, new ConditionalGate(new PauliZ(1), new Condition(0, outcome)));
            append(c, new Hadamard(1));
            LocalSimulator sim = new LocalSimulator(c);
            sim.execute();
            assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry((outcome << 1) | 1).abs(), 1e-12);
        }
    }

    @Test
    void predicateUsesSnapshotAndRejectsInvalidInputs() {
        ConditionPredicate pred = new ConditionPredicate(new Condition(0, 1));
        assertTrue(pred.matches(List.of(new ClassicalRecord(1))));
        assertFalse(pred.matches(List.of(new ClassicalRecord(0))));
        assertThrows(IllegalArgumentException.class, () -> pred.matches(List.of()));
        assertThrows(IllegalArgumentException.class, () -> new ClassicalRecord(7));
        assertThrows(IllegalArgumentException.class, () -> new Condition(-1, 0));
        assertThrows(IllegalArgumentException.class, () -> new Condition(30, 0));
        assertThrows(IllegalArgumentException.class, () -> new Condition(0, 2));
        assertThrows(NullPointerException.class, () -> new ConditionalGate(new PauliX(0), null));
        assertThrows(IllegalArgumentException.class, () -> new ConditionalGate(new Measurement(0), new Condition(0, 0)));
        assertThrows(IllegalArgumentException.class, () -> new ConditionalGate(new Reset(0), new Condition(0, 0)));
        assertThrows(IllegalArgumentException.class, () -> new ConditionalGate(new ConditionalGate(new PauliX(0), new Condition(0, 0)), new Condition(0, 0)));
    }
}
