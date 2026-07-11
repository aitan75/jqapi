# jqapi API Reference

Developer-facing reference for **jqapi** (Java Quantum API) `1.0.0`, a Java
library for building and simulating quantum-computing circuits with a local
state-vector simulator.

- **Package root:** `org.aitan.jqapi`
- **Requirements:** Java 21+, Maven 3.9+
- **Runtime dependencies:** none (Java 21 standard library only)

If you are new to the library, start with the [User Manual](../manual/README.md);
this reference documents the public API surface class by class.

---

## Conventions

These conventions apply throughout the API and are essential to reading the
signatures below:

- **Qubit ordering.** Qubit `0` is the **most significant bit** of the state
  index. For a 3-qubit register the basis state `|q0 q1 q2>` maps to the integer
  index `q0*4 + q1*2 + q2`.
- **Multi-qubit gate ordering.** Within a multi-qubit gate the **first declared
  qubit is the most significant** bit of the gate matrix. For example, in
  `new ControlledNot(control, target)` the control is the first (most
  significant) qubit.
- **State vector size.** A register of `n` qubits holds a `2^n` complex
  amplitude vector.
- **Zero-based indexing.** All qubit indexes are zero-based and must satisfy
  `0 <= index < inputSize`.

---

## Subsystems

| Subsystem | Package | Reference |
|-----------|---------|-----------|
| Quantum core (qubits, register, circuit) | `org.aitan.jqapi.quantum` | [quantum.md](quantum.md) |
| Gates | `org.aitan.jqapi.quantum.gates` | [gates.md](gates.md) |
| Simulator | `org.aitan.jqapi.quantum.simulator` | [simulator.md](simulator.md) |
| Linear algebra | `org.aitan.jqapi.math` | [math.md](math.md) |
| Visualization (spec + ASCII renderer) | `org.aitan.jqapi.visualization` | [visualization.md](visualization.md) |
| Algorithms & utilities | `org.aitan.jqapi`, `org.aitan.jqapi.utils`, `org.aitan.jqapi.exceptions` | (below) |

---

## Package overview

### `org.aitan.jqapi.quantum` — [full reference](quantum.md)

The core domain model.

| Class | Responsibility |
|-------|----------------|
| `Qubit` (abstract) | Base single-qubit state holding a 2-component amplitude vector. |
| `QubitZero` | The `\|0>` basis state. |
| `QubitOne` | The `\|1>` basis state. |
| `QubitSuperposition` | An arbitrary normalized single-qubit state. |
| `QuantumRegister` | The `2^n` amplitude state of `n` qubits; supports full and partial measurement. |
| `Circuit` | An ordered sequence of `CircuitLevel`s over a fixed number of qubits. |
| `CircuitLevel` | A single time-step: gates applied in parallel to distinct qubits. |

### `org.aitan.jqapi.quantum.gates` — [full reference](gates.md)

The gate library. `Gate` is the abstract base; every concrete gate wraps a
unitary `ComplexMatrix` and the qubit indexes it acts on.

Single-qubit: `Identity`, `Hadamard`, `PauliX`, `PauliY`, `PauliZ`, `PauliS`,
`PauliT`, `Measurement`, `Reset`.
Parametric single-qubit: `Rx`, `Ry`, `Rz`, `Phase`, `U3`.
Multi-qubit: `ControlledNot`, `ControlledY`, `ControlledZ`, `Swap`,
`ControlledSwap`, `Toffoli`, `MultiControlled` (generic Cᵐ(U)).
Custom: `Oracle`, `GenericGate` (both wrap a user-supplied matrix).

### `org.aitan.jqapi.quantum.simulator` — [full reference](simulator.md)

| Type | Responsibility |
|------|----------------|
| `QuantumSimulator` (interface) | Runs a circuit and exposes the resulting register. |
| `LocalSimulator` | State-vector implementation that applies gates directly to the amplitude vector. |

### `org.aitan.jqapi.math` — [full reference](math.md)

| Class | Responsibility |
|-------|----------------|
| `ComplexVector` | Complex-valued vector with tensor product and factorization helpers. |
| `ComplexMatrix` | Complex-valued matrix with identity and Kronecker-product factories. |

### `org.aitan.jqapi` — algorithms

**`Algorithm`** — a collection of static helpers implementing ready-made
quantum algorithms.

| Method | Signature | Description |
|--------|-----------|-------------|
| `randomBit` | `static int randomBit()` | Produces a uniformly random bit (0 or 1) via a Hadamard coin flip. |
| `search` | `static <T> T search(List<T> list, Function<T,Boolean> predicate)` | Grover search: returns the first list element matching `predicate`. Throws `JQApiException`. |

```java
// A single quantum-random bit
int bit = Algorithm.randomBit(); // 0 or 1, ~50/50

// Grover search over a classical list
List<Person> people = ...;
Person match = Algorithm.search(people, p -> p.age() == 45 && p.name().startsWith("P"));
```

`search` requires that exactly the matching elements be marked by the oracle it
builds internally; it throws `JQApiException("No element found ...")` when the
predicate matches nothing, and
`JQApiException("Grover search did not converge ...")` if the probabilistic
result fails classical verification after 10 attempts.

### `org.aitan.jqapi.utils` — helpers

**`Utils`** — static bit-manipulation helpers (final, non-instantiable).

| Method | Signature | Description |
|--------|-----------|-------------|
| `toBinary` | `static String toBinary(int number, int length)` | Zero-padded binary string of `number` with `length` digits. |
| `bitAtIndex` | `static int bitAtIndex(int index, int number, int length)` | The bit (0/1) at position `index` of the `length`-digit binary representation of `number`, counting from the most significant bit. |

**`Constants`** — public unitary matrices and label strings (`HADAMARD_MATRIX`,
`PAULI_X_MATRIX`, `CONTROLLED_NOT_MATRIX`, `TOFFOLI_MATRIX`, etc.) used to
build the gates. Referenced when constructing custom `Oracle`/`GenericGate`
matrices.

### `org.aitan.jqapi.exceptions` — errors

**`JQApiException extends Exception`** — checked exception thrown by
`Algorithm.search`. Constructor: `JQApiException(String message)`.

---

## Math types

The public API exposes jqapi's own linear-algebra types (no third-party
dependency):

- `org.aitan.jqapi.math.Complex` — the scalar amplitude type used throughout
  (`Complex.ONE`, `Complex.ZERO`, `Complex.I`).
- `ComplexVector` and `ComplexMatrix` — dense complex vector/matrix types
  backed by primitive `double[]`, exposing `getEntry`, `setEntry`, `operate`,
  `getDimension`, `getData`, and the tensor/Kronecker operations.

See [math.md](math.md) for details.
