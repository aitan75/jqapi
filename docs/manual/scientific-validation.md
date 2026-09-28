# Scientific references and reproducible measurements

The core verification suite consumes committed analytic and independent numerical
references. No Python package or external simulator is needed to run `mvn -B verify`.
Timing and memory observations are optional standalone benchmarks, never CI speed
thresholds. This baseline covers pure-state unitary evolution and computational-basis
measurement; it is not a claim that every algorithm or physical noise model is validated.

## Initial references

`ScientificReferenceTest` covers these contracts:

| Fixture | Independent or analytic reference | Comparison |
| --- | --- | --- |
| Complex Bell pair on q0/q2 | `(\|000⟩ + i\|101⟩)/sqrt(2)` | Exact phase and MSB placement |
| Controlled phase kickback | `(\|001⟩ - \|101⟩)/sqrt(2)` | Relative phase retained |
| Asymmetric three-qubit unitary | Pinned Qiskit `Statevector` | One global phase for the complete final state; probabilities directly |
| Controlled Y/Z/X composition | Pinned Qiskit `Operator`, all eight input columns | Elementwise complex amplitudes, exact phase, no columnwise phase alignment |
| Biased three-qubit measurement | Born probabilities from `Statevector`; analytically 3/4 at `001`, 1/4 at `101` | Quantum and permuted classical histograms separately |
| Bell measurement followed by reset | Both Born branches driven by explicit draws 0.25/0.75 | Collapsed state and stored classical bits exactly |

All numerical state comparisons require squared norm 1 within `1e-12` and use
`max_i |actual_i - expected_i| <= 1e-12` (complex modulus, after alignment only
where allowed). NaN, non-unit norm, relative-phase errors and dimension mismatches
fail. Global-phase alignment uses the normalized complex overlap. An operator
must retain its phase when embedded under a control: a phase of the base operator
becomes relative between the controlled and uncontrolled subspaces. Never compare
individual operator columns modulo independent phases. Classical bits and
probability distributions have no phase equivalence.

The sampled fixture uses **10,000 shots**, `SamplingOptions.withSeed(112)`, and
absolute per-bin frequency tolerance **0.03**. Impossible bins must have exactly
zero counts, and counts must sum exactly to the number of shots. For at most eight
bins, Hoeffding's inequality plus a union bound gives
`P(any bin deviates by more than epsilon) <= 2 * 8 * exp(-2 * N * epsilon^2)`:
less than `2.5e-7` per histogram, or `4.9e-7` for the two checked histograms
combined (confidence above 99.99995%). This probabilistic statement assumes
independent ideal draws. The fixed pseudorandom stream makes CI deterministic;
the test does not certify the RNG. Repeated calls must reproduce counts on the
same runtime/configuration, but Java and Python/TeaVM are not required to produce
the same random sequence. The external reference contains exact probabilities,
not one simulator's random counts.

## Regenerate the independent fixtures

Use an isolated optional environment, with the pinned simulator and NumPy versions:

```bash
python3 -m venv /tmp/jqapi-scientific-reference
/tmp/jqapi-scientific-reference/bin/pip install -r src/test/python/requirements-scientific.txt
/tmp/jqapi-scientific-reference/bin/python src/test/python/scientific_references.py
mvn -B test -Dtest=ScientificReferenceTest
git diff -- src/test/resources/scientific
```

The generator checks package versions and records Python, simulator/backend,
generator SHA-256 and each fixture SHA-256 in
[`manifest.json`](../../src/test/resources/scientific/manifest.json). It uses
Qiskit's independent dense `Statevector`/`Operator` implementation, **not Aer**;
no simulator shots or random circuit generation are involved. The reference
environment does not change core dependencies. Small last-bit differences on
other platforms can be reviewed against the stated tolerance; do not update
golden values just to make a failure disappear.

Qiskit treats q0 as the least significant bit; jqapi treats q0 as the most
significant bit. The generator explicitly bit-reverses every state-vector index
and **both axes** of an operator. Text `.state` files contain real/imaginary pairs
in jqapi basis-index order; `.operator` is row-major, output row then input
column. `.probabilities` files use the same basis order. For the measurement
fixture, q0→c2, q1→c0, q2→c1; the classical histogram is c0,c1,c2 from MSB to LSB.
The saved measurement `.state` is the state **before** measurement.

Primary API references: [Qiskit Statevector](https://quantum.cloud.ibm.com/docs/en/api/qiskit/quantum_info.Statevector)
and [Qiskit Operator](https://quantum.cloud.ibm.com/docs/en/api/qiskit/quantum_info.Operator).
For future noisy references, the [Aer backend reference](https://qiskit.github.io/qiskit-aer/stubs/qiskit_aer.AerSimulator.html)
describes the available simulation methods; use a pinned version and name the method.

## Contribution contract for later features

Every new family must include: mathematical source/formula; concrete circuit and
initial state; input/output bit conventions; backend and pinned generation
environment; generation command and hashes; comparison metric/tolerance; and,
for statistical checks, shots, seed, confidence and familywise failure bound.
Include an asymmetric case that detects bit-order mistakes and an invalid-input
or resource-budget case at any new public boundary. Keep reference circuits small
enough for normal CI. Runtime dependencies remain unchanged.

| Family | Required examples and comparison contract |
| --- | --- |
| QFT / inverse QFT | Analytic basis-column Fourier phases `exp(2*pi*i*j*k/N)/sqrt(N)` with declared sign and output swaps; an independent superposition reference; exact operator phase and inversion error. Existing QFT tests remain useful; new implementations/variants add these references. |
| QPE | Exactly representable and off-grid eigenphases, declared ancilla significance and phase units; independent output distribution and deterministic exact cases; controlled powers must retain operator phase. State shots/confidence for sampled estimates. |
| Expectations | Analytic eigenstates and non-eigenstates, complex Y terms and multi-term Hamiltonians; compare exact real expectations with absolute error, and sampled estimates with stated variance/confidence and total-shot accounting. Existing expectation tests are not replaced by this contract. |
| Density matrices / noise | Pinned channel parameters and Kraus conventions; trace, Hermiticity and positivity residuals; compare density entries or a declared trace/Frobenius norm, never global-phase-align density matrices. Include zero-noise identity, a nontrivial mixed state and statistical trajectory-vs-density checks. |

Future fixtures arrive with their features; this initial baseline does not wait
for all algorithms, noise, or issue #113.

## Optional JVM and browser measurements

See [the benchmark protocol and recorded baseline](../benchmarks/README.md).
Configured guards (24 register qubits, 12 search qubits by default) are not
demonstrated device capacities. A state vector alone costs `16 * 2^n` bytes;
snapshots, histories, histograms, serialization, runtime objects and GC add to it.
