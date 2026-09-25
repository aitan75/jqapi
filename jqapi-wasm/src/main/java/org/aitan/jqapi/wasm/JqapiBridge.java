package org.aitan.jqapi.wasm;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.exceptions.UnsupportedSpecVersionException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.Expectation;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.observable.PauliSumJson;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.ConditionalGate;
import org.aitan.jqapi.quantum.gates.Gate;
import org.aitan.jqapi.quantum.gates.Measurement;
import org.aitan.jqapi.quantum.gates.Reset;
import org.aitan.jqapi.quantum.simulator.CircuitSampler;
import org.aitan.jqapi.quantum.simulator.ExpectationSampler;
import org.aitan.jqapi.quantum.simulator.SampledExpectation;
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
     * code for the browser to localize. Classical circuits also return
     * {@code classicalRecords} in address order.
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
            sb.append(']');
            if (circuit.getNumClassicalBits() > 0) {
                sb.append(",\"classicalRecords\":[");
                var records = sim.extractClassicalRecords();
                for (int i = 0; i < records.size(); i++) {
                    if (i > 0) sb.append(',');
                    sb.append(records.get(i).bit());
                }
                sb.append(']');
            }
            return sb.append('}').toString();
        } catch (UnsupportedSpecVersionException e) {
            return error("UNSUPPORTED_SPEC_VERSION");
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
     * the number of shots is an execution option. Classical circuits also return
     * {@code classicalCounts} over all declared classical bits, c0 as MSB.
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
            SamplingOptions options = new SamplingOptions(shots);
            if (circuit.getNumClassicalBits() > 0) {
                int[] bits = new int[circuit.getNumClassicalBits()];
                for (int i = 0; i < bits.length; i++) bits[i] = i;
                options = options.withClassicalBits(bits);
            }
            var result = CircuitSampler.sample(circuit, options);
            int[] counts = result.counts();
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"shots\":").append(shots).append(",\"counts\":[");
            for (int i = 0; i < counts.length; i++) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(counts[i]);
            }
            sb.append(']');
            if (circuit.getNumClassicalBits() > 0) {
                sb.append(",\"classicalCounts\":[");
                int[] classicalCounts = result.classicalCounts();
                for (int i = 0; i < classicalCounts.length; i++) {
                    if (i > 0) sb.append(',');
                    sb.append(classicalCounts[i]);
                }
                sb.append(']');
            }
            return sb.append('}').toString();
        } catch (UnsupportedSpecVersionException e) {
            return error("UNSUPPORTED_SPEC_VERSION");
        } catch (JQApiLimitException e) {
            return error("INPUT_LIMIT_EXCEEDED");
        } catch (IllegalArgumentException e) {
            return error("INVALID_CIRCUIT_SPEC");
        } catch (RuntimeException e) {
            return error("SIMULATION_FAILED");
        }
    }

    /**
     * Exact {@code ⟨ψ|H|ψ⟩} of the circuit's final state. Circuits with
     * measurement, reset or classical conditions have no single final state and
     * are rejected with {@code NON_UNITARY_CIRCUIT}; use
     * {@link #sampleExpectation} for them.
     *
     * @param specJson the circuit as {@code CircuitSpec} JSON
     * @param observableJson the observable as {@code PauliSumJson}
     * @return {@code {"ok":true,"value":…,"terms":[{"coeff","pauli","value"}]}} or a stable error code
     */
    @JSExport
    public static String expectation(String specJson, String observableJson) {
        try {
            Circuit circuit = parseCircuit(specJson);
            if (!isUnitary(circuit)) return error("NON_UNITARY_CIRCUIT");
            PauliSum observable = parseObservable(observableJson, circuit);
            // Reject from the inputs alone, before allocating the 2^n state.
            Expectation.requireWithinBudget(observable, Expectation.DEFAULT_MAX_WORK);
            LocalSimulator sim = new LocalSimulator(circuit);
            sim.execute();
            ComplexVector state = sim.getQuantumRegister().getRegisterState();
            // ponytail: evaluates each term twice (sum + per-term); share the pass if large observables get slow.
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"value\":").append(Expectation.of(state, observable))
                    .append(",\"terms\":[");
            for (int i = 0; i < observable.terms().size(); i++) {
                PauliSum.Term term = observable.terms().get(i);
                if (i > 0) sb.append(',');
                sb.append("{\"coeff\":").append(term.coeff()).append(",\"pauli\":\"").append(term.pauli())
                        .append("\",\"value\":").append(Expectation.of(state, term.pauli())).append('}');
            }
            return sb.append("]}").toString();
        } catch (RuntimeException e) {
            return errorFor(e);
        }
    }

    /**
     * Shot-based estimate of {@code ⟨H⟩}: every non-identity term runs {@code shots}
     * independent simulations in its measurement basis; identity terms are exact.
     *
     * @param specJson the circuit as {@code CircuitSpec} JSON
     * @param observableJson the observable as {@code PauliSumJson}
     * @param shots shots per term, from 2 to {@value MAX_SHOTS}
     * @return {@code {"ok":true,"value":…,"standardError":…,"totalShots":…,"terms":[{"coeff","pauli","shots","mean","variance"}]}}
     *         or a stable error code
     */
    @JSExport
    public static String sampleExpectation(String specJson, String observableJson, int shots) {
        if (shots < 2 || shots > MAX_SHOTS) {
            return error("INVALID_SHOT_COUNT");
        }
        try {
            Circuit circuit = parseCircuit(specJson);
            PauliSum observable = parseObservable(observableJson, circuit);
            SampledExpectation result = ExpectationSampler.estimate(circuit, observable, new SamplingOptions(shots));
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"value\":").append(result.value())
                    .append(",\"standardError\":").append(result.standardError())
                    .append(",\"totalShots\":").append(result.totalShots()).append(",\"terms\":[");
            for (int i = 0; i < result.terms().size(); i++) {
                SampledExpectation.TermEstimate term = result.terms().get(i);
                if (i > 0) sb.append(',');
                sb.append("{\"coeff\":").append(term.coeff()).append(",\"pauli\":\"").append(term.pauli())
                        .append("\",\"shots\":").append(term.shots()).append(",\"mean\":").append(term.mean())
                        .append(",\"variance\":").append(term.variance()).append('}');
            }
            return sb.append("]}").toString();
        } catch (RuntimeException e) {
            return errorFor(e);
        }
    }

    private static Circuit parseCircuit(String specJson) {
        JQAPIConfig config = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);
        return CircuitSpecs.toCircuit(CircuitSpecJson.fromJson(specJson, config), config);
    }

    /** @throws InvalidObservableException for any invalid observable other than a resource limit */
    private static PauliSum parseObservable(String observableJson, Circuit circuit) {
        PauliSum observable;
        try {
            observable = PauliSumJson.fromJson(observableJson, circuit.getConfig());
        } catch (JQApiLimitException e) {
            throw e;
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new InvalidObservableException();
        }
        if (observable.numQubits() != circuit.getInputSize()) throw new InvalidObservableException();
        return observable;
    }

    private static boolean isUnitary(Circuit circuit) {
        for (CircuitLevel level : circuit.getLevels()) {
            for (Gate gate : level.getGates()) {
                if (gate instanceof Measurement || gate instanceof Reset || gate instanceof ConditionalGate) return false;
            }
        }
        return true;
    }

    private static String errorFor(RuntimeException e) {
        if (e instanceof InvalidObservableException) return error("INVALID_OBSERVABLE");
        if (e instanceof UnsupportedSpecVersionException) return error("UNSUPPORTED_SPEC_VERSION");
        if (e instanceof JQApiLimitException) return error("INPUT_LIMIT_EXCEEDED");
        if (e instanceof IllegalArgumentException) return error("INVALID_CIRCUIT_SPEC");
        return error("SIMULATION_FAILED");
    }

    /** Marks observable errors so they map to their own code, not INVALID_CIRCUIT_SPEC. */
    private static final class InvalidObservableException extends RuntimeException {
    }

    private static String error(String code) {
        return "{\"ok\":false,\"error\":{\"code\":\"" + code + "\"}}";
    }
}
