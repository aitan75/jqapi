package org.aitan.jqapi.quantum.simulator;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.DoubleSupplier;
import java.util.stream.IntStream;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.Pauli;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Phase;

/**
 * Stateless shot-based estimator of Pauli-sum expectation values.
 * <p>
 * Each non-identity term runs {@code options.shots()} complete shots of the
 * circuit followed by a basis change (X: H; Y: S† then H; Z: none), measuring
 * only the term's support. The eigenvalue of a shot is {@code (-1)^parity} of
 * the measured bits. Identity terms are added exactly and use no shots.
 * <p>
 * The random factory is called once per estimate and its stream is shared, in
 * order, across terms, so equal seeds reproduce results and terms are not
 * correlated by replaying the same stream. The work budget of {@code options}
 * bounds the sum over all terms and is checked before any shot runs; measured
 * and classical selections in {@code options} are ignored.
 */
public final class ExpectationSampler {

    private ExpectationSampler() { }

    /**
     * Starts every shot at |0...0>.
     * @param circuit circuit preparing the state
     * @param observable Pauli sum on the circuit's qubits
     * @param options shots per term (at least 2), randomness and work budget
     * @return the estimate with per-term statistics
     */
    public static SampledExpectation estimate(Circuit circuit, PauliSum observable, SamplingOptions options) {
        return execute(circuit, observable, options, null);
    }

    /**
     * Starts every shot from a copy of {@code initialState}.
     * @param circuit circuit applied to the initial state
     * @param observable Pauli sum on the circuit's qubits
     * @param options shots per term (at least 2), randomness and work budget
     * @param initialState normalized vector of dimension 2^qubits, qubit 0 = MSB
     * @return the estimate with per-term statistics
     */
    public static SampledExpectation estimate(Circuit circuit, PauliSum observable, SamplingOptions options,
                                              ComplexVector initialState) {
        return execute(circuit, observable, options, Objects.requireNonNull(initialState, "initialState"));
    }

    private static SampledExpectation execute(Circuit circuit, PauliSum observable, SamplingOptions options,
                                              ComplexVector initialState) {
        Objects.requireNonNull(circuit, "circuit");
        Objects.requireNonNull(observable, "observable");
        Objects.requireNonNull(options, "options");
        int n = circuit.getInputSize();
        if (observable.numQubits() != n) {
            throw new IllegalArgumentException("Observable must act on the circuit's " + n + " qubits");
        }
        int shots = options.shots();
        if (shots < 2) throw new IllegalArgumentException("Sampled expectation needs at least 2 shots per term");
        if (initialState != null) {
            // Same state validation as CircuitSampler, also when only identity terms need no shots.
            new LocalSimulator(circuit, initialState, () -> 0.0);
        }

        List<Circuit> measured = new ArrayList<>();
        long budget = options.maxWork();
        long visitsPerPass = (long) shots << n;
        for (PauliSum.Term term : observable.terms()) {
            if (isIdentity(term.pauli())) {
                measured.add(null);
                continue;
            }
            Circuit basis = withBasisChange(circuit, term.pauli());
            long passes = CircuitSampler.passes(basis);
            if (visitsPerPass > budget / passes) {
                throw new JQApiLimitException("Sampled expectation exceeds the amplitude-visit work budget");
            }
            budget -= visitsPerPass * passes;
            measured.add(basis);
        }

        DoubleSupplier stream = options.newRandom();
        SamplingOptions shared = new SamplingOptions(shots).withMaxWork(options.maxWork()).withRandomSource(() -> stream);
        List<SampledExpectation.TermEstimate> estimates = new ArrayList<>();
        double value = 0;
        double standardError = 0;
        int totalShots = 0;
        for (int k = 0; k < measured.size(); k++) {
            PauliSum.Term term = observable.terms().get(k);
            SampledExpectation.TermEstimate estimate = measured.get(k) == null
                    ? new SampledExpectation.TermEstimate(term.coeff(), term.pauli(), 0, 1, 0)
                    : sampleTerm(term, measured.get(k), shared, initialState);
            estimates.add(estimate);
            value += term.coeff() * estimate.mean();
            // hypot avoids overflow of c² for large finite coefficients.
            standardError = Math.hypot(standardError, Math.abs(term.coeff()) * Math.sqrt(estimate.variance()));
            totalShots += estimate.shots();
        }
        if (!Double.isFinite(value) || !Double.isFinite(standardError)) {
            throw new JQApiLimitException("Sampled expectation exceeds the double range");
        }
        return new SampledExpectation(value, standardError, totalShots, estimates);
    }

    private static SampledExpectation.TermEstimate sampleTerm(PauliSum.Term term, Circuit basis, SamplingOptions shared,
                                                              ComplexVector initialState) {
        SamplingOptions options = shared.withMeasuredQubits(support(term.pauli()));
        SamplingResult result = initialState == null
                ? CircuitSampler.sample(basis, options)
                : CircuitSampler.sample(basis, options, initialState);
        int[] counts = result.counts();
        long signed = 0;
        for (int outcome = 0; outcome < counts.length; outcome++) {
            signed += (Integer.bitCount(outcome) & 1) == 0 ? counts[outcome] : -counts[outcome];
        }
        int shots = result.shots();
        double mean = (double) signed / shots;
        return new SampledExpectation.TermEstimate(term.coeff(), term.pauli(), shots, mean, (1 - mean * mean) / (shots - 1));
    }

    private static boolean isIdentity(PauliString pauli) {
        return (pauli.xMask() | pauli.zMask()) == 0;
    }

    private static int[] support(PauliString pauli) {
        return IntStream.range(0, pauli.numQubits()).filter(q -> pauli.get(q) != Pauli.I).toArray();
    }

    /** Copy of {@code circuit} (sharing its initialized levels) plus a rotation into the term's eigenbasis. */
    private static Circuit withBasisChange(Circuit circuit, PauliString pauli) {
        Circuit basis = new Circuit(circuit.getInputSize(), circuit.getNumClassicalBits(), circuit.getConfig());
        for (CircuitLevel level : circuit.getLevels()) basis.addLevel(level);
        CircuitLevel sDagger = new CircuitLevel();
        CircuitLevel hadamard = new CircuitLevel();
        for (int q = 0; q < pauli.numQubits(); q++) {
            Pauli p = pauli.get(q);
            if (p == Pauli.Y) sDagger.addGate(new Phase(-Math.PI / 2, q));
            if (p == Pauli.X || p == Pauli.Y) hadamard.addGate(new Hadamard(q));
        }
        if (!sDagger.getGates().isEmpty()) basis.addLevel(sDagger);
        if (!hadamard.getGates().isEmpty()) basis.addLevel(hadamard);
        return basis;
    }
}
