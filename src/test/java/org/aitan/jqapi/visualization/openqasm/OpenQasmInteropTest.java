package org.aitan.jqapi.visualization.openqasm;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.aitan.jqapi.visualization.openqasm.OpenQasmRegressionTest.*;
import static org.junit.jupiter.api.Assertions.*;

class OpenQasmInteropTest {
    private static String resource(String name) throws IOException {
        try (var input = OpenQasmInteropTest.class.getResourceAsStream("/openqasm/" + name)) {
            assertNotNull(input, name);
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"qiskit-unitary", "cirq-unitary"})
    void importsIndependentStateReferencesAndExportsEquivalentCircuits(String name) throws IOException {
        var imported = OpenQasmParser.parse(resource(name + ".qasm"));
        var actual = simulate(imported, 0.5).getQuantumRegister().getRegisterState();
        var lines = resource(name + ".state").lines().toList();
        assertEquals(1 << imported.numQubits(), lines.size());
        // Compare modulo one global phase. QASM qelib1 and Cirq may choose different phases.
        double phaseReal = 1;
        double phaseImaginary = 0;
        boolean foundPhase = false;
        for (int i = 0; i < lines.size(); i++) {
            String[] pair = lines.get(i).trim().split("\\s+");
            double re = Double.parseDouble(pair[0]);
            double im = Double.parseDouble(pair[1]);
            double norm = re * re + im * im;
            if (!foundPhase && norm > 1e-12) {
                phaseReal = (actual.getEntry(i).getReal() * re + actual.getEntry(i).getImaginary() * im) / norm;
                phaseImaginary = (actual.getEntry(i).getImaginary() * re - actual.getEntry(i).getReal() * im) / norm;
                assertEquals(1, phaseReal * phaseReal + phaseImaginary * phaseImaginary, 1e-9);
                foundPhase = true;
            }
            assertEquals(re * phaseReal - im * phaseImaginary, actual.getEntry(i).getReal(), 1e-9, "real " + i);
            assertEquals(re * phaseImaginary + im * phaseReal, actual.getEntry(i).getImaginary(), 1e-9, "imaginary " + i);
        }
        assertTrue(foundPhase);
        String output = OpenQasmSerializer.serialize(imported);
        var roundTrip = simulate(OpenQasmParser.parse(output), 0.5).getQuantumRegister().getRegisterState();
        for (int i = 0; i < actual.getDimension(); i++) {
            assertEquals(actual.getEntry(i).getReal(), roundTrip.getEntry(i).getReal(), 1e-12);
            assertEquals(actual.getEntry(i).getImaginary(), roundTrip.getEntry(i).getImaginary(), 1e-12);
        }
        writeExport(name, output, actual);
    }

    @Test
    void exportsDynamicCircuitForExternalParserValidation() throws IOException {
        CircuitSpec spec = parse("qreg q[3]; creg a[1]; creg b[1]; h q[2]; measure q[2]->b[0]; "
                + "if(b==1) cx q[2],q[0]; reset q[2]; if(a==0) u3(pi/3,pi/2,pi/4) q[1]; "
                + "measure q[0]->a[0];");
        String output = OpenQasmSerializer.serialize(spec);
        assertEquals(spec, OpenQasmParser.parse(output));
        writeExport("dynamic", output, null);
    }

    private static void writeExport(String name, String qasm, ComplexVector state) throws IOException {
        Path directory = Path.of("target", "openqasm-interop");
        Files.createDirectories(directory);
        Files.writeString(directory.resolve(name + ".qasm"), qasm);
        if (state != null) {
            StringBuilder values = new StringBuilder();
            for (int i = 0; i < state.getDimension(); i++) {
                values.append(state.getEntry(i).getReal()).append(' ')
                        .append(state.getEntry(i).getImaginary()).append('\n');
            }
            Files.writeString(directory.resolve(name + ".state"), values);
        }
    }
}
