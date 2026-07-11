package org.aitan.jqapi.test.visualization;

import java.util.List;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledSwap;
import org.aitan.jqapi.quantum.gates.ControlledY;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.utils.Constants;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class CircuitSpecsToSpecTest {

    private static GateSpec onlyGate(CircuitSpec spec, int level) {
        // idle wires (Identity) are dropped by toSpec, leaving the real gate
        List<GateSpec> gates = spec.levels().get(level).gates();
        assertEquals(1, gates.size(), "expected a single non-identity gate at level " + level);
        return gates.get(0);
    }

    private static ComplexVector run(Circuit circuit) {
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        return sim.getQuantumRegister().getRegisterState();
    }

    @Test
    void toSpec_bell_splitsControlAndTarget() {
        Circuit c = new Circuit(2);
        CircuitLevel l1 = new CircuitLevel();
        l1.addGate(new Hadamard(0));
        CircuitLevel l2 = new CircuitLevel();
        l2.addGate(new ControlledNot(0, 1));
        c.addLevel(l1);
        c.addLevel(l2);

        CircuitSpec spec = CircuitSpecs.toSpec(c);

        assertEquals(2, spec.numQubits());
        GateSpec h = onlyGate(spec, 0);
        assertEquals(GateKind.H, h.kind());
        assertEquals(List.of(0), h.targets());
        assertTrue(h.controls().isEmpty());

        GateSpec cnot = onlyGate(spec, 1);
        assertEquals(GateKind.CNOT, cnot.kind());
        assertEquals(List.of(0), cnot.controls());
        assertEquals(List.of(1), cnot.targets());
    }

    @Test
    void toSpec_toffoli_twoControlsOneTarget() {
        Circuit c = new Circuit(3);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new Toffoli(0, 1, 2));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.TOFFOLI, g.kind());
        assertEquals(List.of(0, 1), g.controls());
        assertEquals(List.of(2), g.targets());
    }

    @Test
    void toSpec_swap_targetsOnly() {
        Circuit c = new Circuit(2);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new Swap(0, 1));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.SWAP, g.kind());
        assertTrue(g.controls().isEmpty());
        assertEquals(List.of(0, 1), g.targets());
    }

    @Test
    void toSpec_parametric_degradesToGeneric() {
        Circuit c = new Circuit(1);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new Rx(Math.PI / 4, 0));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.GENERIC, g.kind(), "lossy parametric gate must degrade to GENERIC");
        assertEquals(List.of(0), g.targets());
        assertNotNull(g.matrix(), "GENERIC degradation must carry the unitary");
    }

    @Test
    void toSpec_multiControlled_degradesToGeneric() {
        ComplexMatrix x = Constants.PAULI_X_MATRIX;
        Circuit c = new Circuit(3);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new MultiControlled(x, 2, 0, 1, 2));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.GENERIC, g.kind(), "MultiControlled control-count is unknown, must degrade to GENERIC");
        assertNotNull(g.matrix());
    }

    @Test
    void toSpec_controlledZAndY_splitControlAndTarget() {
        Circuit c = new Circuit(2);
        CircuitLevel l1 = new CircuitLevel();
        l1.addGate(new ControlledZ(0, 1));
        CircuitLevel l2 = new CircuitLevel();
        l2.addGate(new ControlledY(1, 0));
        c.addLevel(l1);
        c.addLevel(l2);

        GateSpec cz = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.CZ, cz.kind());
        assertEquals(List.of(0), cz.controls());
        assertEquals(List.of(1), cz.targets());

        GateSpec cy = onlyGate(CircuitSpecs.toSpec(c), 1);
        assertEquals(GateKind.CY, cy.kind());
        assertEquals(List.of(1), cy.controls());
        assertEquals(List.of(0), cy.targets());
    }

    @Test
    void toSpec_controlledSwap_oneControlTwoTargets() {
        Circuit c = new Circuit(3);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new ControlledSwap(0, 1, 2));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.CSWAP, g.kind());
        assertEquals(List.of(0), g.controls());
        assertEquals(List.of(1, 2), g.targets());
    }

    @Test
    void toSpec_oracle_preservesKindAndMatrix() {
        Circuit c = new Circuit(1);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new Oracle(Constants.PAULI_X_MATRIX, 0));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.ORACLE, g.kind());
        assertEquals(List.of(0), g.targets());
        assertTrue(g.controls().isEmpty());
        assertNotNull(g.matrix());
    }

    @Test
    void toSpec_genericGate_preservesKindAndMatrix() {
        Circuit c = new Circuit(1);
        CircuitLevel l = new CircuitLevel();
        l.addGate(new GenericGate(Constants.PAULI_X_MATRIX, 1, 0));
        c.addLevel(l);

        GateSpec g = onlyGate(CircuitSpecs.toSpec(c), 0);
        assertEquals(GateKind.GENERIC, g.kind());
        assertEquals(List.of(0), g.targets());
        assertNotNull(g.matrix());
    }

    @Test
    void roundTrip_toSpecThenToCircuit_preservesState() {
        // Mix of exact (H, CNOT, Toffoli) and lossy-degraded (Rx) gates: even after
        // Rx degrades to GENERIC, rebuilding from its matrix yields the same unitary.
        Circuit original = new Circuit(3);
        CircuitLevel l1 = new CircuitLevel();
        l1.addGate(new Hadamard(0));
        l1.addGate(new Rx(Math.PI / 5, 2));
        CircuitLevel l2 = new CircuitLevel();
        l2.addGate(new ControlledNot(0, 1));
        CircuitLevel l3 = new CircuitLevel();
        l3.addGate(new Toffoli(0, 1, 2));
        original.addLevel(l1);
        original.addLevel(l2);
        original.addLevel(l3);

        Circuit rebuilt = CircuitSpecs.toCircuit(CircuitSpecs.toSpec(original));

        ComplexVector a = run(original);
        ComplexVector b = run(rebuilt);
        assertEquals(a.getDimension(), b.getDimension());
        for (int i = 0; i < a.getDimension(); i++) {
            assertEquals(a.getEntry(i).getReal(), b.getEntry(i).getReal(), 1e-9, "re@" + i);
            assertEquals(a.getEntry(i).getImaginary(), b.getEntry(i).getImaginary(), 1e-9, "im@" + i);
        }
    }
}
