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

class BellTeleportationClassicalTest {
    @Test
    void arbitraryComplexInputTeleportsForAllFourMeasurementBranches() {
        double a = 1 / Math.sqrt(2);
        Complex[][] states = {
            {Complex.ONE, Complex.ZERO}, {Complex.ZERO, Complex.ONE},
            {new Complex(a, 0), new Complex(a, 0)},
            {new Complex(a, 0), new Complex(0, a)},
            {new Complex(Math.sqrt(0.3), 0), new Complex(Math.sqrt(0.7) * Math.cos(0.73), Math.sqrt(0.7) * Math.sin(0.73))}
        };
        Circuit c = circuit(3, 2, new Hadamard(1), new ControlledNot(1, 2),
                new ControlledNot(0, 1), new Hadamard(0), Measurement.into(0, 0), Measurement.into(1, 1),
                new ConditionalGate(new PauliX(2), new Condition(1, 1)),
                new ConditionalGate(new PauliZ(2), new Condition(0, 1)));
        for (Complex[] state : states) {
            for (int branch = 0; branch < 4; branch++) {
                ComplexVector input = new ComplexVector(8);
                input.setEntry(0, state[0]); input.setEntry(4, state[1]);
                double[] draws = {(branch >> 1) == 0 ? 0.1 : 0.9, (branch & 1) == 0 ? 0.1 : 0.9};
                int[] at = {0};
                LocalSimulator sim = new LocalSimulator(c, input, () -> draws[at[0]++]);
                sim.execute();
                assertEquals(branch >> 1, sim.extractClassicalRecords().get(0).bit());
                assertEquals(branch & 1, sim.extractClassicalRecords().get(1).bit());
                ComplexVector output = sim.getQuantumRegister().getRegisterState();
                for (int i = 0; i < 8; i++) {
                    Complex expected = i / 2 == branch ? state[i & 1] : Complex.ZERO;
                    assertEquals(expected.getReal(), output.getEntry(i).getReal(), 1e-10);
                    assertEquals(expected.getImaginary(), output.getEntry(i).getImaginary(), 1e-10);
                }
            }
        }
    }
}
