# Worked Examples

End-to-end programs, each adapted from the library's own tests under
`src/test/java/org/aitan/jqapi/test/`. Every gate call and signature matches the
current source.

- [Back to the manual](README.md) · [Core concepts](concepts.md)

## Contents

1. [Hadamard coin flip (single qubit)](#1-hadamard-coin-flip-single-qubit)
2. [Two-qubit coin flip](#2-two-qubit-coin-flip)
3. [Bell state — entanglement](#3-bell-state--entanglement)
4. [Inspecting a state without measuring](#4-inspecting-a-state-without-measuring)
5. [Quantum teleportation](#5-quantum-teleportation)
6. [Deutsch–Jozsa](#6-deutschjozsa)
7. [Grover search over a classical list](#7-grover-search-over-a-classical-list)
8. [Quantum Fourier Transform](#8-quantum-fourier-transform)
9. [Reproducible shot sampling](#9-reproducible-shot-sampling)
10. [Classical feed-forward](#10-classical-feed-forward)
11. [Expectation values of a Hamiltonian](#11-expectation-values-of-a-hamiltonian)
12. [Phase estimation with composable unitaries](#12-phase-estimation-with-composable-unitaries)
13. [Hamiltonian time evolution](#13-hamiltonian-time-evolution)

Common imports for the snippets below:

```java
import java.util.stream.IntStream;
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
```

---

## 1. Hadamard coin flip (single qubit)

A single Hadamard on `|0>` gives a fair coin. See the
[quick start](README.md#your-first-program-a-quantum-coin-flip) for the full
program. The core:

```java
Circuit circuit = new Circuit(1);
CircuitLevel level = new CircuitLevel();
level.addGate(new Hadamard(0));
circuit.addLevel(level);

QuantumSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
QuantumRegister qreg = simulator.getQuantumRegister();
qreg.measure();

boolean isZero = qreg.getResult()[0].equals(new QubitZero());
```

Over many runs the outcome is ~50% `0` and ~50% `1`.

---

## 2. Two-qubit coin flip

Applying Hadamard to **both** qubits produces the uniform superposition over
`{00, 01, 10, 11}` — each outcome ~25%. Note `new Hadamard(0, 1)` applies the
same gate to two qubits in one level.

```java
Circuit circuit = new Circuit(2);
CircuitLevel level = new CircuitLevel();
level.addGate(new Hadamard(0, 1));
circuit.addLevel(level);

int[] results = new int[4];
for (int i = 0; i < 10_000; i++) {
    QuantumSimulator simulator = new LocalSimulator(circuit);
    simulator.execute();
    QuantumRegister qreg = simulator.getQuantumRegister();
    qreg.measure();
    boolean first  = qreg.getResult()[0].getValue().getEntry(0).equals(org.aitan.jqapi.math.Complex.ZERO);
    boolean second = qreg.getResult()[1].getValue().getEntry(0).equals(org.aitan.jqapi.math.Complex.ZERO);
    int idx = (first ? 2 : 0) + (second ? 1 : 0);
    results[idx]++;
}
// results[0..3] each ~2500
```

*(Adapted from `JavaQuantumAPITest.testCoinLaunch`.)*

---

## 3. Bell state — entanglement

A Hadamard followed by a CNOT entangles two qubits into
`(|00> + |11>)/sqrt(2)`. When measured, the two qubits are perfectly correlated:
you only ever see `00` or `11`, each ~50%.

```java
Circuit circuit = new Circuit(2);
CircuitLevel level1 = new CircuitLevel();
CircuitLevel level2 = new CircuitLevel();
level1.addGate(new Hadamard(0));
level2.addGate(new ControlledNot(0, 1));
circuit.addLevel(level1, level2);

// Visualize it before running (see the Visualization reference):
new AsciiCircuitRenderer().print(circuit);
// q0: ─[H]──●─
//           │
// q1: ──────⊕─

int both0 = 0, both1 = 0;
for (int i = 0; i < 10_000; i++) {
    QuantumSimulator simulator = new LocalSimulator(circuit);
    simulator.execute();
    QuantumRegister qreg = simulator.getQuantumRegister();
    qreg.measure();
    boolean q0zero = qreg.getResult()[0].equals(new QubitZero());
    boolean q1zero = qreg.getResult()[1].equals(new QubitZero());
    if (q0zero && q1zero) both0++;
    if (!q0zero && !q1zero) both1++;
}
// both0 ~5000, both1 ~5000; you never see 01 or 10
```

*(Adapted from `JavaQuantumAPITest.testBellState`.)*

Because a Bell state is entangled, calling `getQubitRegisterState()` on it before
measuring throws `IllegalStateException` — this is verified in
`QuantumMeasurementTest.testEntangledStateFactorizationRejected`.

---

## 4. Inspecting a state without measuring

For **separable** states you can read the individual qubits without collapsing
the register. This Swap example exchanges the states of two qubits and reads them
back with `getQubitRegisterState()`:

```java
Circuit circuit = new Circuit(2);
CircuitLevel level = new CircuitLevel();
level.addGate(new Swap(0, 1));
circuit.addLevel(level);

// Initialize from |0>-amplitude coefficients 0.5 and 0.8
QuantumSimulator simulator = new LocalSimulator(circuit, 0.5, 0.8);
simulator.execute();
QuantumRegister qreg = simulator.getQuantumRegister();

Qubit[] factorized = qreg.getQubitRegisterState();
// The swap exchanged them: factorized[1] == input[0], factorized[0] == input[1]
assert qreg.getInput()[0].equals(factorized[1]);
assert qreg.getInput()[1].equals(factorized[0]);
```

*(Adapted from `JavaQuantumAPITest.testSwapGate`.)*

---

## 5. Quantum teleportation

Teleportation transfers an arbitrary input on q0 to Bob's q2 using an
entangled pair, two measurements, and two classical bits. Alice's original state
is destroyed by measurement; Bob needs her classical outcomes before applying
the corrections. This does not clone a qubit or communicate faster than light.

```java
import org.aitan.jqapi.quantum.classical.Condition;

Circuit circuit = new Circuit(3, 2);
Gate[] operations = {
    new U3(Math.PI / 3, Math.PI / 4, 0, 0),
    new Hadamard(1),
    new ControlledNot(1, 2),
    new ControlledNot(0, 1),
    new Hadamard(0),
    Measurement.into(0, 0),
    Measurement.into(1, 1),
    new ConditionalGate(new PauliX(2), new Condition(1, 1)),
    new ConditionalGate(new PauliZ(2), new Condition(0, 1))
};
for (Gate gate : operations) {
    CircuitLevel level = new CircuitLevel();
    level.addGate(gate);
    circuit.addLevel(level);
}
LocalSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
System.out.println(simulator.extractClassicalRecords());
// Bob's reduced state equals the input prepared by U3, for all four outcomes.
```

`BellTeleportationClassicalTest` checks all four branches, including complex
input states. The browser regression tests require fidelity greater than
`1 - 1e-9` for every branch; fidelity compares states independently of global phase. These corrections use the classical feed-forward support from
[#110](https://github.com/aitan75/jqapi/issues/110).

### Step-by-step in the web editor

1. Open **Algorithms → Guided teleportation**. The live state updates automatically.
2. Change **θ** and **φ** to prepare a different input on q0. The guide compares
   its Bloch vector with Bob's reduced state and reports fidelity.
3. Use **Initial state**, **Previous**, **Next**, the slider, or **Play** to inspect
   the trajectory. The highlighted circuit column follows the current operation.
4. Stop before each measurement to inspect the superposition, then advance once
   to see its discrete collapse, recorded outcome and conditional probability.
5. Advance through Bob's conditional X and Z. A skipped correction is labelled;
   final fidelity is 100% for all four classical outcomes.
6. **Re-run trajectory** chooses a new seed. Edits retain the seed and navigation
   only selects stored frames, so going back does not change measurement outcomes.

The reduced Bloch sphere can show any qubit, including a mixed state from
entanglement. The heatmap uses brightness for probability and hue for phase;
probabilities alone cannot describe a quantum state. A zero amplitude has no
phase. **Run simulation** separately samples shots and evaluates observables.

The editor uses one implicit classical bit c[q] for each qubit, with measurements
writing to that bit and optional conditions on supported single-qubit gates.
Save/load preserves this CircuitSpec v2 subset; other classical layouts are
rejected explicitly. Ordinary circuits continue to serialize as v1.

---

## 6. Deutsch–Jozsa

Deutsch–Jozsa decides, with a **single** oracle query, whether a black-box
function is *constant* or *balanced*. This uses `N_INPUT` input qubits plus one
ancilla, an `Oracle` built from a matrix, and Hadamards before and after.

```java
final int N_INPUT = 3;
Circuit circuit = new Circuit(N_INPUT + 1);
CircuitLevel l1 = new CircuitLevel();
CircuitLevel l2 = new CircuitLevel();
CircuitLevel l3 = new CircuitLevel();
CircuitLevel l4 = new CircuitLevel();

l1.addGate(new PauliX(N_INPUT));                 // flip the ancilla
Integer[] all       = IntStream.range(0, N_INPUT + 1).boxed().toArray(Integer[]::new);
Integer[] inputsOnly = IntStream.range(0, N_INPUT).boxed().toArray(Integer[]::new);
l2.addGate(new Hadamard(all));
l3.addGate(myOracle);                            // an Oracle over all qubits
l4.addGate(new Hadamard(inputsOnly));
circuit.addLevel(l1, l2, l3, l4);

QuantumSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
QuantumRegister qreg = simulator.getQuantumRegister();
qreg.measure();

Qubit[] input = qreg.getInput();
// If input qubit 0 is unchanged, the function is constant; otherwise balanced.
String verdict = qreg.getResult()[0].equals(input[0]) ? "constant" : "balanced";
```

The oracle is a `2^(N_INPUT+1) x 2^(N_INPUT+1)` unitary wrapped in an
`Oracle(matrix, all)`. For the exact oracle-construction code (identity,
permutation, and Kronecker-product cases) see
`QuantumAlgorithmTest.testDeutschJoszaAlgorithm` and its
`createDeutschJoszaOracle` helper.

---

## 7. Grover search over a classical list

`Algorithm.search` implements Grover's algorithm: given a list and a predicate,
it amplifies the amplitude of the matching element and returns it. It is
probabilistic but self-verifying (it checks the measured candidate classically
and retries up to 10 times).

```java
import java.util.List;
import java.util.function.Function;
import org.aitan.jqapi.Algorithm;
import org.aitan.jqapi.exceptions.JQApiException;

record Person(String name, int age) {}

List<Person> people = List.of(
        new Person("Gaetano", 46),
        new Person("Marilena", 45),
        new Person("Pippo", 45),
        new Person("Francesco", 72));

Function<Person, Boolean> predicate = p -> p.age() == 45 && p.name().startsWith("P");

try {
    Person found = Algorithm.search(people, predicate);
    System.out.println("Found: " + found.name()); // Pippo
} catch (JQApiException e) {
    // Thrown if nothing matches the predicate, or if the search fails to
    // converge after 10 attempts.
    System.err.println(e.getMessage());
}
```

*(Adapted from `QuantumAlgorithmTest.testGroverSearchAlgorithm`.)*

---

## 8. Quantum Fourier Transform

`Qft` builds an exact QFT from local Hadamard, controlled-phase, and swap
gates. `forward(n)` creates a standalone circuit; use `appendForward` or
`appendInverse` to apply it to part of a larger circuit. Targets are ordered
most-significant first and may be non-adjacent.

```java
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.Qft;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;

Circuit allQubits = Qft.forward(3); // forward QFT over q0, q1, q2

Circuit circuit = new Circuit(4);
Qft.appendForward(circuit, 3, 1); // q3 is the MSB of this two-qubit QFT
Qft.appendInverse(circuit, 3, 1); // restores the original sub-register state

LocalSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
```

The builder validates each target against the circuit, preserves qubits outside
the requested sub-register, and obeys the circuit's configured qubit limit.
The exact transform uses a quadratic number of gates; approximate and
measurement-based QFT variants are not included.

### Using QFT in jqapi studio

The browser editor's **Multi-qubit** palette contains a forward **QFT** macro.
Select the number of contiguous qubits to transform, then drop QFT on the
register's most-significant wire. The editor inserts the same Hadamard,
controlled-phase, and swap decomposition, shifting later gates so their order
is preserved. The resulting circuit can be run, saved, and shared normally.

Internally `search` builds a Grover oracle that marks every matching index,
selects the iteration count from the ratio of marked states to the padded search
space (`N = 2^ceil(log2(list size))`), measures, and verifies the candidate
against the predicate. It throws:

- `JQApiException("No element found ...")` if the predicate matches nothing.
- `JQApiException("Grover search did not converge after 10 attempts")` if every
  attempt yields an unlucky measurement.

---

## 9. Reproducible shot sampling

Use the core sampler to collect repeated measurements and reproduce an experiment
with an explicit seed. Each shot executes the circuit from its initial state,
including any intermediate measurements or resets.

```java
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.simulator.CircuitSampler;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;
import org.aitan.jqapi.quantum.simulator.SamplingResult;

Circuit bell = new Circuit(2, JQAPIConfig.sequential(2));
CircuitLevel h = new CircuitLevel();
h.addGate(new Hadamard(0));
CircuitLevel cx = new CircuitLevel();
cx.addGate(new ControlledNot(0, 1));
bell.addLevel(h, cx);

SamplingOptions options = new SamplingOptions(4096).withSeed(107L);
SamplingResult result = CircuitSampler.sample(bell, options);
int[] counts = result.counts(); // [00, 01, 10, 11]: only 00 and 11 occur
int[] q0Counts = result.marginal(0).counts(); // [0, 1], total remains 4096
int[] repeated = CircuitSampler.sample(bell, options).counts(); // same counts
```

The first requested output qubit is the most significant bit. To sample a subset,
use `options.withMeasuredQubits(1)`; to choose a different starting state, pass a
normalized complex state vector as the third argument to `sample`.

Seeds reproduce results within the same library version and runtime/execution
configuration. JVM/TeaVM stream equality is not guaranteed. Omitting `withSeed`
uses secure randomness. Neither seeds nor shot counts belong in saved circuit
specifications. Requests exceeding the shot limit (10,000) or work budget are
rejected; see [sampling options and limits](../api/simulator.md#circuitsampler).

---

For the exact class and method signatures used above, consult the
[API Reference](../api/README.md).


## 10. Classical feed-forward

Store a measurement separately from the quantum state, reset the measured qubit,
and use the retained bit to correct a different qubit:

```java
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.simulator.CircuitSampler;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;

Circuit circuit = new Circuit(2, 1); // two qubits, one classical bit
Gate[] operations = {
    new Hadamard(0),
    Measurement.into(0, 0),
    new Reset(0),
    new ConditionalGate(new PauliX(1), new Condition(0, 1))
};
for (Gate gate : operations) {
    CircuitLevel level = new CircuitLevel();
    level.addGate(gate);
    circuit.addLevel(level);
}
LocalSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
int outcome = simulator.extractClassicalRecords().get(0).bit();
// q0 is zero; q1 equals outcome. Quantum reset has preserved the classical bit.
var sampled = CircuitSampler.sample(circuit,
        new SamplingOptions(1024).withSeed(110).withClassicalBits(0));
System.out.println(java.util.Arrays.toString(sampled.classicalCounts()));
```

For teleportation, use three qubits and two classical bits. After Bell preparation
and Alice's CNOT/Hadamard, store measurements of q0 and q1 in c0 and c1. Apply
`ConditionalGate(new PauliX(2), new Condition(1, 1))`, followed by
`ConditionalGate(new PauliZ(2), new Condition(0, 1))`. The test
`BellTeleportationClassicalTest` checks all four measurement branches on basis,
superposition, and complex input states against the transferred amplitudes.

Circuits with classical operations use CircuitSpec v2. Java and the TeaVM bridge
execute them; the grid editor supports the implicit c[q] subset described in
[the teleportation walkthrough](#5-quantum-teleportation). The ASCII renderer
continues to reject classical operations explicitly.
See [the format and execution contract](../api/classical-design.md).

## 11. Expectation values of a Hamiltonian

The energy of a one-parameter ansatz, the core step of a variational algorithm
(VQE). It is computed exactly from the state vector and estimated from shots, as
in `Issue108ConsumerFixtureTest`:

```java
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.Expectation;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.quantum.simulator.ExpectationSampler;
import org.aitan.jqapi.quantum.simulator.SampledExpectation;
import org.aitan.jqapi.quantum.simulator.SamplingOptions;

double theta = 2.1;
Circuit ansatz = new Circuit(1);
CircuitLevel level = new CircuitLevel();
level.addGate(new Ry(theta, 0));
ansatz.addLevel(level);

// H = Z + 0.5 X, whose expectation on Ry(θ)|0> is cos θ + 0.5 sin θ
PauliSum h = PauliSum.of(
        new PauliSum.Term(1.0, PauliString.fromLabel("Z")),
        new PauliSum.Term(0.5, PauliString.fromLabel("X")));

LocalSimulator simulator = new LocalSimulator(ansatz);
simulator.execute();
ComplexVector psi = simulator.getQuantumRegister().getRegisterState();
double exact = Expectation.of(psi, h);

SampledExpectation sampled = ExpectationSampler.estimate(ansatz, h,
        new SamplingOptions(10_000).withSeed(32));
// |sampled.value() - exact| is a few sampled.standardError() at most
```

Each non-identity term gets the requested number of shots (at least 2);
`sampled.terms()` reports the shots, mean and variance per term. Labels have
one letter per qubit with qubit 0 first, so on three qubits `"ZIZ"` correlates
qubits 0 and 2. See the [observables reference](../api/observables.md) and the
[estimator](../api/simulator.md#expectationsampler).

### Observables in jqapi studio

The browser editor has an **Observable ⟨H⟩** panel under the results. Write one
term per line — an optional coefficient and one Pauli letter per qubit, q0
first — and press **Run**. For the preset *Bell State |Φ⁺⟩*:

```text
ZZ
0.5 XX
-1 YY
```

gives `2.5000` exactly and the same sampled value with standard error 0, because
the Bell state is an eigenstate of each term. The table lists the exact value,
sampled mean and shots of every term. Invalid lines are reported with their
line number while you type. Circuits with measurement or reset show only the
sampled estimate, and a single shot shows only the exact value. The observable
is not saved in circuit files or shared links.

## 12. Phase estimation with composable unitaries

`UnitaryOperation` turns gates into a reusable block that can be inverted,
repeated, controlled and placed on any qubits, without building a
full-register matrix. Here two counting qubits estimate the eigenphase `1/4`
of `U = P(pi/2) (x) P(pi/2) · CZ` on the entangled target
`(|01> + i|10>)/sqrt(2)`:

```java
UnitaryOperation u = UnitaryOperation.of(2,
        new Phase(Math.PI / 2, 0), new Phase(Math.PI / 2, 1), new ControlledZ(0, 1));

Circuit circuit = new Circuit(4);                 // q0,q1 counting; q2,q3 target
CircuitLevel h = new CircuitLevel();
h.addGate(new Hadamard(0, 1));
circuit.addLevel(h);
u.controlledPower(2).appendTo(circuit, 0, 2, 3);  // counting MSB controls U^2
u.controlledPower(1).appendTo(circuit, 1, 2, 3);
Qft.appendInverse(circuit, 0, 1);

double r = 1 / Math.sqrt(2);
Complex[] amplitudes = new Complex[16];
Arrays.fill(amplitudes, Complex.ZERO);
amplitudes[0b0001] = new Complex(r, 0);           // |00>|01>
amplitudes[0b0010] = new Complex(0, r);           // |00>|10>
LocalSimulator simulator = new LocalSimulator(circuit, new ComplexVector(amplitudes), () -> 0.5);
simulator.execute();
// the counting register is |01> with probability 1: phase = 1/4
```

`controlledPower(k)` repeats `U` `k` times, so the step count grows with the
power; `power(k, maxSteps)` makes that budget explicit and throws
`JQApiLimitException` before building anything too large. Measurement, reset
and conditional gates are rejected. See the
[API reference](../api/quantum.md#unitaryoperation).

## 13. Hamiltonian time evolution

A Hamiltonian describes how a quantum state changes over time. Write it as a
weighted sum of Pauli words and approximate `U(t) = exp(-i H t)` with small
rotation slices. This example evolves `|0>` under `H = 0.6 X - 0.8 Z + 0.2 I`:

```java
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.observable.PauliString;
import org.aitan.jqapi.observable.PauliSum;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.TrotterEvolution;
import org.aitan.jqapi.quantum.UnitaryOperation;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;

public class HamiltonianEvolutionExample {
    public static void main(String[] args) {
        PauliSum h = PauliSum.of(
                new PauliSum.Term(0.6, PauliString.fromLabel("X")),
                new PauliSum.Term(-0.8, PauliString.fromLabel("Z")),
                new PauliSum.Term(0.2, PauliString.fromLabel("I")));
        double time = 0.7;
        int slices = 16;
        UnitaryOperation evolution = TrotterEvolution.secondOrder(h, time, slices, 1_000);
        Circuit circuit = new Circuit(1);
        evolution.appendTo(circuit);
        LocalSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        ComplexVector state = simulator.getQuantumRegister().getRegisterState();
        System.out.println(state.getEntry(0));
        System.out.println(state.getEntry(1));
    }
}
```

For this Hamiltonian, `(0.6 X - 0.8 Z)² = I`, so the exact state is
`exp(-i 0.2 t) [(cos(t) + i 0.8 sin(t)) |0> - i 0.6 sin(t) |1>]`.
Increasing the slice count reduces the approximation error; second order
usually converges faster but emits twice as many gates per slice. The example
uses 160 gates, within its explicit budget of 1,000. `firstOrder(h, time, slices)`
is available for comparison. The budget counts all emitted gates, including
basis changes and parity CNOTs, rather than just slices.

For multi-qubit models each label has one letter per qubit, qubit 0 first:
`"XIZ"` acts on qubits 0 and 2 and leaves qubit 1 unchanged. The same `PauliSum`
can be used with expectation-value calculations and variational algorithms.

To use the evolution in a phase-estimation circuit, call
`evolution.controlledPower(k).appendTo(circuit, control, targets...)` as in
[example 12](#12-phase-estimation-with-composable-unitaries). The identity term
must be retained: its otherwise global phase becomes a measurable relative
phase under control. For energy E, the eigenphase is `-E t / (2π)` modulo 1;
recovering an unambiguous energy requires a suitable time and known energy
range. Controlled powers repeat the approximate evolution and have their own
`UnitaryOperation` gate budget.

See [TrotterEvolution](../api/quantum.md#trotterevolution) for ordering,
validation, resource limits and the convergence-test convention.
