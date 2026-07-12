package org.aitan.jqapi.wasm;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.teavm.jso.JSExport;

/**
 * Browser-facing bridge for the jqapi simulator, compiled to JavaScript by
 * TeaVM (issue #5 phase 2b). A circuit spec goes in as JSON and the resulting
 * state-vector amplitudes come back as JSON — the only contract crossing the
 * JS boundary.
 * <p>
 * Uses a {@link JQAPIConfig#sequential(int)} configuration so the default
 * (parallel) configuration — and therefore {@code ForkJoinPool} /
 * {@code IntStream.parallel()}, which TeaVM cannot translate — is never on the
 * reachable path and gets dead-code-eliminated.
 *
 * @author Gaetano Ferrara
 */
public final class JqapiBridge {

    private JqapiBridge() {
    }

    /** Present so the TeaVM entry point resolves; the real API is {@link #run(String)}. */
    public static void main(String[] args) {
        // no-op: methods are exposed to JS via @JSExport
    }

    /**
     * Parses and validates a circuit spec, runs it on the local state-vector
     * simulator, and returns the resulting amplitudes.
     *
     * @param specJson the circuit as {@code CircuitSpec} JSON
     * @return {@code {"amplitudes":[{"re":…,"im":…}, …]}}
     */
    @JSExport
    public static String run(String specJson) {
        JQAPIConfig config = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);
        CircuitSpec spec = CircuitSpecJson.fromJson(specJson, config);
        Circuit circuit = CircuitSpecs.toCircuit(spec, config);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        ComplexVector state = sim.getQuantumRegister().getRegisterState();
        StringBuilder sb = new StringBuilder("{\"amplitudes\":[");
        for (int i = 0; i < state.getDimension(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            Complex c = state.getEntry(i);
            sb.append("{\"re\":").append(c.getReal())
                    .append(",\"im\":").append(c.getImaginary()).append('}');
        }
        return sb.append("]}").toString();
    }
}
