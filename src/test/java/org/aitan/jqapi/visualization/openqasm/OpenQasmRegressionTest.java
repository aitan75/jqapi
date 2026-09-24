package org.aitan.jqapi.visualization.openqasm;

import java.util.List;
import java.util.Map;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class OpenQasmRegressionTest {
    static final String HEADER = "OPENQASM 2.0; include \"qelib1.inc\"; ";

    static CircuitSpec parse(String body) {
        return OpenQasmParser.parse(HEADER + body);
    }

    static List<GateSpec> gates(CircuitSpec spec) {
        return spec.levels().stream().flatMap(level -> level.gates().stream()).toList();
    }

    static LocalSimulator simulate(CircuitSpec spec, double random) {
        var simulator = new LocalSimulator(CircuitSpecs.toCircuit(spec, JQAPIConfig.sequential(24)), () -> random);
        simulator.execute();
        return simulator;
    }

    @Test
    void declarationsAndNonzeroIndexesSurviveWhitespaceAndRepeatedCalls() {
        var spec = parse("qreg data[4]; creg readout[3]; x data[2]; measure data[2]->readout[1];");
        assertEquals(4, spec.numQubits());
        assertEquals(3, spec.numClassicalBits());
        assertEquals(List.of(2), gates(spec).getFirst().targets());
        assertEquals(1, gates(spec).getLast().classicalTarget());
        assertEquals(0, parse("qreg q[2];").numClassicalBits());
        assertEquals(2, parse("qreg q[2];").numQubits());
    }

    @Test
    void mapsRegistersInDeclarationOrderAndExpandsWholeRegisterOperations() {
        var spec = parse("qreg a[1]; qreg b[2]; creg first[1]; creg out[2]; x b; measure b -> out;");
        assertEquals(3, spec.numQubits());
        assertEquals(List.of(1), gates(spec).get(0).targets());
        assertEquals(List.of(2), gates(spec).get(1).targets());
        assertEquals(2, gates(spec).getLast().classicalTarget());
        var simulation = simulate(spec, 0.5);
        assertEquals(1, simulation.getQuantumRegister().getRegisterState().getEntry(3).abs(), 1e-12);
    }

    @ParameterizedTest
    @ValueSource(strings = {"h q[2]", "x q[1]", "y q[0]", "z q[2]", "s q[1]", "t q[0]", "id q[1]",
            "cx q[2],q[0]", "cy q[2], q[1]", "cz q[0],q[2]", "swap q[2], q[0]",
            "cswap q[1],q[2],q[0]", "ccx q[2],q[0],q[1]", "rx(0.75) q[1]", "ry(-0.5) q[2]",
            "rz(1.25) q[0]", "u1(0.9) q[2]", "u3(0.1,0.2,-0.3) q[1]", "reset q[2]"})
    void allSupportedGatesRetainOperandsParametersAndRuntimeBehavior(String operation) {
        var original = parse("qreg q[3]; h q[0]; h q[1]; " + operation + ";");
        String output = OpenQasmSerializer.serialize(original);
        assertTrue(output.startsWith("OPENQASM 2.0;"));
        var restored = OpenQasmParser.parse(output);
        if (operation.startsWith("swap") || operation.startsWith("cswap")) {
            assertEquals(5, gates(restored).size());
            assertFalse(output.contains("swap"));
        } else {
            assertEquals(original, restored);
        }
        var before = simulate(original, 0.4).getQuantumRegister().getRegisterState();
        var after = simulate(restored, 0.4).getQuantumRegister().getRegisterState();
        for (int index = 0; index < 8; index++) {
            assertEquals(before.getEntry(index).getReal(), after.getEntry(index).getReal(), 1e-12);
            assertEquals(before.getEntry(index).getImaginary(), after.getEntry(index).getImaginary(), 1e-12);
        }
    }

    @Test
    void preservesMeasurementResetAndConditionalExecutionForBothOutcomes() {
        var original = parse("qreg q[3]; creg flag[1]; h q[0]; measure q[0]->flag[0]; "
                + "if(flag==1) rx(pi) q[2]; reset q[0]; cx q[2],q[1];");
        var restored = OpenQasmParser.parse(OpenQasmSerializer.serialize(original));
        assertEquals(original, restored);
        for (double random : new double[]{0.1, 0.9}) {
            var before = simulate(original, random);
            var after = simulate(restored, random);
            assertEquals(before.extractClassicalRecords(), after.extractClassicalRecords());
            int bit = before.extractClassicalRecords().getFirst().bit();
            assertEquals(1, after.getQuantumRegister().getRegisterState().getEntry(bit == 0 ? 0 : 3).abs(), 1e-12);
        }
    }

    @Test
    void exportsEachClassicalBitAsAOneBitRegisterForValidQasmConditions() {
        var gate = new GateSpec(GateKind.X, List.of(2), List.of(), Map.of(), null, null, new Condition(2, 1));
        var spec = CircuitSpec.of(3, List.of(new LevelSpec(List.of(gate))), 3);
        String qasm = OpenQasmSerializer.serialize(spec);
        assertTrue(qasm.contains("if(c2==1)"), qasm);
        assertEquals(spec, OpenQasmParser.parse(qasm));
    }

    @Test
    void evaluatesParameterExpressionsWithoutDiscardingAngles() {
        var spec = parse("qreg q[1]; rx(pi / 2) q[0]; u3(-pi, 2*0.25, sin(pi/2)) q[0];");
        assertEquals(Math.PI / 2, gates(spec).get(0).params().get("theta"), 1e-12);
        assertEquals(Map.of("theta", -Math.PI, "phi", 0.5, "lambda", 1.0), gates(spec).get(1).params());
    }

    @Test
    void preservesSourceOrderAndMsbConventionAcrossBarrier() {
        var spec = parse("qreg q[3]; x q[0]; barrier q; cx q[0],q[2]; x q[0];");
        assertEquals(3, spec.levels().size());
        assertEquals(1, simulate(spec, 0.5).getQuantumRegister().getRegisterState().getEntry(1).abs(), 1e-12);
    }

    @ParameterizedTest
    @ValueSource(strings = {"bogus q[0];", "swapAnything q[0];", "x q[9];", "x r[0];", "cx q[0];",
            "cx q[0],q[0];", "rx(bad) q[0];", "rx(1/0) q[0];", "u3(1,2) q[0];", "x q[0]",
            "gate foo a { x a; }", "opaque foo a;", "include \"arbitrary.inc\";", "qreg q[2];",
            "creg c[2]; if(c==1) x q[0];", "creg c[1]; if(c[0]==1) x q[0];",
            "creg c[1]; if(c==2) x q[0];", "creg c[1]; if(c==1) reset q[0];",
            "creg c[1]; if(c==1) measure q[0]->c[0];", "measure q[0];", "barrier unknown;",
            "creg c[1]; measure q -> c;", "reset q[2];"})
    void rejectsUnsupportedOrMalformedInputInsteadOfChangingTheCircuit(String body) {
        assertThrows(IllegalArgumentException.class, () -> parse("qreg q[2]; " + body));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "h q0;", "OPENQASM 3.0; qreg q[1];", "OPENQASM 2.0; qreg q[0];",
            "OPENQASM 2.0; qreg q[999999999999];", "OPENQASM 2.0; qreg q[31];"})
    void requiresValidHeaderAndBoundedRegisters(String source) {
        assertThrows(IllegalArgumentException.class, () -> OpenQasmParser.parse(source));
    }

    @Test
    void rejectsUnsupportedExportRatherThanWritingCommentsOrInventingMetadata() {
        for (var gate : List.of(GateSpec.of(GateKind.GENERIC, 0), GateSpec.of(GateKind.MEASUREMENT, 0),
                GateSpec.of(GateKind.CNOT, 0), GateSpec.of(GateKind.RX, 0),
                new GateSpec(GateKind.RZ, List.of(0), List.of(), Map.of("theta", Double.NaN), null))) {
            assertThrows(IllegalArgumentException.class, () -> OpenQasmSerializer.serialize(
                    CircuitSpec.of(1, List.of(new LevelSpec(List.of(gate))))));
        }
    }
}
