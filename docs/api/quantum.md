# Quantum Core — `org.aitan.jqapi.quantum`

The core domain model: qubits, the multi-qubit register, and the circuit
structure that gates are organized into.

- [Back to API index](README.md)
- Related: [Gates](gates.md) · [Simulator](simulator.md) · [Math](math.md)

## Contents

- [Qubit](#qubit-abstract)
- [QubitZero](#qubitzero)
- [QubitOne](#qubitone)
- [QubitSuperposition](#qubitsuperposition)
- [QuantumRegister](#quantumregister)
- [Circuit](#circuit)
- [CircuitLevel](#circuitlevel)

> **Conventions.** Qubit `0` is the most significant bit of a state index; a
> register of `n` qubits holds a `2^n` amplitude vector. See the
> [index](README.md#conventions).

---

## `Qubit` (abstract)

Abstract single-qubit state, backed by a two-component complex amplitude vector
`[a, b]` representing `a|0> + b|1>`. Concrete subclasses are
[`QubitZero`](#qubitzero), [`QubitOne`](#qubitone) and
[`QubitSuperposition`](#qubitsuperposition).

Constructors are `protected` — instantiate one of the subclasses instead.

### Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `zeroProbability()` | `double` | Probability of measuring `\|0>` (abstract). |
| `oneProbability()` | `double` | Probability of measuring `\|1>` (abstract). |
| `getValue()` | `ComplexVector` | The 2-component complex amplitude vector. |
| `toString()` | `String` | Dirac-notation rendering, e.g. `\|ψ>=\|0>`. |
| `equals(Object)` | `boolean` | Compares amplitudes rounded to 4 decimal places; instances of different concrete classes are never equal. |
| `hashCode()` | `int` | Constant. |

> **Note on `equals`.** Two qubits are equal only if they are of the **same
> concrete class** *and* their amplitudes agree to 4 decimals. Consequently
> `new QubitZero().equals(new QubitSuperposition(1))` is `false` even though the
> states coincide. Measurement results are always `QubitZero`/`QubitOne`, so
> comparing a measured result against `new QubitZero()` / `new QubitOne()` is the
> idiomatic check.

```java
Qubit q = new QubitSuperposition(0.4);
q.oneProbability();  // 0.84
q.zeroProbability(); // 0.16
```

---

## `QubitZero`

The computational basis state `|0>` (amplitudes `[1, 0]`).

| Constructor | Description |
|-------------|-------------|
| `QubitZero()` | Creates the `\|0>` state. |

`zeroProbability()` returns `1.0`; `oneProbability()` returns `0.0`.

```java
Qubit zero = new QubitZero();
```

---

## `QubitOne`

The computational basis state `|1>` (amplitudes `[0, 1]`).

| Constructor | Description |
|-------------|-------------|
| `QubitOne()` | Creates the `\|1>` state. |

`zeroProbability()` returns `0.0`; `oneProbability()` returns `1.0`.

```java
Qubit one = new QubitOne();
```

---

## `QubitSuperposition`

An arbitrary normalized single-qubit state.

| Constructor | Parameters | Notes |
|-------------|------------|-------|
| `QubitSuperposition(double alpha)` | `alpha` = amplitude of `\|0>` | The `\|1>` amplitude is computed as `sqrt(1 - alpha^2)`. |
| `QubitSuperposition(Complex a)` | `a` = complex amplitude of `\|0>` | The `\|1>` amplitude is `a.sqrt1z()` (i.e. `sqrt(1 - a^2)`). |
| `QubitSuperposition(ComplexVector vector)` | 2-element amplitude vector | Validated on construction. |

### Throws

- `IllegalArgumentException` — from the `ComplexVector` constructor if the vector
  does not have dimension 2 (`"Qubit must have 2 complex value"`) or if the total
  probability (rounded to 2 decimals) is not `1.0`
  (`"Qubit must have total probability of 1"`).

`zeroProbability()` / `oneProbability()` return `|amplitude|^2` rounded to 4
decimals.

```java
// alpha is the |0> amplitude; here P(0) = 0.16, P(1) = 0.84
Qubit q = new QubitSuperposition(0.4);

// Equal superposition (|0> + |1>)/sqrt(2)
Qubit plus = new QubitSuperposition(1 / Math.sqrt(2));
```

---

## `QuantumRegister`

Holds the quantum state of `size` qubits as a `2^size` complex amplitude
vector. Supports full and partial measurement.

### Constructors

| Constructor | Description |
|-------------|-------------|
| `QuantumRegister(int size)` | Register of `size` qubits initialized to `\|0...0>`. |
| `QuantumRegister(int size, Qubit[] qubits)` | Initialized from explicit per-qubit states. |
| `QuantumRegister(int size, double... alphas)` | Initialized from `\|0>`-amplitude coefficients (each becomes a `QubitSuperposition(alpha)`). |

Normally you do not construct a register directly — the
[`LocalSimulator`](simulator.md) creates one for you from the circuit. Use these
constructors only for manual state setup.

### Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getSize()` | `int` | Number of qubits. |
| `getRegisterState()` | `ComplexVector` | The full `2^size` complex amplitude vector (live, mutable). |
| `setRegisterState(ComplexVector)` | `void` | Replaces the amplitude vector. Throws `IllegalArgumentException` on dimension mismatch. |
| `getInput()` | `Qubit[]` | The per-qubit states the register was initialized with. |
| `getResult()` | `Qubit[]` | The measured qubits; populated by `measure()` / `measureQubitAtIndexes(...)`. |
| `measure()` | `void` | Collapses the whole register to a basis state per current probabilities. |
| `measureQubitAtIndexes(List<Integer>)` | `void` | Measures only the listed qubits, renormalizing the residual state. |
| `getQubitRegisterState()` | `Qubit[]` | Factorizes a **separable** state into single qubits. |

### `measure()`

Samples a basis state according to `|amplitude|^2`, sets the state vector to
that basis state, and fills `getResult()` with `QubitZero`/`QubitOne` per bit.
After this call the state is a definite computational basis state.

### `measureQubitAtIndexes(List<Integer> indexes)`

Measures only the given qubit positions. If `indexes.size() >= size` it delegates
to `measure()`. Each measured qubit collapses to `QubitZero`/`QubitOne` in
`getResult()[index]`, and the surviving amplitudes are renormalized (dividing by
`sqrt(branch probability)`), which **preserves relative phases** of the residual
state.

- **Throws** `IllegalStateException` if a qubit collapses to a zero-probability
  branch (`"Qubit N collapsed to a zero-probability branch"`).

### `getQubitRegisterState()`

Factorizes the register state into one `Qubit` per position, derived from each
qubit's marginal probabilities.

- **Only valid for separable (non-entangled) states.** Relative phases of the
  individual qubits are **not** recovered.
- **Throws** `IllegalStateException` if the state is entangled
  (`"Register state is entangled and cannot be factorized ..."`) — for such
  states use `measure()` or read `getRegisterState()` directly.

```java
// Read the raw state vector after execution
QuantumRegister qreg = simulator.getQuantumRegister();
ComplexVector state = qreg.getRegisterState();

// Full measurement, then inspect each qubit
qreg.measure();
Qubit q0 = qreg.getResult()[0];
boolean isZero = q0.equals(new QubitZero());

// Partial measurement of qubit 0 only
qreg.measureQubitAtIndexes(java.util.Arrays.asList(0));

// Factorize a separable state (throws if entangled)
Qubit[] qubits = qreg.getQubitRegisterState();
```

---

## `Circuit`

A quantum circuit: an ordered sequence of [`CircuitLevel`](#circuitlevel)s
applied to a register of `inputSize` qubits, executed left to right by a
[simulator](simulator.md).

### Constructor

| Constructor | Parameter | Description |
|-------------|-----------|-------------|
| `Circuit(int inputSize)` | `inputSize` = number of qubits | Creates an empty circuit over `inputSize` qubits. |

### Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getInputSize()` | `int` | Number of qubits the circuit operates on. |
| `setInputSize(int)` | `void` | Sets the qubit count. |
| `getLevels()` | `List<CircuitLevel>` | The ordered levels. |
| `addLevel(CircuitLevel... levels)` | `void` | Appends one or more levels, in order. |

### `addLevel(CircuitLevel...)`

Appends levels and **auto-fills** each level: every qubit not touched by a gate
in that level receives an implicit [`Identity`](gates.md#identity) gate, so all
qubits are accounted for at every time-step.

- **Throws** `IllegalArgumentException` if a gate in the level acts on more
  qubits than the circuit size, or references an index outside `[0, inputSize)`
  (`"Adding gate that affect more qubits than circuit size or qubits out of
  register indexes"`).

```java
Circuit circuit = new Circuit(2);          // 2 qubits
CircuitLevel level1 = new CircuitLevel();
level1.addGate(new Hadamard(0));
CircuitLevel level2 = new CircuitLevel();
level2.addGate(new ControlledNot(0, 1));
circuit.addLevel(level1, level2);          // Bell-state circuit
```

---

## `CircuitLevel`

A single time-step of a [`Circuit`](#circuit): a set of gates applied in
parallel to **distinct** qubits.

### Constructor

| Constructor | Description |
|-------------|-------------|
| `CircuitLevel()` | Creates an empty level. |

### Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `addGate(Gate gate)` | `void` | Adds a gate to this level. |
| `getGates()` | `List<Gate>` | Gates applied during this level. |
| `setGates(List<Gate>)` | `void` | Replaces the gate list. |

### `addGate(Gate)`

- **Throws** `IllegalArgumentException` if the gate touches a qubit already used
  by another gate in the same level (`"Adding gate that affects a qubit already
  involved in this circuit level"`).

```java
CircuitLevel level = new CircuitLevel();
level.addGate(new Hadamard(0));
level.addGate(new PauliX(1));   // OK: different qubit
// level.addGate(new PauliZ(0)); // would throw: qubit 0 already used
```
