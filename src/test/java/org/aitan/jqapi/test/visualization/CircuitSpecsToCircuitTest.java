package org.aitan.jqapi.test.visualization;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class CircuitSpecsToCircuitTest {

    private static final double TOL = 1e-9;

    private static ComplexVector run(Circuit circuit) {
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        return sim.getQuantumRegister().getRegisterState();
    }

    private static void assertSameState(ComplexVector a, ComplexVector b) {
        assertEquals(a.getDimension(), b.getDimension());
        for (int i = 0; i < a.getDimension(); i++) {
            assertEquals(a.getEntry(i).getReal(), b.getEntry(i).getReal(), TOL, "re@" + i);
            assertEquals(a.getEntry(i).getImaginary(), b.getEntry(i).getImaginary(), TOL, "im@" + i);
        }
    }

    @Test
    void toCircuit_bell_matchesApiBuilt() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(new GateSpec(GateKind.CNOT, List.of(1), List.of(0), Map.of(), null)))));

        Circuit api = new Circuit(2);
        CircuitLevel l1 = new CircuitLevel();
        l1.addGate(new Hadamard(0));
        CircuitLevel l2 = new CircuitLevel();
        l2.addGate(new ControlledNot(0, 1));
        api.addLevel(l1);
        api.addLevel(l2);

        assertSameState(run(api), run(CircuitSpecs.toCircuit(spec)));
    }

    @Test
    void toCircuit_parametric_preservesAngle() {
        double theta = Math.PI / 3;
        CircuitSpec spec = CircuitSpec.of(1, List.of(
                new LevelSpec(List.of(new GateSpec(GateKind.RX, List.of(0), List.of(), Map.of("theta", theta), null)))));

        Circuit api = new Circuit(1);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new Rx(theta, 0));
        api.addLevel(l);

        assertSameState(run(api), run(CircuitSpecs.toCircuit(spec)));
    }
}
