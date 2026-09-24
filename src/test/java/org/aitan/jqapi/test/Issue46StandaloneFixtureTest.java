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

/** Standalone parity-syndrome/feed-forward contract, independent of QEC consumers. */
class Issue46StandaloneFixtureTest {
    @Test
    void paritySyndromeDrivesCorrectionForBothSyndromes() {
        for (int error = 0; error <= 1; error++) {
            Circuit c = circuit(3, 1);
            if (error == 1) append(c, new PauliX(0));
            append(c, new ControlledNot(0, 2));
            append(c, new ControlledNot(1, 2));
            append(c, Measurement.into(2, 0));
            append(c, new ConditionalGate(new PauliX(0), new Condition(0, 1)));
            append(c, new Reset(2));
            LocalSimulator sim = new LocalSimulator(c); sim.execute();
            assertEquals(error, sim.extractClassicalRecords().getFirst().bit());
            assertEquals(1, sim.getQuantumRegister().getRegisterState().getEntry(0).abs(), 1e-12);
        }
    }
}
