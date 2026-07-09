# Design — Issue #7 Phase B: generic multi-controlled gate Cᵐ(U)

- **Issue:** #7 `[FEATURE] Gate library expansion` — Phase B of 3 (A: parametric gates ✅ merged; B: generic multi-controlled Cᵐ(U); C: Reset).
- **Date:** 2026-07-09
- **Status:** Approved (design)

## Problem

jqapi has only *fixed* controlled gates (`ControlledNot`, `ControlledY`,
`ControlledZ`, `Toffoli` = C²(X), `ControlledSwap`). There is no way to control
an arbitrary operation `U` on an arbitrary number of control qubits. Building
such operators by hand via `GenericGate` is error-prone.

## Goal

Add a single generic gate `Cᵐ(U)` that applies a base unitary `U` conditioned on
`m` control qubits, generalizing `Toffoli`. No changes to the simulator or
`QuantumRegister.applyOperator` hot loop — it is an ordinary multi-qubit unitary.

## Scope

- **In:** a `MultiControlled` gate + a reusable matrix factory.
- **Out (later phase):** Reset (Phase C).

## Constraints

- Pure Java 21, native `Complex`/`ComplexMatrix` (post #12); zero runtime deps.
- Follow the existing gate pattern: `super(numberQubits, matrix, typeString, indexes)`.
- Honor jqapi's ordering: **first declared index = most significant = control**.
- No changes to `LocalSimulator`/`QuantumRegister` (arbitrary, non-adjacent target
  lists are already handled by `applyOperator`).
- `Toffoli`-equivalent behavior (C²(X)) must be reproducible, bit-for-bit.
- Existing golden-master tests remain green and unchanged.

## Key convention insight (validated against Toffoli)

With the control qubits placed as the **most significant** bits, the subspace
"all m controls are |1⟩" is the **last** `2^t` basis states. So the operator is
the identity everywhere except the **bottom-right `2^t × 2^t` block**, which is
`U`. This matches `Constants.TOFFOLI_MATRIX` exactly (8×8 identity except the
bottom-right 2×2 = X), so C²(X) reproduces `Toffoli` byte-for-byte.

## Design

### 1. Matrix factory on `ComplexMatrix`

`ComplexMatrix` already hosts `createIdentityMatrix` and `kroneckerProduct`, so
the controlled-operator builder belongs there:

```java
public static ComplexMatrix multiControlledMatrix(ComplexMatrix u, int numControls)
```

Behavior:
- Let `uDim = u.getRowDimension()`; require `numControls >= 1`, `u` square, and
  `uDim` a power of two ≥ 2. Otherwise `IllegalArgumentException`.
- `D = (2^numControls) * uDim`.
- Build a `D × D` identity, then overwrite the bottom-right `uDim × uDim` block
  (rows/cols `[D - uDim, D)`) with the entries of `u`.
- Return `ComplexMatrix.createMatrixWithData(...)`.

Because it starts from the exact `ZERO`/`ONE` singletons and copies `u`'s
entries, `multiControlledMatrix(PAULI_X_MATRIX, 2)` equals `TOFFOLI_MATRIX` under
`ComplexMatrix.equals` (exact).

### 2. `MultiControlled` gate

New class `quantum/gates/MultiControlled.java`:

```java
public MultiControlled(ComplexMatrix u, int numControls, Integer... indexes)
```

- `t = log2(u.getRowDimension())` (number of target qubits).
- Validate `indexes.length == numControls + t`; otherwise `IllegalArgumentException`.
- `super(numControls + t, ComplexMatrix.multiControlledMatrix(u, numControls),
  Constants.MULTI_CONTROLLED, indexes)`.
- Index order is **controls first, then targets** (controls are the MSBs).

The `Gate` base already validates that indexes are distinct and that the gate
fits the circuit, so no duplicate validation is added.

### 3. `Constants`

Add `public static final String MULTI_CONTROLLED = "MC";`

### 4. No simulator / register changes

`MultiControlled` is an ordinary `numControls + t`-qubit unitary. `LocalSimulator`
routes it through `QuantumRegister.applyOperator(matrix, indexes)`, which already
supports arbitrary, non-adjacent index groups.

## Testing

New test class `QuantumMultiControlledGateTest`. Because the X/Z base matrices
have exact `0/1/i` entries, the equivalence and matrix assertions use **exact
`ComplexMatrix.equals`** (no tolerance needed); unitarity uses the same
tolerance-free exact arithmetic on 0/1/i.

- **Exact matrix equivalences:**
  - `ComplexMatrix.multiControlledMatrix(PAULI_X_MATRIX, 1)` equals `CONTROLLED_NOT_MATRIX`.
  - `multiControlledMatrix(PAULI_Z_MATRIX, 1)` equals `CONTROLLED_Z_MATRIX`.
  - `multiControlledMatrix(PAULI_X_MATRIX, 2)` equals `TOFFOLI_MATRIX`.
- **Dimension:** `multiControlledMatrix(PAULI_X_MATRIX, 3)` is `16 × 16`.
- **Simulator behavior** (build a `Circuit`, execute, inspect register state):
  - C²(X) on `|110⟩` → `|111⟩`; on `|100⟩` → `|100⟩` (no flip unless all controls are 1).
  - **Equivalence to `Toffoli`**: a `MultiControlled(PAULI_X_MATRIX, 2, 0,1,2)` and
    a `Toffoli(0,1,2)`, applied to the same set of computational-basis inputs,
    produce identical register states.
  - **Non-adjacent**: `MultiControlled(PAULI_X_MATRIX, 2, 0, 2, 1)` (controls 0 and
    2, target 1) flips qubit 1 only when qubits 0 and 2 are both 1 — checked on a
    3-qubit register for a couple of basis inputs.
- **Validation errors** (`assertThrows(IllegalArgumentException.class, ...)`):
  non-square `u`; `uDim` not a power of two; `numControls < 1`; `indexes.length !=
  numControls + t`.
- **Golden-master**: `QuantumRegisterGoldenMasterTest` and the full suite stay green.

## Documentation

- `docs/api/gates.md`: add a `### MultiControlled` entry under "Multi-qubit gates"
  and a row in the summary table.
- Update the "Multi-qubit" gate lists in `README.md`, `docs/api/README.md`, and
  `docs/manual/concepts.md` to mention `MultiControlled` (Cᵐ(U)).

## Acceptance criteria (Phase B subset of #7)

- [ ] `ComplexMatrix.multiControlledMatrix(u, numControls)` builds the correct
      operator, with input validation.
- [ ] `MultiControlled` gate runs on `LocalSimulator`; `C²(X)` reproduces `Toffoli`.
- [ ] Exact equivalences (C¹X=CNOT, C¹Z=CZ, C²X=Toffoli), simulator behavior,
      non-adjacent placement, and validation-error tests pass.
- [ ] Existing suite incl. golden-master unchanged and green.
- [ ] `docs/api/gates.md` and the gate lists document `MultiControlled`.

## Out of scope

- Reset — Phase C.
- A `Gate`-accepting convenience overload (raw `ComplexMatrix` chosen; can be
  added later if ergonomics warrant).
- OpenQASM wiring (#6).
