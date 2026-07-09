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

Teleportation transfers the state of one qubit (`q`) onto another (`b`) using an
entangled pair and a mid-circuit `Measurement`. The circuit uses three qubits:
`q = 0` (state to teleport), `a = 1` and `b = 2` (the entangled pair).

```java
final int q = 0, a = 1, b = 2;
Circuit circuit = new Circuit(3);
CircuitLevel l1 = new CircuitLevel();
CircuitLevel l2 = new CircuitLevel();
CircuitLevel l3 = new CircuitLevel();
CircuitLevel l4 = new CircuitLevel();
CircuitLevel l5 = new CircuitLevel();
CircuitLevel l6 = new CircuitLevel();
CircuitLevel l7 = new CircuitLevel();
l1.addGate(new Hadamard(a));
l2.addGate(new ControlledNot(a, b));   // entangle the a,b pair
l3.addGate(new ControlledNot(q, a));
l4.addGate(new Hadamard(q));
l5.addGate(new Measurement(q, a));     // measure q and a mid-circuit
l6.addGate(new ControlledNot(a, b));   // classically-controlled corrections
l7.addGate(new ControlledZ(q, b));
circuit.addLevel(l1, l2, l3, l4, l5, l6, l7);

// Initialize qubit q to a superposition (|0>-amplitude 0.8); a and b to |1>.
QuantumSimulator simulator = new LocalSimulator(circuit, 0.8, 1, 1);
simulator.execute();
QuantumRegister qreg = simulator.getQuantumRegister();

Qubit[] input  = qreg.getInput();
Qubit[] output = qreg.getQubitRegisterState();
// The original state of q now lives on b:
assert input[q].equals(output[b]);
```

*(Adapted from `JavaQuantumAPITest.testQuantumTeleportation`.)*

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

Internally `search` builds a Grover oracle that marks the matching indexes,
applies on the order of `pi*sqrt(N)/4` Grover iterations (oracle + diffusion,
where `N = 2^ceil(log2(list size))`), measures, and verifies the candidate
against the predicate. It throws:

- `JQApiException("No element found ...")` if the predicate matches nothing.
- `JQApiException("Grover search did not converge after 10 attempts")` if every
  attempt yields an unlucky measurement.

---

For the exact class and method signatures used above, consult the
[API Reference](../api/README.md).
