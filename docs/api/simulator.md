# Simulator — `org.aitan.jqapi.quantum.simulator`

Runs a [`Circuit`](quantum.md#circuit) and exposes the resulting
[`QuantumRegister`](quantum.md#quantumregister).

- [Back to API index](README.md)
- Related: [Quantum core](quantum.md) · [Gates](gates.md) · [Math](math.md)

## Contents

- [QuantumSimulator (interface)](#quantumsimulator-interface)
- [LocalSimulator](#localsimulator)

---

## `QuantumSimulator` (interface)

The contract for anything that can execute a circuit.

| Method | Returns | Description |
|--------|---------|-------------|
| `execute()` | `void` | Runs the circuit, evolving the register state. |
| `getQuantumRegister()` | `QuantumRegister` | The register holding the (post-execution) quantum state. |

Typical lifecycle: construct → `execute()` → read via `getQuantumRegister()`,
then measure or inspect the register.

---

## `LocalSimulator`

`implements QuantumSimulator`

Local **state-vector** simulator. During execution, it delegates the gate application to [`QuantumRegister.applyOperator(...)`](quantum.md#applyoperatorcomplexmatrix-operator-listinteger-targetqubits), evolving the register state in-place without exposing or mutating its internal vector representation directly. For a gate acting on `k` qubits, only the `2^k` amplitudes of each affected group are combined, so the full `2^n x 2^n` operator of a circuit level is **never materialized**. This keeps memory at `O(2^n)` and lets gates act on arbitrary, non-adjacent qubits.

### Constructors

| Constructor | Description |
|-------------|-------------|
| `LocalSimulator(Circuit circuit)` | Register initialized to `\|0...0>`. |
| `LocalSimulator(Circuit circuit, Qubit... qubits)` | Register initialized from explicit per-qubit states. |
| `LocalSimulator(Circuit circuit, double... alphas)` | Register initialized from `\|0>`-amplitude coefficients (each becomes a `QubitSuperposition`). |

- **Throws** `IllegalArgumentException` (both the `Qubit...` and `double...`
  overloads) if the number of supplied inputs differs from
  `circuit.getInputSize()` (`"Number of input qubits are different from circuit
  size"`).

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `execute()` | `void` | Applies every gate of every level, in order. |
| `getQuantumRegister()` | `QuantumRegister` | The register after (or before) execution. |

### Execution semantics

During `execute()`, for each gate in each level:

- **Identity** gates are skipped (no-op).
- **Measurement** gates trigger
  [`QuantumRegister.measureQubitAtIndexes`](quantum.md#measurequbitatindexeslistinteger)
  on their indexes (the matrix is the identity, so nothing else is applied).
- **Reset** gates trigger
  [`QuantumRegister.resetQubitAtIndexes`](quantum.md#resetqubitatindexeslistinteger),
  forcing each listed qubit to `|0>`; non-unitary, handled by type like `Measurement`.
- **Single-qubit** gates declared over several indexes are applied once per
  index.
- **Multi-qubit** gates are applied to their declared index group.

- **Throws** `IllegalArgumentException` if a gate matrix's dimension does not
  match the number of target qubits (`"Gate matrix of dimension D cannot be
  applied to K qubit(s)"`).

### Example

```java
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.gates.*;
import org.aitan.jqapi.quantum.simulator.*;

// Bell state: (|00> + |11>) / sqrt(2)
Circuit circuit = new Circuit(2);
CircuitLevel level1 = new CircuitLevel();
CircuitLevel level2 = new CircuitLevel();
level1.addGate(new Hadamard(0));
level2.addGate(new ControlledNot(0, 1));
circuit.addLevel(level1, level2);

QuantumSimulator simulator = new LocalSimulator(circuit); // starts at |00>
simulator.execute();

QuantumRegister qreg = simulator.getQuantumRegister();
qreg.measure();
Qubit q0 = qreg.getResult()[0];
Qubit q1 = qreg.getResult()[1];
// q0 and q1 are perfectly correlated: both |0> or both |1>
```

### Initializing from custom inputs

```java
// Per-qubit initial states
QuantumSimulator s1 = new LocalSimulator(circuit, new QubitOne(), new QubitZero());

// Amplitude coefficients (|0> amplitude of each qubit)
QuantumSimulator s2 = new LocalSimulator(circuit, 0.5, 0.8);
```

### Scaling note

Because the full level operator is never built, large circuits are feasible: a
10-qubit GHZ circuit and a 16-qubit Hadamard-layer circuit both run without
constructing the corresponding `1024x1024` / `65536x65536` operators. See the
`StateVectorSimulatorTest` suite for verified large-circuit examples.

## Parallelism

Gate application is embarrassingly parallel: a gate on `k` qubits touches
`2^k`-amplitude groups that never overlap. `QuantumRegister.applyOperator` spreads
those independent groups across cores using the common `ForkJoinPool` when the
state-vector dimension is at least `2^16` (16 qubits); smaller states stay on the
sequential path (thread setup would outweigh the gain). Results are **bit-for-bit
identical** to the sequential path regardless of thread count — the groups are
independent and there is no cross-group reduction.

- **Degree of parallelism:** set `-Djava.util.concurrent.ForkJoinPool.common.parallelism=N`.
- **Explicit opt-out / opt-in:** `applyOperator(operator, targets, boolean parallel)`
  forces the sequential (`false`) or parallel (`true`) path regardless of the threshold.
- Only the work **inside** a single gate is parallelized; gate and level ordering in
  `LocalSimulator.execute` remains sequential.
