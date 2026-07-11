package org.aitan.jqapi.test.visualization;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.visualization.render.AsciiCircuitRenderer;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

/**
 * Golden-master (exact-string) tests for {@link AsciiCircuitRenderer}. The
 * renderer is deterministic, so any drift in layout or glyphs breaks these.
 */
public class AsciiCircuitRendererTest {

    private static GateSpec ctrl(GateKind k, int control, int target) {
        return new GateSpec(k, List.of(target), List.of(control), Map.of(), null);
    }

    private static String draw(CircuitSpec spec) {
        return new AsciiCircuitRenderer().draw(spec);
    }

    private static String drawAscii(CircuitSpec spec) {
        return new AsciiCircuitRenderer(true).draw(spec);
    }

    @Test
    void singleHadamard() {
        CircuitSpec spec = CircuitSpec.of(1, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0)))));
        assertEquals("q0: ─[H]", draw(spec));
    }

    @Test
    void bellControlAndTarget() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(ctrl(GateKind.CNOT, 0, 1)))));
        assertEquals(
                "q0: ─[H]──●─\n"
                + "          │\n"
                + "q1: ──────⊕─",
                draw(spec));
    }

    @Test
    void multiLevelMultiQubit() {
        CircuitSpec spec = CircuitSpec.of(3, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0), GateSpec.of(GateKind.X, 2))),
                new LevelSpec(List.of(ctrl(GateKind.CNOT, 0, 1))),
                new LevelSpec(List.of(GateSpec.of(GateKind.Z, 2)))));
        assertEquals(
                "q0: ─[H]──●─────\n"
                + "          │\n"
                + "q1: ──────⊕─────\n"
                + "\n"
                + "q2: ─[X]─────[Z]",
                draw(spec));
    }

    @Test
    void nonAdjacentControlTarget() {
        CircuitSpec spec = CircuitSpec.of(3, List.of(
                new LevelSpec(List.of(ctrl(GateKind.CNOT, 0, 2)))));
        assertEquals(
                "q0: ──●─\n"
                + "      │\n"
                + "q1: ──┼─\n"
                + "      │\n"
                + "q2: ──⊕─",
                draw(spec));
    }

    @Test
    void singleQubitReplicatedAcrossWires() {
        CircuitSpec spec = CircuitSpec.of(3, List.of(
                new LevelSpec(List.of(
                        GateSpec.of(GateKind.H, 0),
                        GateSpec.of(GateKind.H, 1),
                        GateSpec.of(GateKind.H, 2)))));
        assertEquals(
                "q0: ─[H]\n"
                + "\n"
                + "q1: ─[H]\n"
                + "\n"
                + "q2: ─[H]",
                draw(spec));
    }

    @Test
    void asciiOnlyFallback() {
        CircuitSpec spec = CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
                new LevelSpec(List.of(ctrl(GateKind.CNOT, 0, 1)))));
        assertEquals(
                "q0: -[H]--*-\n"
                + "          |\n"
                + "q1: -----(+)",
                drawAscii(spec));
    }

    @Test
    void drawFromCircuitUsesToSpec() {
        Circuit c = new Circuit(2);
        CircuitLevel l1 = new CircuitLevel();
        l1.addGate(new Hadamard(0));
        CircuitLevel l2 = new CircuitLevel();
        l2.addGate(new ControlledNot(0, 1));
        c.addLevel(l1);
        c.addLevel(l2);
        assertEquals(
                "q0: ─[H]──●─\n"
                + "          │\n"
                + "q1: ──────⊕─",
                new AsciiCircuitRenderer().draw(c));
    }
}
