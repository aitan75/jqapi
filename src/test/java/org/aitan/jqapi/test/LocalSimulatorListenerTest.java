package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.List;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.aitan.jqapi.test.ClassicalTestSupport.*;

class LocalSimulatorListenerTest {
    private static Circuit conditionalCircuit() {
        return circuit(2, 1, new Hadamard(0), Measurement.into(0, 0),
                new ConditionalGate(new PauliX(1), new Condition(0, 1)));
    }

    @Test
    void reportsOperationsInOrderSkippingIdentityPadding() {
        List<String> events = new ArrayList<>();
        new LocalSimulator(conditionalCircuit(), () -> 0.1)
                .execute((level, gate, op, applied) -> events.add(level + ":" + gate + ":" + op.getType() + ":" + applied));
        assertEquals(3, events.size());
        assertTrue(events.get(0).startsWith("0:"));
        assertTrue(events.get(1).startsWith("1:"));
        assertTrue(events.get(2).startsWith("2:") && events.get(2).endsWith(":false"), "unmet condition is reported as skipped");
    }

    @Test
    void metConditionIsReportedAsApplied() {
        List<Boolean> applied = new ArrayList<>();
        new LocalSimulator(conditionalCircuit(), () -> 0.9).execute((l, g, op, a) -> applied.add(a));
        assertEquals(List.of(true, true, true), applied);
    }

    @Test
    void listenerExecutionMatchesPlainExecution() {
        LocalSimulator plain = new LocalSimulator(conditionalCircuit(), () -> 0.9);
        plain.execute();
        LocalSimulator observed = new LocalSimulator(conditionalCircuit(), () -> 0.9);
        observed.execute((l, g, op, a) -> { });
        assertEquals(plain.extractClassicalRecords(), observed.extractClassicalRecords());
        for (int i = 0; i < 4; i++) {
            assertEquals(plain.getQuantumRegister().getRegisterState().getEntry(i).getReal(),
                    observed.getQuantumRegister().getRegisterState().getEntry(i).getReal(), 0);
        }
    }
}
