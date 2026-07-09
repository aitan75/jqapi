# Core Concepts

This chapter introduces the building blocks of jqapi in the order you meet them
when writing a program. Each concept links to its [API reference](../api/README.md).

- [Back to the manual](README.md)

## Contents

1. [Qubits](#1-qubits)
2. [The amplitude vector and Dirac notation](#2-the-amplitude-vector-and-dirac-notation)
3. [Gates](#3-gates)
4. [Circuit levels](#4-circuit-levels)
5. [Circuits](#5-circuits)
6. [The quantum register](#6-the-quantum-register)
7. [The simulator](#7-the-simulator)
8. [Measurement](#8-measurement)
9. [Ordering conventions](#9-ordering-conventions)

---

## 1. Qubits

A **qubit** is the quantum analogue of a bit. Instead of being just `0` or `1`,
it is a combination (superposition) `a|0> + b|1>`, where `a` and `b` are complex
numbers (amplitudes) whose squared magnitudes are the probabilities of measuring
`0` or `1`. jqapi models a qubit as an abstract
[`Qubit`](../api/quantum.md#qubit-abstract) with three concrete types:

| Type | Meaning | Constructor |
|------|---------|-------------|
| [`QubitZero`](../api/quantum.md#qubitzero) | The basis state `\|0>` | `new QubitZero()` |
| [`QubitOne`](../api/quantum.md#qubitone) | The basis state `\|1>` | `new QubitOne()` |
| [`QubitSuperposition`](../api/quantum.md#qubitsuperposition) | Any normalized state | `new QubitSuperposition(alpha)` |

```java
Qubit zero = new QubitZero();
Qubit one  = new QubitOne();

// alpha is the |0> amplitude; |1> amplitude is sqrt(1 - alpha^2).
Qubit q = new QubitSuperposition(0.4);
q.zeroProbability(); // 0.16
q.oneProbability();  // 0.84

// Equal superposition (|0> + |1>)/sqrt(2)
Qubit plus = new QubitSuperposition(1 / Math.sqrt(2));
```

> A `QubitSuperposition` is validated on construction: a two-element amplitude
> vector whose probabilities do not sum to 1 raises `IllegalArgumentException`.

### Comparing qubits

`Qubit.equals` compares amplitudes rounded to 4 decimals **and** requires the
same concrete class. Since measurement always yields `QubitZero`/`QubitOne`, the
idiomatic test is:

```java
if (qreg.getResult()[0].equals(new QubitZero())) { /* measured 0 */ }
```

---

## 2. The amplitude vector and Dirac notation

Every qubit wraps a two-component [`ComplexVector`](../api/math.md#complexvector)
`[a, b]`, retrievable with `getValue()`. Multi-qubit states are formed by the
**tensor product** of single-qubit vectors:

```java
// |1> ⊗ |0>  ->  the 4-dim vector for the basis state |10>
ComplexVector state = new QubitZero().getValue()
        .tensorProduct(new QubitOne().getValue());
```

`Qubit.toString()` renders states in Dirac ("bra-ket") notation, e.g.
`|ψ>=|0>` or `|ψ>=(0.7,0.0)|0>+(0.7,0.0)|1>`.

---

## 3. Gates

A **gate** is a reversible operation on one or more qubits, represented by a
unitary matrix. You add gates to a circuit; you rarely touch their matrices
directly. See the full [gate catalog](../api/gates.md). The essentials:

- **Single-qubit:** `Identity`, `Hadamard`, `PauliX` (NOT), `PauliY`, `PauliZ`,
  `PauliS`, `PauliT`. Constructor takes one or more indexes:
  `new Hadamard(0)` or `new Hadamard(0, 1, 2)` (same gate on each).
- **Parametric single-qubit:** `Rx(θ)`, `Ry(θ)`, `Rz(θ)`, `Phase(θ)`, and the
  universal `U3(θ, φ, λ)`. The angle(s) come first, then the indexes:
  `new Rx(Math.PI/2, 0)` or `new U3(θ, φ, λ, 0)`.
- **Multi-qubit:** `ControlledNot(control, target)`, `ControlledY`,
  `ControlledZ`, `Swap(a, b)`, `ControlledSwap(control, a, b)`,
  `Toffoli(c1, c2, target)`, and the generic
  `MultiControlled(u, numControls, controls..., targets...)` for Cᵐ(U).
- **Custom:** `Oracle(matrix, indexes...)` and
  `GenericGate(matrix, size, indexes...)` wrap a matrix you supply.
- **Measurement:** `Measurement(indexes...)` collapses qubits mid-circuit.

```java
new Hadamard(0);            // superpose qubit 0
new PauliX(1);              // flip qubit 1
new ControlledNot(0, 2);    // control=0, target=2 (may be non-adjacent)
new Toffoli(0, 1, 2);       // flip qubit 2 iff qubits 0 and 1 are |1>
```

---

## 4. Circuit levels

A [`CircuitLevel`](../api/quantum.md#circuitlevel) is a single **time-step**: a
set of gates that act on **distinct** qubits and are applied together. You cannot
put two gates on the same qubit in one level — that raises
`IllegalArgumentException`.

```java
CircuitLevel level = new CircuitLevel();
level.addGate(new Hadamard(0));
level.addGate(new PauliX(1));   // OK: qubit 1 is free
// level.addGate(new PauliZ(0)); // would throw: qubit 0 already used
```

---

## 5. Circuits

A [`Circuit`](../api/quantum.md#circuit) is an ordered list of levels over a
fixed number of qubits (`inputSize`). Levels execute left to right.

```java
Circuit circuit = new Circuit(2);          // 2 qubits
CircuitLevel l1 = new CircuitLevel();
l1.addGate(new Hadamard(0));
CircuitLevel l2 = new CircuitLevel();
l2.addGate(new ControlledNot(0, 1));
circuit.addLevel(l1, l2);
```

When you call `addLevel`, jqapi **auto-fills** each level with `Identity` gates
on any qubit you did not touch, so every qubit is defined at every step. Adding a
gate that references a qubit outside `[0, inputSize)` raises
`IllegalArgumentException`.

---

## 6. The quantum register

A [`QuantumRegister`](../api/quantum.md#quantumregister) holds the live quantum
state of all qubits as a single `2^n` amplitude vector. You normally obtain it
from the simulator rather than constructing it yourself:

```java
QuantumRegister qreg = simulator.getQuantumRegister();
ComplexVector state = qreg.getRegisterState(); // the raw 2^n amplitudes
```

Key methods:

- `getRegisterState()` — the full amplitude vector.
- `getInput()` — the per-qubit states the register started from.
- `measure()` / `measureQubitAtIndexes(...)` — collapse the state (see below).
- `getResult()` — the measured qubits, after a measurement call.
- `getQubitRegisterState()` — factorize a **separable** state into single qubits
  (throws `IllegalStateException` on entangled states).

---

## 7. The simulator

The [`LocalSimulator`](../api/simulator.md#localsimulator) executes a circuit.
Construct it with the circuit (optionally with initial qubit states or amplitude
coefficients), call `execute()`, then read the register.

```java
// Start from |0...0>
QuantumSimulator sim = new LocalSimulator(circuit);

// ...or from explicit qubits
QuantumSimulator sim2 = new LocalSimulator(circuit, new QubitOne(), new QubitZero());

// ...or from |0>-amplitude coefficients (each becomes a QubitSuperposition)
QuantumSimulator sim3 = new LocalSimulator(circuit, 0.5, 0.8);

sim.execute();
QuantumRegister qreg = sim.getQuantumRegister();
```

The number of supplied inputs must match `circuit.getInputSize()`, otherwise the
constructor throws `IllegalArgumentException`.

Because measurement is random, run the simulator in a loop — creating a **fresh**
`LocalSimulator` each iteration — when you want a statistical distribution.

---

## 8. Measurement

Measurement collapses the superposition into a definite classical outcome.

### Full measurement — `measure()`

Samples a basis state according to `|amplitude|^2`, sets the register to that
basis state, and fills `getResult()` with `QubitZero`/`QubitOne` per qubit.

```java
qreg.measure();
Qubit q0 = qreg.getResult()[0]; // QubitZero or QubitOne
```

### Partial measurement — `measureQubitAtIndexes(List<Integer>)`

Measures only the listed qubits and **renormalizes** the residual state,
preserving relative phases. This is what the `Measurement` gate does mid-circuit.

```java
qreg.measureQubitAtIndexes(java.util.Arrays.asList(0)); // measure qubit 0 only
```

### Reading a state without measuring — `getQubitRegisterState()`

For a **separable** (non-entangled) state you can factorize the register back
into individual qubits without collapsing it:

```java
Qubit[] qubits = qreg.getQubitRegisterState(); // throws if entangled
```

An entangled state (e.g. a Bell state) cannot be factorized and this method
throws `IllegalStateException` on purpose — use `measure()` or read
`getRegisterState()` instead. Note that factorization is derived from marginal
probabilities, so per-qubit relative phases are not recovered.

---

## 9. Ordering conventions

Two conventions matter for reading results correctly:

1. **Qubit 0 is the most significant bit** of the state index. For 3 qubits, the
   basis state `|q0 q1 q2>` sits at index `q0*4 + q1*2 + q2`.
2. **In a multi-qubit gate, the first declared qubit is the most significant**
   bit of the gate matrix. So in `new ControlledNot(control, target)` the control
   is the first qubit.

With these in mind you can predict, for example, that a `ControlledNot(0, 2)`
applied to `|100>` yields `|101>`.

Continue to the [worked examples](examples.md).
