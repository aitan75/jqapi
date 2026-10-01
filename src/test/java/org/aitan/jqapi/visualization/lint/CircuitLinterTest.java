package org.aitan.jqapi.visualization.lint;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.lint.CircuitLinter.Diagnostic;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser.Location;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CircuitLinterTest {
    private static List<Diagnostic> lint(String body, String... disabled) {
        var program = OpenQasmParser.parseProgram("OPENQASM 2.0;\ninclude \"qelib1.inc\";\n" + body, JQAPIConfig.getDefault());
        return CircuitLinter.lint(program, Set.of(disabled));
    }

    private static List<String> rules(List<Diagnostic> diagnostics) {
        return diagnostics.stream().map(Diagnostic::rule).toList();
    }

    @Test void redundantHadamardsAcrossDisjointOperationsPointAtBothSourceLines() {
        var found = lint("qreg q[2];\nh q[0];\nx q[1];\nh q[0];\n");
        assertEquals(List.of("QED001"), rules(found));
        var d = found.getFirst();
        assertEquals(List.of(0), d.qubits());
        assertEquals(List.of(0, 2), d.levels());
        assertEquals(List.of(new Location(4, 1), new Location(6, 1)), d.locations());
        assertTrue(d.message().contains("q[0]"), d.message());
    }

    @Test void hadamardsSeparatedByDependenciesBarriersOrConditionsAreNotRedundant() {
        assertEquals(List.of(), lint("qreg q[2]; h q[0]; cx q[0],q[1]; h q[0];"));
        assertEquals(List.of(), lint("qreg q[1]; h q[0]; barrier q; h q[0];"));
        assertEquals(List.of(), lint("qreg q[1]; creg c[1]; h q[0]; measure q[0] -> c[0]; reset q[0]; h q[0];"));
        assertEquals(List.of(), lint("qreg q[1]; creg c[1]; measure q[0] -> c[0]; h q[0]; if(c==1) h q[0];", "QED002"));
        assertEquals(1, lint("qreg q[1]; h q[0]; h q[0]; h q[0];").size(), "H H H leaves one H");
    }

    @Test void quantumUseAfterMeasurementIsAdvisoryAndResetStartsANewLifetime() {
        var found = lint("qreg q[2]; creg c[1]; h q[0]; measure q[0] -> c[0]; cx q[0],q[1];");
        assertEquals(List.of("QED002"), rules(found));
        assertEquals(CircuitLinter.Severity.INFO, found.getFirst().severity());
        assertEquals(List.of(1, 2), found.getFirst().levels());
        assertTrue(found.getFirst().suggestion().contains("reset"));
        assertEquals(List.of(), lint("qreg q[2]; creg c[1]; h q[0]; measure q[0] -> c[0]; reset q[0]; cx q[0],q[1];"));
        assertEquals(List.of(), lint("qreg q[2]; creg c[1]; h q[0]; measure q[0] -> c[0]; cx q[0],q[1];", "QED002"));
    }

    @Test void teleportationFeedForwardIsNotReported() {
        assertEquals(List.of(), lint("""
                qreg q[3]; creg m0[1]; creg m1[1];
                h q[1]; cx q[1],q[2]; cx q[0],q[1]; h q[0];
                measure q[0] -> m0[0]; measure q[1] -> m1[0];
                if(m1==1) x q[2]; if(m0==1) z q[2];
                """));
    }

    @Test void unusedQubitsAcrossRegistersReportStorageRatio() {
        var found = lint("qreg a[3]; qreg b[3]; creg c[1]; h a[0]; barrier b[1]; measure b[2] -> c[0];");
        assertEquals(List.of("QED003"), rules(found));
        assertEquals(List.of(1, 2, 3), found.getFirst().qubits());
        String message = found.getFirst().message();
        assertTrue(message.contains("a[1], a[2], b[0]") && message.contains("64 amplitudes versus 8") && message.contains("8x"), message);
        assertEquals(List.of(), lint("qreg a[2]; qreg b[2]; barrier a, b;"), "register-wide operations count");
        assertEquals(List.of(), lint("qreg q[3];"), "nothing to compare in an empty circuit");
    }

    @Test void runtimeIdentityPaddingIsNotUsageAndSpecCallersGetLevelsWithoutSourceSpans() {
        var circuit = new Circuit(2);
        for (int i = 0; i < 2; i++) {
            var level = new CircuitLevel();
            level.addGate(new Hadamard(0));
            circuit.addLevel(level); // pads q1 with Identity at runtime
        }
        var spec = CircuitSpecs.toSpec(circuit);
        var found = CircuitLinter.lint(spec);
        assertEquals(List.of("QED001", "QED003"), rules(found));
        assertEquals(List.of(), found.getFirst().locations());
        assertEquals(List.of(1), found.get(1).qubits());
        assertEquals(CircuitSpecs.toSpec(circuit), spec, "analysis leaves the circuit unchanged");
    }

    @Test void explicitIdentityCountsAsUsageButNotAsAnOperation() {
        assertEquals(List.of(), lint("qreg q[2]; creg c[1]; h q[0]; id q[1]; measure q[0] -> c[0]; id q[0];"));
        assertEquals(List.of("QED001"), rules(lint("qreg q[1]; h q[0]; id q[0]; h q[0];")));
    }

    @Test void multiTargetHMeasurementAndResetUpdateEveryTarget() {
        var h = new GateSpec(GateKind.H, List.of(0, 1), List.of(), java.util.Map.of(), null);
        var measure = new GateSpec(GateKind.MEASUREMENT, List.of(0, 1), List.of(), java.util.Map.of(), null);
        var reset = new GateSpec(GateKind.RESET, List.of(0, 1), List.of(), java.util.Map.of(), null);
        var x1 = GateSpec.of(GateKind.X, 1);
        var hh = CircuitLinter.lint(CircuitSpec.of(2, List.of(new LevelSpec(List.of(h)), new LevelSpec(List.of(h)))));
        assertEquals(List.of(List.of(0), List.of(1)), hh.stream().map(Diagnostic::qubits).toList());
        var partial = CircuitLinter.lint(CircuitSpec.of(2, List.of(new LevelSpec(List.of(h)), new LevelSpec(List.of(GateSpec.of(GateKind.H, 1))))));
        assertEquals(List.of(1), partial.getFirst().qubits());
        assertTrue(partial.getFirst().suggestion().startsWith("If unintended, remove the H on q[1] at both positions, keeping any other qubit"),
                partial.getFirst().suggestion());
        var reused = CircuitLinter.lint(CircuitSpec.of(2, List.of(new LevelSpec(List.of(measure)), new LevelSpec(List.of(x1)))));
        assertEquals(List.of("QED002"), rules(reused));
        assertEquals(List.of(1), reused.getFirst().qubits());
        assertEquals(List.of(), CircuitLinter.lint(CircuitSpec.of(2, List.of(
                new LevelSpec(List.of(measure)), new LevelSpec(List.of(reset)), new LevelSpec(List.of(x1))))));
    }

    @Test void disabledRulesAreSkippedBeforeTheDiagnosticCap() {
        var levels = new java.util.ArrayList<>(Collections.nCopies(1_000, new LevelSpec(List.of(GateSpec.of(GateKind.H, 0)))));
        var found = CircuitLinter.lint(CircuitSpec.of(2, levels), Set.of("QED001"));
        assertEquals(List.of("QED003"), rules(found));
    }

    @Test void plainTextFormatAndDiagnosticCap() {
        String text = CircuitLinter.format(lint("qreg q[1];\nh q[0]; h q[0];"));
        assertTrue(text.startsWith("line 4:1 QED001 warning: Two H gates on q[0]"), text);
        assertTrue(text.contains("\n  hint: "), text);
        var many = CircuitSpec.of(1, Collections.nCopies(1_000, new LevelSpec(List.of(GateSpec.of(GateKind.H, 0)))));
        assertEquals(CircuitLinter.MAX_DIAGNOSTICS, CircuitLinter.lint(many).size());
    }
}
