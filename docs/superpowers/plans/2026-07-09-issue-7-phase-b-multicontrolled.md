# Multi-Controlled Gate Cᵐ(U) (Issue #7 Phase B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic `MultiControlled` gate that applies a base unitary `U` conditioned on `m` control qubits, generalizing `Toffoli`.

**Architecture:** A reusable static factory `ComplexMatrix.multiControlledMatrix(u, numControls)` builds a `2^(m+t)` operator (identity except `U` in the bottom-right `2^t` block, matching the MSB-control convention). A trivial `MultiControlled` gate wraps it. Ordinary multi-qubit unitary → the simulator and `QuantumRegister` are untouched.

**Tech Stack:** Java 21, native `Complex`/`ComplexMatrix` (post #12), JUnit 5.

## Global Constraints

- Pure Java 21, zero runtime dependencies; native `Complex`/`ComplexMatrix` only.
- No changes to `LocalSimulator` or `QuantumRegister`.
- Ordering: **first declared index = most significant = control**; index order is controls-then-targets.
- `C²(X)` must reproduce `Constants.TOFFOLI_MATRIX` / the `Toffoli` gate bit-for-bit.
- X/Z base matrices have exact `0/1/i` entries → matrix and basis-state assertions use **exact** `ComplexMatrix.equals` / `Complex.equals` (no tolerance needed this phase).
- Existing suite incl. `QuantumRegisterGoldenMasterTest` stays green and unchanged.
- No `Co-Authored-By` trailer in commits.

**Reference:** spec `docs/superpowers/specs/2026-07-09-issue-7-phase-b-multicontrolled-design.md`.

**Test/build commands:**
- Single class: `mvn -B -Dtest=QuantumMultiControlledGateTest test`
- Full suite: `mvn -B test`

**Known API (existing):** `ComplexMatrix.createIdentityMatrix(int)`, `createMatrixWithData(Complex[][])`, `getEntry(int,int)`, `getRowDimension()`, `getColumnDimension()`, `equals`; `Complex.ONE`/`Complex.ZERO`; `Gate` base validates distinct indexes and circuit fit; `Constants.PAULI_X_MATRIX`, `PAULI_Z_MATRIX`, `CONTROLLED_NOT_MATRIX`, `CONTROLLED_Z_MATRIX`, `TOFFOLI_MATRIX`. Circuit API: `new Circuit(int)`, `CircuitLevel.addGate(Gate)`, `circuit.addLevel(level)`, `new LocalSimulator(circuit)`, `sim.execute()`, `sim.getQuantumRegister().getRegisterState().getEntry(i)`.

---

### Task 1: `ComplexMatrix.multiControlledMatrix` factory

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/math/ComplexMatrix.java`
- Create: `src/test/java/org/aitan/jqapi/test/QuantumMultiControlledGateTest.java`

**Interfaces:**
- Produces: `public static ComplexMatrix ComplexMatrix.multiControlledMatrix(ComplexMatrix u, int numControls)` — returns the `2^numControls · uDim` square operator; throws `IllegalArgumentException` for `numControls < 1`, non-square `u`, or `uDim` not a power of two ≥ 2.

- [ ] **Step 1: Write the failing tests (creates the test class)**

Create `src/test/java/org/aitan/jqapi/test/QuantumMultiControlledGateTest.java`:

```java
package org.aitan.jqapi.test;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumMultiControlledGateTest {

    @Test
    void c1x_equals_controlledNot() {
        assertEquals(Constants.CONTROLLED_NOT_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 1));
    }

    @Test
    void c1z_equals_controlledZ() {
        assertEquals(Constants.CONTROLLED_Z_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_Z_MATRIX, 1));
    }

    @Test
    void c2x_equals_toffoli() {
        assertEquals(Constants.TOFFOLI_MATRIX,
                ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 2));
    }

    @Test
    void c3x_hasDimension16() {
        ComplexMatrix m = ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 3);
        assertEquals(16, m.getRowDimension());
        assertEquals(16, m.getColumnDimension());
    }

    @Test
    void factory_rejectsInvalidInput() {
        // numControls < 1
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 0));
        // non-square U
        ComplexMatrix nonSquare = ComplexMatrix.createMatrixWithData(new org.aitan.jqapi.math.Complex[][]{
            {org.aitan.jqapi.math.Complex.ONE, org.aitan.jqapi.math.Complex.ZERO}});
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(nonSquare, 1));
        // dimension not a power of two (3x3)
        ComplexMatrix threeByThree = ComplexMatrix.createIdentityMatrix(3);
        assertThrows(IllegalArgumentException.class,
                () -> ComplexMatrix.multiControlledMatrix(threeByThree, 1));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumMultiControlledGateTest test`
Expected: compilation failure — `cannot find symbol: method multiControlledMatrix`.

- [ ] **Step 3: Add the factory to `ComplexMatrix`**

In `src/main/java/org/aitan/jqapi/math/ComplexMatrix.java`, add this static method (e.g. after `kroneckerProduct`; `Complex` is in the same package, no import needed):

```java
    /**
     * Builds the operator for a gate that applies {@code u} to its target
     * qubits conditioned on {@code numControls} control qubits all being
     * {@code |1>}. Controls are the most-significant qubits, so the controlled
     * block is the bottom-right {@code uDim x uDim} block; the rest is identity.
     *
     * @param u the base unitary applied when all controls are set
     * @param numControls the number of control qubits (>= 1)
     * @return the {@code (2^numControls · uDim)}-dimensional controlled operator
     */
    public static ComplexMatrix multiControlledMatrix(ComplexMatrix u, int numControls) {
        if (numControls < 1) {
            throw new IllegalArgumentException("numControls must be >= 1, was: " + numControls);
        }
        int uDim = u.getRowDimension();
        if (u.getColumnDimension() != uDim) {
            throw new IllegalArgumentException("Base operator U must be square");
        }
        if (uDim < 2 || (uDim & (uDim - 1)) != 0) {
            throw new IllegalArgumentException(
                    "Base operator U dimension must be a power of two >= 2, was: " + uDim);
        }
        int d = (1 << numControls) * uDim;
        Complex[][] data = new Complex[d][d];
        for (int r = 0; r < d; r++) {
            for (int c = 0; c < d; c++) {
                data[r][c] = (r == c) ? Complex.ONE : Complex.ZERO;
            }
        }
        int base = d - uDim; // top-left corner of the bottom-right block
        for (int r = 0; r < uDim; r++) {
            for (int c = 0; c < uDim; c++) {
                data[base + r][base + c] = u.getEntry(r, c);
            }
        }
        return new ComplexMatrix(data);
    }
```

Note: `new ComplexMatrix(data)` uses the existing private `ComplexMatrix(Complex[][])` constructor (same class). If preferred, `createMatrixWithData(data)` is equivalent.

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumMultiControlledGateTest test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/math/ComplexMatrix.java src/test/java/org/aitan/jqapi/test/QuantumMultiControlledGateTest.java
git commit -m "feat(math): add ComplexMatrix.multiControlledMatrix factory (#7)"
```

---

### Task 2: `MultiControlled` gate + `Constants.MULTI_CONTROLLED`

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/utils/Constants.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/MultiControlled.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumMultiControlledGateTest.java`

**Interfaces:**
- Consumes: `ComplexMatrix.multiControlledMatrix` (Task 1).
- Produces: `Constants.MULTI_CONTROLLED = "MC"`; `new MultiControlled(ComplexMatrix u, int numControls, Integer... indexes)` (indexes = controls then targets); throws `IllegalArgumentException` if `indexes.length != numControls + t` where `t = log2(uDim)`.

- [ ] **Step 1: Write the failing tests (append to the test class)**

Add these imports at the top of `QuantumMultiControlledGateTest.java`:

```java
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.MultiControlled;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.math.Complex;
```

Add these test methods and a helper inside the class:

```java
    // Runs the circuit and returns the resulting register state.
    private static QuantumRegister run(CircuitLevel... levels) {
        Circuit circuit = new Circuit(3);
        for (CircuitLevel level : levels) {
            circuit.addLevel(level);
        }
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        return sim.getQuantumRegister();
    }

    // Asserts the 3-qubit register is exactly the basis state |index>.
    private static void assertBasisState(QuantumRegister reg, int index) {
        for (int i = 0; i < 8; i++) {
            Complex amp = reg.getRegisterState().getEntry(i);
            if (i == index) {
                assertEquals(Complex.ONE, amp, "amplitude at " + i);
            } else {
                assertEquals(Complex.ZERO, amp, "amplitude at " + i);
            }
        }
    }

    @Test
    void gate_exposesMatrixAndType() {
        MultiControlled g = new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2);
        assertEquals(ComplexMatrix.multiControlledMatrix(Constants.PAULI_X_MATRIX, 2), g.getMatrix());
        assertEquals(Constants.MULTI_CONTROLLED, g.getType());
    }

    @Test
    void gate_rejectsWrongIndexCount() {
        // C2(X) needs 2 controls + 1 target = 3 indexes; give 2.
        assertThrows(IllegalArgumentException.class,
                () -> new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1));
    }

    @Test
    void c2x_flipsTarget_whenAllControlsSet() {
        // Prepare |110> (q0=1,q1=1,q2=0 = index 6), then C2(X) on controls 0,1 target 2 -> |111> (index 7).
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        prep.addGate(new PauliX(1));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
        assertBasisState(run(prep, mc), 7);
    }

    @Test
    void c2x_noFlip_whenNotAllControlsSet() {
        // Prepare |100> (index 4), C2(X) controls 0,1: q1=0 so no flip -> stays |100>.
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
        assertBasisState(run(prep, mc), 4);
    }

    @Test
    void c2x_equivalentToToffoliGate_onAllBasisInputs() {
        for (int input = 0; input < 8; input++) {
            CircuitLevel prepA = basisPrep(input);
            CircuitLevel mc = new CircuitLevel();
            mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 1, 2));
            QuantumRegister a = run(prepA, mc);

            CircuitLevel prepB = basisPrep(input);
            CircuitLevel toff = new CircuitLevel();
            toff.addGate(new Toffoli(0, 1, 2));
            QuantumRegister b = run(prepB, toff);

            for (int i = 0; i < 8; i++) {
                assertEquals(a.getRegisterState().getEntry(i), b.getRegisterState().getEntry(i),
                        "input " + input + " amplitude " + i);
            }
        }
    }

    @Test
    void c2x_nonAdjacent_controls0and2_target1() {
        // Prepare |101> (q0=1,q1=0,q2=1 = index 5). Controls 0 and 2 are both 1 -> flip q1 -> |111> (index 7).
        CircuitLevel prep = new CircuitLevel();
        prep.addGate(new PauliX(0));
        prep.addGate(new PauliX(2));
        CircuitLevel mc = new CircuitLevel();
        mc.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 2, 0, 2, 1));
        assertBasisState(run(prep, mc), 7);
    }

    // Prepares the 3-qubit basis state |index> by applying X to each set bit
    // (qubit 0 is the most significant bit).
    private static CircuitLevel basisPrep(int index) {
        CircuitLevel level = new CircuitLevel();
        for (int q = 0; q < 3; q++) {
            int bit = (index >> (2 - q)) & 1;
            if (bit == 1) {
                level.addGate(new PauliX(q));
            }
        }
        return level;
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumMultiControlledGateTest test`
Expected: compilation failure — `cannot find symbol: class MultiControlled` / `Constants.MULTI_CONTROLLED`.

- [ ] **Step 3: Add the type string to `Constants`**

In `src/main/java/org/aitan/jqapi/utils/Constants.java`, add alongside the other type strings (e.g. after `U3`):

```java
    public static final String MULTI_CONTROLLED = "MC";
```

- [ ] **Step 4: Create the `MultiControlled` gate**

Create `src/main/java/org/aitan/jqapi/quantum/gates/MultiControlled.java`:

```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;

/**
 * Generic multi-controlled gate Cᵐ(U): applies the base unitary {@code u} to its
 * target qubits when all {@code numControls} control qubits are {@code |1>}.
 * Indexes are declared controls-first, then targets; controls are the most
 * significant qubits. {@code new MultiControlled(PAULI_X_MATRIX, 2, c1, c2, t)}
 * reproduces {@link Toffoli}.
 *
 * @author Gaetano Ferrara
 */
public class MultiControlled extends Gate {

    public MultiControlled(ComplexMatrix u, int numControls, Integer... indexes) {
        super(numControls + Integer.numberOfTrailingZeros(u.getRowDimension()),
                ComplexMatrix.multiControlledMatrix(u, numControls),
                Constants.MULTI_CONTROLLED,
                requireIndexCount(u, numControls, indexes));
    }

    private static Integer[] requireIndexCount(ComplexMatrix u, int numControls, Integer[] indexes) {
        int t = Integer.numberOfTrailingZeros(u.getRowDimension());
        int expected = numControls + t;
        if (indexes.length != expected) {
            throw new IllegalArgumentException("MultiControlled expects " + expected
                    + " indexes (" + numControls + " controls + " + t + " targets), got " + indexes.length);
        }
        return indexes;
    }
}
```

Note: `super(...)` evaluates its arguments left to right. `multiControlledMatrix(u, numControls)` validates `u`/`numControls` (throwing `IllegalArgumentException` for bad input) before `requireIndexCount` runs; all validation paths throw `IllegalArgumentException`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumMultiControlledGateTest test`
Expected: PASS (all multi-controlled tests).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/aitan/jqapi/utils/Constants.java src/main/java/org/aitan/jqapi/quantum/gates/MultiControlled.java src/test/java/org/aitan/jqapi/test/QuantumMultiControlledGateTest.java
git commit -m "feat(gates): add generic multi-controlled MultiControlled gate (#7)"
```

---

### Task 3: Documentation

**Files:**
- Modify: `docs/api/gates.md`
- Modify: `README.md`
- Modify: `docs/api/README.md`
- Modify: `docs/manual/concepts.md`

**Interfaces:**
- Consumes: the `MultiControlled` constructor and `Constants.MULTI_CONTROLLED` from Task 2.

- [ ] **Step 1: Add a `MultiControlled` entry to `docs/api/gates.md`**

Insert this subsection immediately **before** the line `## Custom-matrix gates`:

```markdown
### `MultiControlled`

`new MultiControlled(ComplexMatrix u, int numControls, Integer... indexes)` — the
generic multi-controlled gate Cᵐ(U). Applies `u` (a `2^t × 2^t` unitary) to the
target qubits when all `numControls` control qubits are `|1>`. Indexes are
declared **controls first, then targets** (controls are the most significant
qubits). Generalizes `Toffoli`: `new MultiControlled(Constants.PAULI_X_MATRIX, 2,
c1, c2, target)` equals `new Toffoli(c1, c2, target)`.

```java
// C³(X): flip qubit 3 only when qubits 0, 1, 2 are all |1>
level.addGate(new MultiControlled(Constants.PAULI_X_MATRIX, 3, 0, 1, 2, 3));
```
```

- [ ] **Step 2: Add a summary-table row in `docs/api/gates.md`**

In the "Gate summary table", add this row immediately after the `Toffoli` row:

```markdown
| `MultiControlled` | `MultiControlled(ComplexMatrix u, int numControls, Integer...)` | `numControls + log2(u)` | `MC` |
```

Also add to the `## Contents` list a bullet after the multi-qubit entry:
```markdown
- [Multi-controlled Cᵐ(U)](#multicontrolled)
```
(If the exact Contents format differs, follow the file's existing list style; requirement is a working anchor link.)

- [ ] **Step 3: Update the "Supported gates" line in `README.md`**

Change:
```markdown
Controlled-Z, Controlled-Swap, Toffoli, Oracle, Measurement.
```
to:
```markdown
Controlled-Z, Controlled-Swap, Toffoli, generic multi-controlled Cᵐ(U), Oracle,
Measurement.
```

- [ ] **Step 4: Update the multi-qubit list in `docs/api/README.md`**

Change:
```markdown
Multi-qubit: `ControlledNot`, `ControlledY`, `ControlledZ`, `Swap`,
`ControlledSwap`, `Toffoli`.
```
to:
```markdown
Multi-qubit: `ControlledNot`, `ControlledY`, `ControlledZ`, `Swap`,
`ControlledSwap`, `Toffoli`, `MultiControlled` (generic Cᵐ(U)).
```

- [ ] **Step 5: Update the multi-qubit bullet in `docs/manual/concepts.md`**

Change:
```markdown
- **Multi-qubit:** `ControlledNot(control, target)`, `ControlledY`,
  `ControlledZ`, `Swap(a, b)`, `ControlledSwap(control, a, b)`,
  `Toffoli(c1, c2, target)`.
```
to:
```markdown
- **Multi-qubit:** `ControlledNot(control, target)`, `ControlledY`,
  `ControlledZ`, `Swap(a, b)`, `ControlledSwap(control, a, b)`,
  `Toffoli(c1, c2, target)`, and the generic
  `MultiControlled(u, numControls, controls..., targets...)` for Cᵐ(U).
```

- [ ] **Step 6: Verify doc references**

Run:
```bash
grep -q 'MultiControlled' docs/api/gates.md && grep -q 'multi-controlled' README.md && grep -q 'MultiControlled' docs/api/README.md && grep -q 'MultiControlled' docs/manual/concepts.md && echo OK
```
Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add docs/api/gates.md README.md docs/api/README.md docs/manual/concepts.md
git commit -m "docs: document generic multi-controlled MultiControlled gate (#7)"
```

---

### Task 4: Full-suite verification, push, PR

**Files:** none (verification + git/remote).

**Interfaces:**
- Consumes: all commits from Tasks 1–3.

- [ ] **Step 1: Run the full test suite (golden-master must stay green)**

Run: `mvn -B test`
Expected: `BUILD SUCCESS`, 0 failures, including `QuantumRegisterGoldenMasterTest` and all pre-existing tests.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feature/issue-7-phase-b-multicontrolled
```

- [ ] **Step 3: Open the PR via REST API (token from osxkeychain; no gh CLI)**

Open a PR against `main`, title referencing issue #7 Phase B, body summarizing the `MultiControlled` gate + factory + tests, noting this is **Phase B of 3** (does **not** close #7). Confirm PR number/URL.

- [ ] **Step 4: Report CI status**

After `Build` and `CodeQL` run, confirm both green. Report. Do **not** merge — the maintainer reviews and merges.

---

## Self-Review

- **Spec coverage:** factory + validation → Task 1; `MULTI_CONTROLLED` + gate + index validation → Task 2; MSB/bottom-right convention → Task 1 Step 3 + `c2x_equals_toffoli`; no simulator change → nothing touches those files (Task 4 full suite confirms); C²(X)=Toffoli exact → `c2x_equals_toffoli` + `c2x_equivalentToToffoliGate_onAllBasisInputs`; simulator behavior + non-adjacent → Task 2 tests; validation errors → `factory_rejectsInvalidInput` + `gate_rejectsWrongIndexCount`; golden-master → Task 4 Step 1; docs → Task 3. All acceptance criteria mapped.
- **Placeholder scan:** none — every code step has complete code; the one flexible instruction (Contents format) gives concrete content + a fallback rule.
- **Type/name consistency:** `ComplexMatrix.multiControlledMatrix(ComplexMatrix,int)`, `Constants.MULTI_CONTROLLED`, `MultiControlled(ComplexMatrix,int,Integer...)`, helper `requireIndexCount`, and test helpers `run`/`assertBasisState`/`basisPrep` are used identically across tasks. `Integer.numberOfTrailingZeros(uDim)` computes `t` for power-of-two `uDim`, matching the factory's dimension math.
