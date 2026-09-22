package org.aitan.jqapi.wasm;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.CircuitSampler;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;
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

    /** Keep browser sampling bounded: every shot executes a complete simulation. */
    public static final int MAX_SHOTS = SamplingOptions.MAX_SHOTS;

    private JqapiBridge() {
    }

    /** Present so the TeaVM entry point resolves; the real API is {@link #run(String)}. */
    public static void main(String[] args) {
        // no-op: methods are exposed to JS via @JSExport
    }

    /**
     * Parses and validates a circuit spec, runs it on the local state-vector
     * simulator, and returns either the resulting amplitudes or a stable error
     * code for the browser to localize.
     *
     * @param specJson the circuit as {@code CircuitSpec} JSON
     * @return {@code {"ok":true,"amplitudes":[{"re":…,"im":…}, …]}} or
     *         {@code {"ok":false,"error":{"code":"…"}}}
     */
    @JSExport
    public static String run(String specJson) {
        try {
            JQAPIConfig config = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);
            CircuitSpec spec = CircuitSpecJson.fromJson(specJson, config);
            Circuit circuit = CircuitSpecs.toCircuit(spec, config);
            LocalSimulator sim = new LocalSimulator(circuit);
            sim.execute();
            ComplexVector state = sim.getQuantumRegister().getRegisterState();
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"amplitudes\":[");
            for (int i = 0; i < state.getDimension(); i++) {
                if (i > 0) {
                    sb.append(',');
                }
                Complex c = state.getEntry(i);
                sb.append("{\"re\":").append(c.getReal())
                        .append(",\"im\":").append(c.getImaginary()).append('}');
            }
            return sb.append("]}").toString();
        } catch (JQApiLimitException e) {
            return error("INPUT_LIMIT_EXCEEDED");
        } catch (IllegalArgumentException e) {
            return error("INVALID_CIRCUIT_SPEC");
        } catch (RuntimeException e) {
            return error("SIMULATION_FAILED");
        }
    }

    /**
     * Runs independently initialized simulations and returns a full
     * computational-basis histogram. The circuit JSON stays unchanged because
     * the number of shots is an execution option.
     *
     * @param specJson the circuit as {@code CircuitSpec} JSON
     * @param shots number of independent measurements, from 1 to {@value MAX_SHOTS}
     * @return {@code {"ok":true,"shots":…,"counts":[…]}} or a stable error code
     */
    @JSExport
    public static String sample(String specJson, int shots) {
        if (shots < 1 || shots > MAX_SHOTS) {
            return error("INVALID_SHOT_COUNT");
        }
        try {
            JQAPIConfig config = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);
            CircuitSpec spec = CircuitSpecJson.fromJson(specJson, config);
            Circuit circuit = CircuitSpecs.toCircuit(spec, config);
            int[] counts = CircuitSampler.sample(circuit, new SamplingOptions(shots)).counts();
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"shots\":").append(shots).append(",\"counts\":[");
            for (int i = 0; i < counts.length; i++) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(counts[i]);
            }
            return sb.append("]}").toString();
        } catch (JQApiLimitException e) {
            return error("INPUT_LIMIT_EXCEEDED");
        } catch (IllegalArgumentException e) {
            return error("INVALID_CIRCUIT_SPEC");
        } catch (RuntimeException e) {
            return error("SIMULATION_FAILED");
        }
    }

    private static String error(String code) {
        return "{\"ok\":false,\"error\":{\"code\":\"" + code + "\"}}";
    }
}
