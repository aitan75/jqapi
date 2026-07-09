# Reset (Issue #7 Phase C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mid-circuit `Reset` operation that forces one or more qubits to `|0⟩`, closing issue #7.

**Architecture:** `Reset` is non-unitary, so — like `Measurement` — it is dispatched by type in `LocalSimulator` rather than applied as a matrix. `QuantumRegister.reset(int)` reuses the existing collapse helpers: measure the qubit, then apply Pauli-X if it collapsed to 1, leaving it `|0⟩`.

**Tech Stack:** Java 21, native `Complex`/`ComplexMatrix` (post #12), JUnit 5.

## Global Constraints

- Pure Java 21, zero runtime dependencies; native `Complex`/`ComplexMatrix` only.
- Reuse the existing collapse helpers; do not duplicate collapse/renormalization logic.
- Pure state-vector simulator → semantics are **measure-then-conditional-X** (probabilistic collapse via the existing `SecureRandom` path).
- `reset` must **not** populate `getResult()`.
- Existing suite incl. `QuantumRegisterGoldenMasterTest` stays green and unchanged.
- No `Co-Authored-By` trailer in commits.

**Reference:** spec `docs/superpowers/specs/2026-07-09-issue-7-phase-c-reset-design.md`.

**Test/build commands:**
- Single class: `mvn -B -Dtest=QuantumResetGateTest test`
- Full suite: `mvn -B test`

**Existing API used:**
- `QuantumRegister(int size)` — inits to `|0…0>`; `applyOperator(ComplexMatrix, List<Integer>)`; `getRegisterState().getEntry(int)` → `Complex`; private `calculateCollapsedIndex(int)`, `updateRegisterStateAfterQubitCollapsed(int,int)`.
- `Constants.PAULI_X_MATRIX`, `HADAMARD_MATRIX`, `CONTROLLED_NOT_MATRIX`; `JQApiLimitException` (unchecked).
- `LocalSimulator.execute()` dispatches on `gate.getType()` (currently `MEASUREMENT`, `IDENTITY`).

---

### Task 1: `QuantumRegister.reset` / `resetQubitAtIndexes`

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`
- Create: `src/test/java/org/aitan/jqapi/test/QuantumResetGateTest.java`

**Interfaces:**
- Produces: `public void QuantumRegister.reset(int qubitIndex)` and `public void QuantumRegister.resetQubitAtIndexes(List<Integer> indexes)`; both throw `JQApiLimitException` for an out-of-range index. After `reset(q)`, qubit `q` is `|0⟩`; `getResult()` is untouched.

- [ ] **Step 1: Write the failing tests (creates the test class + register-level helpers)**

Create `src/test/java/org/aitan/jqapi/test/QuantumResetGateTest.java`:

```java
package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumResetGateTest {

    private static final double TOL = 1e-9;

    // Marginal probability that qubit `q` (0 = most significant) is |1>.
    private static double marginalP1(QuantumRegister reg, int q, int nQubits) {
        double p = 0.0;
        int dim = 1 << nQubits;
        for (int i = 0; i < dim; i++) {
            int bit = (i >> (nQubits - 1 - q)) & 1;
            if (bit == 1) {
                Complex a = reg.getRegisterState().getEntry(i);
                p += a.getReal() * a.getReal() + a.getImaginary() * a.getImaginary();
            }
        }
        return p;
    }

    private static double norm(QuantumRegister reg, int nQubits) {
        double n = 0.0;
        int dim = 1 << nQubits;
        for (int i = 0; i < dim; i++) {
            Complex a = reg.getRegisterState().getEntry(i);
            n += a.getReal() * a.getReal() + a.getImaginary() * a.getImaginary();
        }
        return n;
    }

    @Test
    void reset_ket1_becomesKet0() {
        QuantumRegister reg = new QuantumRegister(1);
        reg.applyOperator(Constants.PAULI_X_MATRIX, List.of(0)); // |0> -> |1>
        reg.reset(0);
        assertEquals(Complex.ONE, reg.getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, reg.getRegisterState().getEntry(1));
    }

    @Test
    void reset_ket0_staysKet0() {
        QuantumRegister reg = new QuantumRegister(1);
        reg.reset(0);
        assertEquals(Complex.ONE, reg.getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, reg.getRegisterState().getEntry(1));
    }

    @Test
    void reset_superposition_isDeterministicallyKet0() {
        // Collapse is random, but the reset qubit must always end |0>.
        for (int run = 0; run < 50; run++) {
            QuantumRegister reg = new QuantumRegister(1);
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)); // |+>
            reg.reset(0);
            assertEquals(0.0, marginalP1(reg, 0, 1), TOL, "run " + run);
            assertEquals(1.0, norm(reg, 1), TOL, "run " + run);
        }
    }

    @Test
    void reset_entangledQubit_zeroesMarginal_keepsNorm() {
        // Bell state (|00> + |11>)/sqrt2, then reset qubit 0.
        for (int run = 0; run < 50; run++) {
            QuantumRegister reg = new QuantumRegister(2);
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
            reg.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, 1));
            reg.reset(0);
            assertEquals(0.0, marginalP1(reg, 0, 2), TOL, "run " + run);
            assertEquals(1.0, norm(reg, 2), TOL, "run " + run);
        }
    }

    @Test
    void reset_rejectsOutOfRangeIndex() {
        QuantumRegister reg = new QuantumRegister(2);
        assertThrows(JQApiLimitException.class, () -> reg.reset(5));
        assertThrows(JQApiLimitException.class, () -> reg.resetQubitAtIndexes(List.of(5)));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumResetGateTest test`
Expected: compilation failure — `cannot find symbol: method reset(int)` / `resetQubitAtIndexes(...)`.

- [ ] **Step 3: Add the `Constants` import to `QuantumRegister`**

In `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`, add to the import block (after the existing `import org.aitan.jqapi.utils.Utils;`):

```java
import org.aitan.jqapi.utils.Constants;
```

- [ ] **Step 4: Add `reset` and `resetQubitAtIndexes`**

In `QuantumRegister.java`, add these methods immediately after `measureQubitAtIndexes` (keep them next to the collapse machinery they reuse):

```java
    /**
     * Forces the given qubit to {@code |0>}, regardless of its current state, by
     * collapsing it in the Z basis and applying X if the outcome was 1. Unlike
     * {@link #measureQubitAtIndexes(List)} this does not record a measurement
     * result: it is a reset, not a read-out.
     *
     * @param qubitIndex the qubit to reset
     */
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

    /**
     * Resets each listed qubit to {@code |0>}.
     *
     * @param indexes the qubits to reset
     */
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

- [ ] **Step 5: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumResetGateTest test`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java src/test/java/org/aitan/jqapi/test/QuantumResetGateTest.java
git commit -m "feat(quantum): add QuantumRegister.reset / resetQubitAtIndexes (#7)"
```

---

### Task 2: `Reset` gate + `Constants.RESET` + simulator dispatch

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/utils/Constants.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/Reset.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/simulator/LocalSimulator.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumResetGateTest.java`

**Interfaces:**
- Consumes: `QuantumRegister.resetQubitAtIndexes` (Task 1).
- Produces: `Constants.RESET = "RST"`; `new Reset(Integer... indexes)`; `LocalSimulator.execute` handles `RESET`-typed gates.

- [ ] **Step 1: Write the failing tests (append to the test class)**

Add these imports at the top of `QuantumResetGateTest.java`:

```java
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.Reset;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
```

Add these test methods inside the class:

```java
    @Test
    void resetGate_exposesType() {
        assertEquals(Constants.RESET, new Reset(0).getType());
    }

    @Test
    void simulator_resetsQubitToKet0() {
        // |0> --X--> |1> --Reset--> |0>
        Circuit circuit = new Circuit(1);
        CircuitLevel flip = new CircuitLevel();
        flip.addGate(new PauliX(0));
        CircuitLevel reset = new CircuitLevel();
        reset.addGate(new Reset(0));
        circuit.addLevel(flip);
        circuit.addLevel(reset);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        assertEquals(Complex.ONE, sim.getQuantumRegister().getRegisterState().getEntry(0));
        assertEquals(Complex.ZERO, sim.getQuantumRegister().getRegisterState().getEntry(1));
    }

    @Test
    void simulator_multiIndexReset_returnsAllZeroState() {
        // Flip qubits 0 and 1, then Reset(0,1) -> |000> (index 0).
        Circuit circuit = new Circuit(3);
        CircuitLevel flip = new CircuitLevel();
        flip.addGate(new PauliX(0));
        flip.addGate(new PauliX(1));
        CircuitLevel reset = new CircuitLevel();
        reset.addGate(new Reset(0, 1));
        circuit.addLevel(flip);
        circuit.addLevel(reset);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        assertEquals(Complex.ONE, sim.getQuantumRegister().getRegisterState().getEntry(0));
        for (int i = 1; i < 8; i++) {
            assertEquals(Complex.ZERO, sim.getQuantumRegister().getRegisterState().getEntry(i), "index " + i);
        }
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumResetGateTest test`
Expected: compilation failure — `cannot find symbol: class Reset` / `Constants.RESET`.

- [ ] **Step 3: Add the type string to `Constants`**

In `src/main/java/org/aitan/jqapi/utils/Constants.java`, add alongside the other type strings (e.g. after `MEASUREMENT` or the other labels):

```java
    public static final String RESET = "RST";
```

- [ ] **Step 4: Create the `Reset` gate**

Create `src/main/java/org/aitan/jqapi/quantum/gates/Reset.java`:

```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.utils.Constants;

/**
 * Mid-circuit reset: forces each listed qubit to {@code |0>}. Non-unitary — its
 * matrix is the identity and the simulator special-cases it by type, like
 * {@link Measurement}.
 *
 * @author Gaetano Ferrara
 */
public class Reset extends Gate {

    public Reset(Integer... indexes) {
        super(1, ComplexMatrix.createIdentityMatrix(2), Constants.RESET, indexes);
    }
}
```

- [ ] **Step 5: Add the dispatch branch to `LocalSimulator.execute`**

In `src/main/java/org/aitan/jqapi/quantum/simulator/LocalSimulator.java`, add a branch immediately after the `MEASUREMENT` branch (around line 69):

```java
                    if (gate.getType().equals(Constants.RESET)) {
                        quantumRegister.resetQubitAtIndexes(gate.getIndexes());
                        return; //non-unitary: handled at register level, nothing else to apply
                    }
```

The surrounding block for reference (the new branch goes between `MEASUREMENT` and `IDENTITY`):

```java
                    if (gate.getType().equals(Constants.MEASUREMENT)) {
                        quantumRegister.measureQubitAtIndexes(gate.getIndexes());
                        return; //the measurement gate matrix is the identity: nothing else to apply
                    }
                    if (gate.getType().equals(Constants.RESET)) {
                        quantumRegister.resetQubitAtIndexes(gate.getIndexes());
                        return; //non-unitary: handled at register level, nothing else to apply
                    }
                    if (gate.getType().equals(Constants.IDENTITY)) {
                        return; //no-op
                    }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumResetGateTest test`
Expected: PASS (all reset tests).

- [ ] **Step 7: Commit**

```bash
git add src/main/java/org/aitan/jqapi/utils/Constants.java src/main/java/org/aitan/jqapi/quantum/gates/Reset.java src/main/java/org/aitan/jqapi/quantum/simulator/LocalSimulator.java src/test/java/org/aitan/jqapi/test/QuantumResetGateTest.java
git commit -m "feat(gates): add non-unitary Reset gate with simulator dispatch (#7)"
```

---

### Task 3: Documentation

**Files:**
- Modify: `docs/api/gates.md`
- Modify: `docs/api/simulator.md`
- Modify: `README.md`
- Modify: `docs/api/README.md`
- Modify: `docs/manual/concepts.md`

**Interfaces:**
- Consumes: `Reset` constructor + `Constants.RESET` from Task 2.

- [ ] **Step 1: Add a `## Reset` section to `docs/api/gates.md`**

Insert this section immediately **after** the `## Measurement` section's example block and its trailing `---` (i.e. as a new top-level section before `## Gate summary table`):

```markdown
## Reset

### `Reset`

`new Reset(Integer... indexes)` — a mid-circuit reset that forces each listed
qubit to `|0>`, regardless of its current state. Like `Measurement`, it is
non-unitary: its matrix is the identity and the [simulator](simulator.md)
special-cases it by type, calling
[`QuantumRegister.resetQubitAtIndexes`](quantum.md#resetqubitatindexeslistinteger).
Reset works by collapsing the qubit in the Z basis and applying `X` if the
outcome was 1, so the result is deterministically `|0>` (it does **not** record a
measurement result in `getResult()`).

```java
level.addGate(new Reset(0, 1)); // reset qubits 0 and 1 to |0> mid-circuit
```

---
```

- [ ] **Step 2: Add a summary-table row + Contents entry in `docs/api/gates.md`**

In the "Gate summary table", add this row after the `Measurement` row:

```markdown
| `Reset` | `Reset(Integer...)` | 1 (per index) | `RST` |
```

In the `## Contents` list, add after the Measurement entry:

```markdown
- [Reset](#reset)
```

- [ ] **Step 3: Note the `Reset` dispatch in `docs/api/simulator.md`**

Find the sentence/list describing how `execute()` handles special gates (it mentions `Measurement` and `Identity`). Add `Reset` alongside `Measurement`, e.g. append a bullet or clause:

```markdown
- **Reset** (`Reset`) — collapses each listed qubit and forces it to `|0>` via
  `QuantumRegister.resetQubitAtIndexes`; non-unitary, handled by type like `Measurement`.
```

If the file's structure differs, mirror however `Measurement` is documented there; the requirement is that `Reset` appears as a recognized non-unitary, type-dispatched operation.

- [ ] **Step 4: Update the "Supported gates" line in `README.md`**

Change:
```markdown
Measurement.
```
(the end of the supported-gates sentence) to:
```markdown
Measurement, Reset.
```
If the exact trailing text differs, append `, Reset` to the end of the supported-gates list before the closing period.

- [ ] **Step 5: Update the single-qubit gate list in `docs/api/README.md`**

Change:
```markdown
Single-qubit: `Identity`, `Hadamard`, `PauliX`, `PauliY`, `PauliZ`, `PauliS`,
`PauliT`, `Measurement`.
```
to:
```markdown
Single-qubit: `Identity`, `Hadamard`, `PauliX`, `PauliY`, `PauliZ`, `PauliS`,
`PauliT`, `Measurement`, `Reset`.
```

- [ ] **Step 6: Update the measurement bullet in `docs/manual/concepts.md`**

Change:
```markdown
- **Measurement:** `Measurement(indexes...)` collapses qubits mid-circuit.
```
to:
```markdown
- **Measurement:** `Measurement(indexes...)` collapses qubits mid-circuit.
- **Reset:** `Reset(indexes...)` forces qubits back to `|0>` mid-circuit.
```

- [ ] **Step 7: Verify doc references**

Run:
```bash
grep -q '## Reset' docs/api/gates.md && grep -q 'Reset' docs/api/simulator.md && grep -q 'Reset' README.md && grep -q 'Reset' docs/api/README.md && grep -q 'Reset' docs/manual/concepts.md && echo OK
```
Expected: `OK`.

- [ ] **Step 8: Commit**

```bash
git add docs/api/gates.md docs/api/simulator.md README.md docs/api/README.md docs/manual/concepts.md
git commit -m "docs: document mid-circuit Reset gate (#7)"
```

---

### Task 4: Full-suite verification, push, PR (closes #7)

**Files:** none (verification + git/remote).

**Interfaces:**
- Consumes: all commits from Tasks 1–3.

- [ ] **Step 1: Run the full test suite (golden-master must stay green)**

Run: `mvn -B test`
Expected: `BUILD SUCCESS`, 0 failures, including `QuantumRegisterGoldenMasterTest`.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feature/issue-7-phase-c-reset
```

- [ ] **Step 3: Open the PR via REST API (token from osxkeychain; no gh CLI)**

Open a PR against `main`, title referencing issue #7 Phase C, body summarizing the `Reset` gate + register/simulator plumbing + tests. Include a `Closes #7` line (this is the final phase). Confirm PR number/URL.

- [ ] **Step 4: Report CI status**

After `Build` and `CodeQL` run, confirm both green. Report. Do **not** merge — the maintainer reviews and merges.

---

## Self-Review

- **Spec coverage:** reset methods + reuse of collapse helpers → Task 1; measure-then-X semantics → Task 1 Step 4 + `reset_superposition...`/`reset_entangled...`; `getResult()` not populated → `reset` never touches `result[]` (Task 1 Step 4, no assignment); `Reset` gate → Task 2; `Constants.RESET` → Task 2 Step 3; simulator dispatch → Task 2 Step 5; validation → `reset_rejectsOutOfRangeIndex`; multi-index → `simulator_multiIndexReset...`; golden-master → Task 4 Step 1; docs (gates/simulator/README/api/concepts) → Task 3; closes #7 → Task 4 Step 3. All acceptance criteria mapped.
- **Placeholder scan:** none — every code step has complete code; the two flexible doc instructions (simulator.md, README trailing text) give concrete content + a fallback rule.
- **Type/name consistency:** `reset(int)`, `resetQubitAtIndexes(List<Integer>)`, `Constants.RESET`, `Reset(Integer...)`, and test helpers `marginalP1`/`norm` are used identically across tasks. `JQApiLimitException` is unchecked (thrown in `measureQubitAtIndexes` lambdas), so `assertThrows` needs no `throws` clause. `List.of(qubitIndex)` autoboxes to `List<Integer>` for `applyOperator`.
