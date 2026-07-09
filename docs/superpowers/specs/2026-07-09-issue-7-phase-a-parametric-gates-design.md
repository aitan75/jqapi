# Design — Issue #7 Phase A: parametric single-qubit gates (Rx, Ry, Rz, P, U3)

- **Issue:** #7 `[FEATURE] Gate library expansion` — Phase A of 3 (A: parametric gates; B: generic multi-controlled Cᵐ(U); C: Reset).
- **Date:** 2026-07-09
- **Status:** Approved (design)

## Problem

jqapi ships only fixed gates (Hadamard, Pauli X/Y/Z/S/T, CNOT, Toffoli, …).
Every modern variational algorithm (VQE/QAOA, issue #32) and the OpenQASM import
gap (#6: `rx`, `ry`, `rz`, `p`/`u1`, `u`/`u3`) require **tunable** single-qubit
rotations. None exist today.

## Goal

Add five parametric single-qubit gates whose 2×2 unitary is computed from their
parameters, following the existing gate pattern, with **no changes to the
simulator or the `QuantumRegister.applyOperator` hot loop**.

## Scope

- **In:** `Rx(θ)`, `Ry(θ)`, `Rz(θ)`, `P(θ)` (phase shift), `U3(θ,φ,λ)`.
- **Out (later phases):** generic multi-controlled Cᵐ(U) (Phase B); Reset (Phase C).

## Constraints

- Pure Java 21, zero runtime dependencies; native `Complex`/`ComplexMatrix` (post #12).
- Follow the existing gate pattern: a `Gate` subclass calling
  `super(numberQubits, matrix, typeString, indexes)`.
- No changes to `LocalSimulator` dispatch or `QuantumRegister` — these are normal
  1-qubit unitaries and flow through the existing single-qubit path.
- Existing golden-master tests must remain bit-for-bit unchanged.

## Unitary matrices (standard / Qiskit convention)

- `Rx(θ) = [[cos(θ/2), −i·sin(θ/2)], [−i·sin(θ/2), cos(θ/2)]]`
- `Ry(θ) = [[cos(θ/2), −sin(θ/2)], [sin(θ/2), cos(θ/2)]]`
- `Rz(θ) = [[e^(−iθ/2), 0], [0, e^(iθ/2)]]`
- `P(θ)  = [[1, 0], [0, e^(iθ)]]`
- `U3(θ,φ,λ) = [[cos(θ/2), −e^(iλ)·sin(θ/2)], [e^(iφ)·sin(θ/2), e^(i(φ+λ))·cos(θ/2)]]`

## Design

### 1. Matrix construction lives in `Constants` (factory methods)

`Constants` already computes matrices with `Math.cos/sin` (see `PAULI_T_MATRIX`),
so parametric matrices are a natural fit as **static factory methods** there.
Gates stay trivial wrappers; matrices become unit-testable in isolation.

New methods on `Constants`:

```java
public static ComplexMatrix rotationXMatrix(double theta) { ... }
public static ComplexMatrix rotationYMatrix(double theta) { ... }
public static ComplexMatrix rotationZMatrix(double theta) { ... }
public static ComplexMatrix phaseMatrix(double theta) { ... }
public static ComplexMatrix u3Matrix(double theta, double phi, double lambda) { ... }
```

Each builds a 2×2 via `ComplexMatrix.createMatrixWithData(new Complex[][]{...})`.

### 2. `Complex.expI(double theta)` helper

Add a small helper returning `e^(iθ) = (cos θ, sin θ)`, used by
`rotationZMatrix`, `phaseMatrix`, and `u3Matrix`. Removes duplicated
`new Complex(Math.cos(x), Math.sin(x))` and is independently testable.

```java
public static Complex expI(double theta) {
    return new Complex(Math.cos(theta), Math.sin(theta));
}
```

### 3. Gate classes in `quantum/gates/`

Five trivial subclasses, mirroring `PauliX`/`Hadamard` (varargs indexes → the
same rotation applied to each listed qubit by the existing single-qubit path):

```java
public class Rx extends Gate {
    public Rx(double theta, Integer... indexes) {
        super(1, Constants.rotationXMatrix(theta), Constants.RX, indexes);
    }
}
// Ry, Rz, Phase analogous
public class U3 extends Gate {
    public U3(double theta, double phi, double lambda, Integer... indexes) {
        super(1, Constants.u3Matrix(theta, phi, lambda), Constants.U3, indexes);
    }
}
```

Names: `Rx`, `Ry`, `Rz`, `Phase` (the P gate), `U3` — physics/PascalCase,
consistent with `PauliX`.

### 4. Type strings in `Constants`

```java
public static final String RX = "Rx";
public static final String RY = "Ry";
public static final String RZ = "Rz";
public static final String PHASE = "P";
public static final String U3 = "U3";
```

`getType()` returns the **category** (e.g. `"Rx"`), not the angle. The simulator
dispatches on type only for `MEASUREMENT`/`IDENTITY`; parametric gates use none
of those, so they flow through the normal 1-qubit path unchanged.

> **Pre-existing note.** `Constants.PROBABILITIES` already holds the value `"P"`
> and is unused dead code. `PHASE="P"` therefore shares a *value* with it but not
> a name; there is no functional dispatch on either string. Left as-is (removing
> dead code is out of scope for this phase).

### 5. No simulator/register changes

`LocalSimulator.execute` already routes any 1-qubit gate (not `MEASUREMENT`/`IDENTITY`)
through `applyOperator(matrix, singletonList(index))` per index. Parametric gates
need nothing more.

## Testing

`Complex.equals` is exact (`==`), but computed `cos/sin` values will not equal the
`ZERO`/`ONE` singletons or each other bit-for-bit. **All numeric assertions use a
tolerance** (compare real/imaginary parts within `1e-9`), via a small test helper —
never `Complex.equals` for computed values.

New test class `QuantumParametricGateTest` covering:

- **Known matrices** at representative angles: `θ=0` → identity for Rx/Ry/Rz/P;
  `θ=π`, `θ=π/2` entries match the formulas above.
- **`Complex.expI`**: `expI(0)=(1,0)`, `expI(π/2)=(0,1)`, `expI(π)=(−1,0)` within tolerance.
- **Unitarity**: for each gate at a few angles, `U·U† = I` within tolerance
  (uses `ComplexMatrix.operate`/entry access; conjugate-transpose built in the test).
- **Known equivalences** (within tolerance, up to global phase where noted):
  `Rx(π) ∝ X`, `U3(π,0,π) = X`, `U3(π/2,0,π) = H`, `U3(0,0,λ) = P(λ)`,
  `Rz(θ)` vs `P(θ)` differ by the global phase `e^(−iθ/2)`.
- **Simulator integration**: build a 1-qubit `Circuit` with `Rx(π)` on `|0⟩`,
  execute, assert the resulting register amplitudes equal `|1⟩` up to global phase
  (within tolerance). One multi-qubit case: `Ry(θ)` on a chosen qubit of a 2–3
  qubit register, amplitudes checked against the hand-computed tensor state.
- **Golden-master**: `QuantumRegisterGoldenMasterTest` and the full existing suite
  still pass unchanged (new code touches no existing path).

## Documentation

- Update `docs/api/gates.md`: add a "Parametric gates" section with the five gates,
  their matrices, constructor signatures, and a one-line note that they unblock
  OpenQASM import (#6) and the variational layer (#32).

## Acceptance criteria (Phase A subset of #7)

- [ ] `Rx`, `Ry`, `Rz`, `Phase`, `U3` implemented as `Gate`s with correct unitary
      matrices computed from parameters, runnable on `LocalSimulator`.
- [ ] `Complex.expI` added and unit-tested.
- [ ] `Constants` factory methods added and unit-tested.
- [ ] Unitarity + known-equivalence + simulator-integration tests pass; existing
      suite (incl. golden-master) unchanged and green.
- [ ] `docs/api/gates.md` documents the new gates.

## Out of scope

- Generic multi-controlled Cᵐ(U) — Phase B.
- Reset — Phase C.
- OpenQASM wiring (#6) — separate issue; this phase only provides the gates.
- Removing the pre-existing unused `PROBABILITIES` constant.
