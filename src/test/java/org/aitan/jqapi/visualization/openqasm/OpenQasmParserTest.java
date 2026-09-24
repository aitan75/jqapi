package org.aitan.jqapi.visualization.openqasm;

import java.util.List;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.junit.jupiter.api.Test;
import static org.aitan.jqapi.visualization.openqasm.OpenQasmRegressionTest.*;
import static org.junit.jupiter.api.Assertions.*;

class OpenQasmParserTest {
    @Test
    void parseDeclaredIdleCircuit() {
        var spec = parse("qreg q[2];");
        assertEquals(2, spec.numQubits());
        assertEquals(0, spec.numClassicalBits());
        assertTrue(spec.levels().isEmpty());
    }

    @Test
    void parseSingleHadamard() {
        var spec = parse("qreg q[1]; h q[0];");
        assertEquals(1, spec.numQubits());
        assertEquals(1, spec.levels().size());
        var gate = gates(spec).getFirst();
        assertEquals(GateKind.H, gate.kind());
        assertEquals(List.of(0), gate.targets());
        assertTrue(gate.controls().isEmpty());
        assertTrue(gate.params().isEmpty());
        assertNull(gate.matrix());
        assertNull(gate.classicalTarget());
        assertNull(gate.condition());
    }

    @Test
    void roundTripPreservesSimpleCircuit() {
        var first = parse("qreg q[1]; creg c[1]; h q[0]; measure q[0] -> c[0];");
        assertEquals(first, OpenQasmParser.parse(OpenQasmSerializer.serialize(first)));
    }

    @Test
    void parseMeasurementWithClassicalTarget() {
        var spec = parse("qreg q[1]; creg c[1]; measure q[0] -> c[0];");
        assertEquals(1, spec.numClassicalBits());
        var gate = gates(spec).getFirst();
        assertEquals(GateKind.MEASUREMENT, gate.kind());
        assertEquals(List.of(0), gate.targets());
        assertEquals(0, gate.classicalTarget());
    }

    @Test
    void parseConditionalIf() {
        var spec = parse("qreg q[1]; creg c[1]; if(c==1) x q[0];");
        var gate = gates(spec).getFirst();
        assertEquals(GateKind.X, gate.kind());
        assertNotNull(gate.condition());
        assertEquals(0, gate.condition().bitIndex());
        assertEquals(1, gate.condition().expected());
    }
}
