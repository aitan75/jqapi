# Gates — `org.aitan.jqapi.quantum.gates`

The gate library. Every gate wraps a unitary [`ComplexMatrix`](math.md) and the
list of qubit indexes it acts on.

- [Back to API index](README.md)
- Related: [Quantum core](quantum.md) · [Simulator](simulator.md) · [Math](math.md)

## Contents

- [Gate (abstract base)](#gate-abstract)
- [Single-qubit gates](#single-qubit-gates)
- [Parametric single-qubit gates](#parametric-single-qubit-gates)
- [Multi-qubit gates](#multi-qubit-gates)
- [Custom-matrix gates](#custom-matrix-gates)
- [Measurement](#measurement)
- [Gate summary table](#gate-summary-table)

> **Convention.** In a multi-qubit gate the **first declared qubit is the most
> significant** bit of the gate matrix. See the [index](README.md#conventions).

---

## `Gate` (abstract)

Base class for all gates. Concrete gates call the `protected` constructor with a
fixed matrix and label; you construct concrete subclasses, not `Gate` itself.

### Public methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getMatrix()` | `ComplexMatrix` | The unitary matrix representing this gate. |
| `getIndexes()` | `List<Integer>` | The qubit indexes this gate acts on, in declaration order. |
| `getType()` | `String` | Human-readable gate label (e.g. `"H"`, `"CNot"`). |
| `getNumberQubits()` | `int` | Number of qubits the gate acts on. |
| `getSize()` | `int` | Matrix dimension, `2^numberQubits`. |

### Construction contract

- **Throws** `IllegalArgumentException` if a multi-qubit gate is created with
  duplicate indexes (`"Creating gate that affects 2 or more qubits with the same
  index"`).

Single-qubit gate constructors accept a **varargs** of indexes: passing several
indexes applies the same gate to each of them (see the simulator's handling in
[simulator.md](simulator.md)).

---

## Single-qubit gates

All single-qubit gates share the signature `new XXX(Integer... qubitIndex)`.
Passing multiple indexes replicates the gate onto each listed qubit.

### `Identity`

`new Identity(Integer... qubitIndex)` — the `2x2` identity. A no-op during
simulation. Used internally by [`Circuit.addLevel`](quantum.md#addlevelcircuitlevel)
to pad untouched qubits.

### `Hadamard`

`new Hadamard(Integer... qubitIndex)` — creates an equal superposition. Matrix:

```
1/sqrt(2) * [ 1   1 ]
            [ 1  -1 ]
```

```java
level.addGate(new Hadamard(0));                 // one qubit
level.addGate(new Hadamard(0, 1, 2));           // same gate on qubits 0,1,2
```

### `PauliX`

`new PauliX(Integer... indexes)` — bit flip (NOT). Matrix `[[0,1],[1,0]]`.

### `PauliY`

`new PauliY(Integer... indexes)` — Pauli-Y. Matrix `[[0,-i],[i,0]]`.

### `PauliZ`

`new PauliZ(Integer... indexes)` — phase flip. Matrix `[[1,0],[0,-1]]`.

### `PauliS`

`new PauliS(Integer... indexes)` — S (phase) gate. Matrix `[[1,0],[0,i]]`.

### `PauliT`

`new PauliT(Integer... indexes)` — T (π/8) gate. Matrix `[[1,0],[0,e^{iπ/4}]]`.

---

## Parametric single-qubit gates

Their 2×2 unitary is computed from the constructor parameters (angles in radians).
Each takes varargs qubit indexes, like the fixed single-qubit gates. These unblock
OpenQASM import (#6: `rx`/`ry`/`rz`/`p`/`u`) and the variational layer (#32).

### `Rx`
`new Rx(double theta, Integer... indexes)` — rotation about X:
`[[cos(θ/2), −i·sin(θ/2)], [−i·sin(θ/2), cos(θ/2)]]`.

### `Ry`
`new Ry(double theta, Integer... indexes)` — rotation about Y:
`[[cos(θ/2), −sin(θ/2)], [sin(θ/2), cos(θ/2)]]`.

### `Rz`
`new Rz(double theta, Integer... indexes)` — rotation about Z:
`diag(e^(−iθ/2), e^(iθ/2))`.

### `Phase`
`new Phase(double theta, Integer... indexes)` — phase shift P(θ): `diag(1, e^(iθ))`.

### `U3`
`new U3(double theta, double phi, double lambda, Integer... indexes)` — universal
single-qubit rotation:
`[[cos(θ/2), −e^(iλ)·sin(θ/2)], [e^(iφ)·sin(θ/2), e^(i(φ+λ))·cos(θ/2)]]`.
Note `U3(π,0,π) = X`, `U3(π/2,0,π) = H`, `U3(0,0,λ) = P(λ)`.

## Multi-qubit gates

### `ControlledNot`

`new ControlledNot(Integer controlQubit, Integer targetQubit)` — flips the
target when the control is `|1>`. `controlQubit` is the most significant qubit
of the gate.

```java
level.addGate(new ControlledNot(0, 2)); // control=0, target=2 (may be non-adjacent)
```

### `ControlledY`

`new ControlledY(Integer controlQubit, Integer targetQubit)` — applies Pauli-Y
to the target when the control is `|1>`.

### `ControlledZ`

`new ControlledZ(Integer controlQubit, Integer targetQubit)` — applies a phase
flip to `|11>`.

### `Swap`

`new Swap(Integer firstQubit, Integer secondQubit)` — exchanges the states of
two qubits.

```java
level.addGate(new Swap(0, 2)); // swap qubits 0 and 2
```

### `ControlledSwap`

`new ControlledSwap(Integer firstQubit, Integer secondQubit, Integer thirdQubit)`
— Fredkin gate: swaps the second and third qubits when the first (control) is
`|1>`.

### `Toffoli`

`new Toffoli(Integer firstQubit, Integer secondQubit, Integer thirdQubit)` —
CCNOT: flips the third qubit when the first two are both `|1>`.

```java
level.addGate(new Toffoli(0, 2, 1)); // controls 0 and 2, target 1
```

All multi-qubit gates work on **arbitrary, non-adjacent** qubits — the ordering
of declared indexes determines their significance in the gate matrix (first =
most significant).

---

## Custom-matrix gates

These wrap a user-supplied unitary matrix.

### `Oracle`

`new Oracle(ComplexMatrix matrix, Integer... indexes)` — a black-box operator
defined by `matrix`. The number of qubits is inferred as `log2(matrix.length)`,
so the matrix must be `2^k x 2^k` and `indexes.length` must equal `k`.

```java
// A CNOT reused as an oracle over qubits 0 and 1
ComplexMatrix m = new ControlledNot(0, 1).getMatrix();
level.addGate(new Oracle(m, 0, 1));
```

### `GenericGate`

`new GenericGate(ComplexMatrix matrix, int size, Integer... qubitIndex)` — an
explicitly-sized custom gate. `size` is the number of qubits (matrix must be
`2^size x 2^size`). Used, for example, for the diffusion operator in Grover
search.

```java
level.addGate(new GenericGate(matrix, nQubits, qubitIndexes));
```

---

## Measurement

### `Measurement`

`new Measurement(Integer... indexes)` — a mid-circuit measurement gate. Its
matrix is the identity; when the [simulator](simulator.md) encounters it, it
calls [`QuantumRegister.measureQubitAtIndexes`](quantum.md#measurequbitatindexeslistinteger)
on the listed qubits, collapsing them and renormalizing the residual state.

```java
level.addGate(new Measurement(0, 1)); // measure qubits 0 and 1 mid-circuit
```

---

## Gate summary table

| Gate | Constructor | Qubits | Label (`getType()`) |
|------|-------------|:------:|---------------------|
| `Identity` | `Identity(Integer...)` | 1 | `I` |
| `Hadamard` | `Hadamard(Integer...)` | 1 | `H` |
| `PauliX` | `PauliX(Integer...)` | 1 | `X` |
| `PauliY` | `PauliY(Integer...)` | 1 | `Y` |
| `PauliZ` | `PauliZ(Integer...)` | 1 | `Z` |
| `PauliS` | `PauliS(Integer...)` | 1 | `S` |
| `PauliT` | `PauliT(Integer...)` | 1 | `T` |
| `Measurement` | `Measurement(Integer...)` | 1 (per index) | `M` |
| `ControlledNot` | `ControlledNot(control, target)` | 2 | `CNot` |
| `ControlledY` | `ControlledY(control, target)` | 2 | `CY` |
| `ControlledZ` | `ControlledZ(control, target)` | 2 | `CZ` |
| `Swap` | `Swap(first, second)` | 2 | `Swap` |
| `ControlledSwap` | `ControlledSwap(first, second, third)` | 3 | `CSwap` |
| `Toffoli` | `Toffoli(first, second, third)` | 3 | `TOFF` |
| `Oracle` | `Oracle(ComplexMatrix, Integer...)` | inferred | `Oracle` |
| `GenericGate` | `GenericGate(ComplexMatrix, int, Integer...)` | `size` | `Generic Gate` |

The matrices backing the built-in gates are defined as public constants in
`org.aitan.jqapi.utils.Constants` (e.g. `HADAMARD_MATRIX`, `PAULI_X_MATRIX`,
`CONTROLLED_NOT_MATRIX`, `TOFFOLI_MATRIX`).
