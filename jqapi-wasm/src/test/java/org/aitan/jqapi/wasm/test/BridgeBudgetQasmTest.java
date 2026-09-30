package org.aitan.jqapi.wasm.test;

import java.util.List;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import org.aitan.jqapi.wasm.BrowserBudget;
import org.aitan.jqapi.wasm.JqapiBridge;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BridgeBudgetQasmTest {
    private static final String LIMIT = "{\"ok\":false,\"error\":{\"code\":\"INPUT_LIMIT_EXCEEDED\"}}";

    @Test void importsExecutableMsbCircuitWithParametersAndClassicalDependencies() {
        String result = JqapiBridge.importQasm("OPENQASM 2.0; include \"qelib1.inc\"; qreg q[2]; creg a[1]; creg b[1]; "
                + "rx(pi) q[0]; measure q[0] -> a[0]; reset q[0]; if(a==1) x q[1];");
        assertTrue(result.startsWith("{\"ok\":true,\"spec\":"), result);
        String spec = result.substring("{\"ok\":true,\"spec\":".length(), result.length() - 1);
        assertTrue(JqapiBridge.sample(spec, 8).contains("\"counts\":[0,8,0,0]"));
        var parsed = CircuitSpecJson.fromJson(spec);
        assertEquals(Math.PI, parsed.levels().getFirst().gates().getFirst().params().get("theta"));
        assertEquals(0, parsed.levels().get(3).gates().getFirst().condition().bitIndex());
        assertTrue(JqapiBridge.exportQasm(spec).startsWith("{\"ok\":true"));
    }

    @Test void rejectsBeforeAllocatingLargeStatesOrHistograms() {
        String wide = "{\"version\":1,\"numQubits\":9,\"levels\":[]}";
        assertEquals(LIMIT, JqapiBridge.run(wide));
        assertEquals(LIMIT, JqapiBridge.sample(wide, 1));
        assertEquals(LIMIT, JqapiBridge.trace(wide, 1));
        assertEquals(LIMIT, JqapiBridge.importQasm("OPENQASM 2.0; qreg q[9];"));
        assertEquals(LIMIT, JqapiBridge.importQasm(" ".repeat(BrowserBudget.MAX_INPUT_CHARS + 1)));
        assertEquals(LIMIT, JqapiBridge.run(" ".repeat(BrowserBudget.MAX_INPUT_CHARS + 1)));
        assertEquals(LIMIT, JqapiBridge.sample("{\"version\":2,\"numQubits\":1,\"numClassicalBits\":9,\"levels\":[]}", 1));
    }

    @Test void rejectsDepthTraceAndTrajectoryBudgetsIndependently() {
        var level = new LevelSpec(List.of(GateSpec.of(GateKind.X, 0)));
        String deep = CircuitSpecJson.toJson(new CircuitSpec(1, 8, java.util.Collections.nCopies(257, level)));
        assertEquals(LIMIT, JqapiBridge.run(deep));
        String trace = CircuitSpecJson.toJson(new CircuitSpec(1, 8, java.util.Collections.nCopies(256, level)));
        assertTrue(JqapiBridge.run(trace).startsWith("{\"ok\":true"));
        assertEquals(LIMIT, JqapiBridge.trace(trace, 1));
        String costly = CircuitSpecJson.toJson(new CircuitSpec(1, 8, java.util.Collections.nCopies(8, level)));
        assertEquals(LIMIT, JqapiBridge.sample(costly, 10_000));
    }

    @Test void returnsActionableQasmErrorsWithoutPartialCircuit() {
        String result = JqapiBridge.importQasm("OPENQASM 2.0; qreg q[2]; unknown q[0];");
        assertTrue(result.contains("\"code\":\"INVALID_QASM\""), result);
        assertTrue(result.contains("\"detail\":"));
        assertFalse(result.contains("\"spec\":"));
    }

    @Test void boundsTotalDenseStorageAndGateCount() {
        var zero = new org.aitan.jqapi.visualization.spec.ComplexCell(0, 0);
        var one = new org.aitan.jqapi.visualization.spec.ComplexCell(1, 0);
        var matrix = new java.util.ArrayList<List<org.aitan.jqapi.visualization.spec.ComplexCell>>();
        for (int i = 0; i < 64; i++) {
            var row = new java.util.ArrayList<org.aitan.jqapi.visualization.spec.ComplexCell>();
            for (int j = 0; j < 64; j++) row.add(i == j ? one : zero);
            matrix.add(row);
        }
        var dense = new GateSpec(GateKind.GENERIC, List.of(0, 1, 2, 3, 4, 5), List.of(), java.util.Map.of(), matrix);
        var small = new GateSpec(GateKind.GENERIC, List.of(6), List.of(), java.util.Map.of(), List.of(List.of(one, zero), List.of(zero, one)));
        var spec = new CircuitSpec(1, 8, List.of(new LevelSpec(List.of(dense, small))));
        assertEquals(LIMIT, JqapiBridge.run(CircuitSpecJson.toJson(spec)));
        var gates = java.util.stream.IntStream.range(0, 8).mapToObj(q -> GateSpec.of(GateKind.X, q)).toList();
        var many = new CircuitSpec(1, 8, java.util.Collections.nCopies(129, new LevelSpec(gates)));
        assertEquals(LIMIT, JqapiBridge.run(CircuitSpecJson.toJson(many)));
    }
}
