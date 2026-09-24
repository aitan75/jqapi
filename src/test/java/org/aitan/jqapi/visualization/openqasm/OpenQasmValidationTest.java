package org.aitan.jqapi.visualization.openqasm;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.visualization.spec.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.aitan.jqapi.visualization.openqasm.OpenQasmRegressionTest.*;
import static org.junit.jupiter.api.Assertions.*;

class OpenQasmValidationTest {
    @Test
    void parseCallsAreIsolatedEvenWhenConcurrent() throws Exception {
        try (var executor = Executors.newFixedThreadPool(4)) {
            var futures = IntStream.range(1, 20).mapToObj(size -> executor.submit(() -> {
                var result = parse("qreg q[" + size + "]; creg c[" + size + "]; x q[0];");
                assertEquals(size, result.numQubits());
                assertEquals(size, result.numClassicalBits());
            })).toList();
            for (var future : futures) future.get();
        }
    }

    @ParameterizedTest
    @CsvSource(value = {"2+3*4;14", "(2+3)*4;20", "-2^2;-4", "2^3^2;512", "4-1-2;1",
            "1e-3+0.5;0.501", "cos(0);1", "tan(0);0", "ln(exp(1));1", "sqrt(9);3"}, delimiter = ';')
    void evaluatesExpressionsWithPrecedence(String expression, double expected) {
        var spec = parse("qreg q[1]; rx(" + expression + ") q[0];");
        assertEquals(expected, gates(spec).getFirst().params().get("theta"), 1e-12);
    }

    @Test
    void handlesBuiltinsAndAliasesWithoutChangingTheirMatrices() {
        var builtin = OpenQasmParser.parse("OPENQASM 2.0; qreg q[2]; U(pi,0,pi) q[0]; CX q[0],q[1];");
        assertEquals(1, simulate(builtin, 0.5).getQuantumRegister().getRegisterState().getEntry(3).abs(), 1e-12);
        var aliases = parse("qreg q[1]; u2(0,pi) q[0]; sdg q[0]; tdg q[0];");
        assertEquals(Math.PI / 2, gates(aliases).getFirst().params().get("theta"));
        assertEquals(-Math.PI / 2, gates(aliases).get(1).params().get("theta"));
        assertEquals(-Math.PI / 4, gates(aliases).get(2).params().get("theta"));
    }

    @Test
    void expandsBroadcastsAndKeepsClassicalAddressesAcrossRegisters() {
        var spec = parse("qreg a[2]; qreg b[2]; creg c[2]; creg flag[1]; x a[1]; "
                + "cx a,b; cx a[1],b[0]; measure b->c; measure a[1]->flag[0]; if(flag==1) x a[0];");
        assertEquals(1, simulate(spec, 0.5).getQuantumRegister().getRegisterState().getEntry(15).abs(), 1e-12);
        assertEquals(2, gates(spec).getLast().condition().bitIndex());
    }

    @Test
    void commentsAndNewlinesDoNotSplitInstructions() {
        var spec = OpenQasmParser.parse("// comment\r\n" + HEADER
                + "qreg q[2]; x // target follows\nq[1];\n// tail");
        assertEquals(List.of(1), gates(spec).getFirst().targets());
    }

    @Test
    void configuredBudgetsBoundBothRegisterKindsAndExport() {
        var small = JQAPIConfig.sequential(2);
        assertThrows(JQApiLimitException.class, () -> OpenQasmParser.parse(HEADER + "qreg a[2]; qreg b[1];", small));
        assertThrows(JQApiLimitException.class, () -> OpenQasmParser.parse(HEADER + "qreg q[1]; creg c[3];", small));
        assertThrows(JQApiLimitException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(3, List.of()), small));
        assertThrows(JQApiLimitException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(1, List.of(), 3), small));
        assertThrows(JQApiLimitException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(0, List.of())));
        var max = JQAPIConfig.sequential(30);
        var spec = OpenQasmParser.parse(HEADER + "qreg q[30]; creg c[30];", max);
        assertEquals(spec, OpenQasmParser.parse(OpenQasmSerializer.serialize(spec, max), max));
    }

    @Test
    void rejectsExcessiveSourceTokensExpressionDepthAndExpandedOperationCount() {
        assertThrows(JQApiLimitException.class, () -> OpenQasmParser.parse(" ".repeat(OpenQasmParser.MAX_SOURCE_LENGTH + 1)));
        assertThrows(JQApiLimitException.class, () -> parse("qreg " + "q".repeat(257) + "[1];"));
        assertThrows(JQApiLimitException.class, () -> parse("qreg q[1]; rx(" + "(".repeat(70) + "0" + ")".repeat(70) + ") q[0];"));
        String operations = "x q;".repeat(OpenQasmParser.MAX_OPERATIONS / 2 + 1);
        assertThrows(JQApiLimitException.class, () -> parse("qreg q[2];" + operations));
        var level = new LevelSpec(List.of(GateSpec.of(GateKind.X, 0, 1)));
        var levels = java.util.Collections.nCopies(OpenQasmParser.MAX_OPERATIONS / 2 + 1, level);
        assertThrows(JQApiLimitException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(2, levels)));
    }

    @Test
    void exportsParallelSingleFamilyTargetsWithEquivalentExecution() {
        var spec = CircuitSpec.of(3, List.of(new LevelSpec(List.of(GateSpec.of(GateKind.X, 0, 2), GateSpec.of(GateKind.H, 1)))));
        var restored = OpenQasmParser.parse(OpenQasmSerializer.serialize(spec));
        assertEquals(3, restored.levels().size());
        assertEquals(Math.sqrt(0.5), simulate(restored, 0.5).getQuantumRegister().getRegisterState().getEntry(5).abs(), 1e-12);
        assertEquals(Math.sqrt(0.5), simulate(restored, 0.5).getQuantumRegister().getRegisterState().getEntry(7).abs(), 1e-12);
    }

    @ParameterizedTest
    @ValueSource(strings = {"swap q[0],q[2]", "cswap q[1],q[0],q[2]"})
    void swapDecompositionsPreserveBothClassicalBranches(String operation) {
        for (int expected = 0; expected <= 1; expected++) {
            var original = parse("qreg q[3]; creg c[1]; x q[0]; x q[1]; if(c==" + expected + ") " + operation + ";");
            var restored = OpenQasmParser.parse(OpenQasmSerializer.serialize(original));
            assertEquals(3, gates(restored).stream().filter(gate -> gate.condition() != null).count());
            var before = simulate(original, 0.5).getQuantumRegister().getRegisterState();
            var after = simulate(restored, 0.5).getQuantumRegister().getRegisterState();
            for (int i = 0; i < before.getDimension(); i++) {
                assertEquals(before.getEntry(i).getReal(), after.getEntry(i).getReal(), 1e-12);
                assertEquals(before.getEntry(i).getImaginary(), after.getEntry(i).getImaginary(), 1e-12);
            }
        }
    }

    @Test
    void exportsLegacyUnitarySpecsWithoutChangingTheExistingSchema() {
        var spec = new CircuitSpec(CircuitSpec.VERSION_1, 2,
                List.of(new LevelSpec(List.of(GateSpec.of(GateKind.X, 1)))));
        var restored = OpenQasmParser.parse(OpenQasmSerializer.serialize(spec));
        assertEquals(CircuitSpec.CURRENT_VERSION, restored.version());
        assertEquals(spec.levels(), restored.levels());
        assertEquals(2, restored.numQubits());
        assertEquals(1, spec.version());
    }

    @ParameterizedTest
    @ValueSource(strings = {"qreg Q[1];", "qreg pi[1];", "creg q[1];", "qreg r[-1];", "qreg r[01];",
            "if(missing==0) x q[0];", "rx() q[0];", "u3(1,2,3,4) q[0];", "x(1) q[0];", "x q[0] @;",
            "rx(sqrt(-1)) q[0];", "rx(1e999) q[0];", "include \"qelib1.inc\";",
            "qreg r[1]; cx q,r;", "creg c[1]; measure q[0]->c;", "measure q[0]->q[0];"})
    void rejectsMalformedDeclarationsAndOperandsWithContext(String invalid) {
        var error = assertThrows(IllegalArgumentException.class, () -> parse("qreg q[2];\n" + invalid));
        assertTrue(error.getMessage().contains("line"), error.getMessage());
    }

    @Test
    void rejectsMissingIncludesAndMissingQuantumRegisters() {
        assertThrows(IllegalArgumentException.class, () -> OpenQasmParser.parse("OPENQASM 2.0; qreg q[1]; h q[0];"));
        assertThrows(IllegalArgumentException.class, () -> OpenQasmParser.parse("OPENQASM 2.0;"));
        assertThrows(NullPointerException.class, () -> OpenQasmParser.parse(null));
        assertThrows(NullPointerException.class, () -> OpenQasmSerializer.serialize(null));
    }

    @Test
    void rejectsInvalidSpecsBeforeExport() {
        for (var gate : List.of(GateSpec.of(GateKind.X), GateSpec.of(GateKind.X, -1), GateSpec.of(GateKind.X, 2),
                GateSpec.of(GateKind.SWAP, 0, 0), GateSpec.of(GateKind.SWAP, 0),
                new GateSpec(GateKind.H, List.of(0), List.of(), Map.of("theta", 0.0), null),
                new GateSpec(GateKind.X, List.of(0), List.of(), Map.of(), List.of(List.of(new ComplexCell(1, 0)))))) {
            assertThrows(IllegalArgumentException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(2, List.of(new LevelSpec(List.of(gate))))));
        }
        assertThrows(IllegalArgumentException.class, () -> OpenQasmSerializer.serialize(CircuitSpec.of(1,
                List.of(new LevelSpec(List.of(GateSpec.of(GateKind.H, 0), GateSpec.of(GateKind.X, 0)))))));
    }
}
