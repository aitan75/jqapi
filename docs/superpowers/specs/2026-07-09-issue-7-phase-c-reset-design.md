# Design — Issue #7 Phase C: Reset (mid-circuit qubit reset to |0⟩)

- **Issue:** #7 `[FEATURE] Gate library expansion` — Phase C of 3 (A: parametric gates ✅ merged #36; B: multi-controlled Cᵐ(U) — PR #37; C: Reset). **This phase closes #7.**
- **Date:** 2026-07-09
- **Status:** Approved (design)

## Problem

jqapi has no mid-circuit `Reset` operation. Dynamic circuits and qubit reuse need
to force a qubit back to `|0⟩` regardless of its current state. Unlike the gates in
Phases A/B, `Reset` is **non-unitary**, so — like `Measurement` — it cannot be a
matrix application; it needs simulator-level support.

## Goal

Add a `Reset` gate and the register/simulator plumbing to force one or more qubits
to `|0⟩` mid-circuit, reusing the existing measurement/collapse machinery.

## Scope

- **In:** `Reset` gate, `QuantumRegister.reset(int)` / `resetQubitAtIndexes(List)`,
  `LocalSimulator` dispatch, `Constants.RESET`.
- **Out:** nothing further — this is the last of the three phases.

## Constraints

- Pure Java 21, native `Complex`/`ComplexMatrix`; zero runtime deps.
- Pure state-vector simulator → the only physically meaningful reset is
  measure-then-conditional-flip (a coherent/partial-trace reset would need density
  matrices, which this simulator does not model).
- Reuse existing collapse helpers; do not duplicate collapse/renormalization logic.
- Existing golden-master tests remain green and unchanged.

## Semantics: measure-then-conditional-X

`reset(q)` collapses qubit `q` in the Z basis (outcome 0 or 1 with the correct
probabilities, renormalizing the residual state), then, if the outcome was 1,
applies Pauli-X to `q`. The qubit is therefore **always** left in `|0⟩`. This is
consistent with how `measure()` already collapses using `SecureRandom`, and it
correctly handles entangled qubits (reset collapses the entanglement, as real
hardware reset does).

## Design

### 1. `QuantumRegister` — reset methods

Reuses the existing private helpers `calculateCollapsedIndex(int)` (line ~369) and
`updateRegisterStateAfterQubitCollapsed(int, int)` (line ~387), and the public
`applyOperator(ComplexMatrix, List<Integer>)` (line ~209). Mirrors
`measureQubitAtIndexes` (line ~294).

```java
public void reset(int qubitIndex) {
    if (qubitIndex < 0 || qubitIndex >= size) {
        throw new JQApiLimitException("Reset index " + qubitIndex + " out of range [0, " + size + ")");
    }
    int collapsedValue = this.calculateCollapsedIndex(qubitIndex);
    this.updateRegisterStateAfterQubitCollapsed(qubitIndex, collapsedValue);
    if (collapsedValue == 1) {
        this.applyOperator(Constants.PAULI_X_MATRIX, List.of(qubitIndex));
    }
}

public void resetQubitAtIndexes(List<Integer> indexes) {
    Objects.requireNonNull(indexes);
    indexes.forEach(index -> {
        if (index == null || index < 0 || index >= size) {
            throw new JQApiLimitException("Reset index " + index + " out of range [0, " + size + ")");
        }
    });
    indexes.forEach(this::reset);
}
```

- No special "all qubits" branch (unlike `measureQubitAtIndexes`): resetting each
  listed qubit already yields `|0…0⟩` for the full-register case.
- Requires adding `import org.aitan.jqapi.utils.Constants;` to `QuantumRegister`
  (`List` and `Objects` are already imported).

### 2. `getResult()` is **not** populated by reset

Unlike `measureQubitAtIndexes`, `reset` does **not** write to `result[]`. A reset
is not a read-out; marking `result[index] = QubitZero` would falsely imply the
qubit was *measured* as 0 rather than *forced* to 0. Documented behavior.

### 3. `Reset` gate

`quantum/gates/Reset.java`, mirroring `Measurement` (identity matrix; the
simulator special-cases it by type):

```java
public class Reset extends Gate {
    public Reset(Integer... indexes) {
        super(1, ComplexMatrix.createIdentityMatrix(2), Constants.RESET, indexes);
    }
}
```

### 4. `LocalSimulator.execute` dispatch

Add a branch mirroring the `MEASUREMENT` one (its matrix is identity → nothing
else to apply):

```java
if (gate.getType().equals(Constants.RESET)) {
    quantumRegister.resetQubitAtIndexes(gate.getIndexes());
    return;
}
```

### 5. `Constants`

Add `public static final String RESET = "RST";`

## Testing

New test class `QuantumResetGateTest`. Basis-state amplitudes after reset are exact
(`0/1`), so those use exact `Complex.equals`; the superposition/entangled cases
assert the qubit's **marginal probability of being 1 is 0** (within `1e-9`) and
that the state norm is 1.

- **`|1⟩` → `|0⟩`**: prepare with `PauliX`, `reset`, assert `|0⟩`.
- **`|0⟩` → `|0⟩`**: reset a fresh qubit, assert unchanged.
- **Superposition is deterministic**: `Hadamard` then `Reset`; over several runs
  (collapse is random) the reset qubit's marginal `P(1) == 0` every time, norm 1.
- **Entangled**: Bell state (`Hadamard` + `ControlledNot`), reset qubit 0; assert
  qubit 0 marginal `P(1) == 0` and total norm 1.
- **Simulator dispatch**: circuit `PauliX(0)` then `Reset(0)` → register `|0…0⟩`.
- **Multi-index**: `Reset(0, 1)` resets both.
- **Validation**: out-of-range index → `JQApiLimitException`.
- **Golden-master**: `QuantumRegisterGoldenMasterTest` and full suite stay green.

## Documentation

- `docs/api/gates.md`: add a `## Reset` section (like `Measurement`) + summary-table row.
- `docs/api/simulator.md`: note the `Reset` dispatch alongside `Measurement`.
- Mention `Reset` in the gate lists of `README.md`, `docs/api/README.md`,
  `docs/manual/concepts.md`.

## Acceptance criteria (Phase C — closes #7)

- [ ] `QuantumRegister.reset(int)` / `resetQubitAtIndexes(List)` force qubits to
      `|0⟩` via measure-then-conditional-X, reusing existing collapse helpers.
- [ ] `Reset` gate runs on `LocalSimulator` via a type-dispatch branch.
- [ ] Reset leaves the qubit `|0⟩` for basis, superposition, and entangled inputs;
      `getResult()` is not populated by reset.
- [ ] Validation, multi-index, and simulator-dispatch tests pass; existing suite
      incl. golden-master unchanged and green.
- [ ] `docs/api/gates.md`, `simulator.md`, and the gate lists document `Reset`.

## Out of scope

- Coherent / density-matrix reset (this is a pure state-vector simulator).
- OpenQASM `reset` wiring (#6).
