# Parametric Gates (Issue #7 Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five parametric single-qubit gates — `Rx(θ)`, `Ry(θ)`, `Rz(θ)`, `Phase(θ)`, `U3(θ,φ,λ)` — whose 2×2 unitary is computed from their parameters.

**Architecture:** Matrix math lives in new `Constants` static factory methods (consistent with the existing computed `PAULI_T_MATRIX`), a `Complex.expI` helper provides `e^(iθ)`, and each gate is a trivial `Gate` subclass. These are ordinary 1-qubit unitaries, so the simulator and `QuantumRegister` are untouched.

**Tech Stack:** Java 21, native `Complex`/`ComplexMatrix` (post #12), JUnit 5 (`org.junit.jupiter`).

## Global Constraints

- Pure Java 21, zero runtime dependencies; native `Complex`/`ComplexMatrix` only.
- No changes to `LocalSimulator` or `QuantumRegister` (parametric gates flow through the existing single-qubit path).
- `Complex.equals` is exact `==`; **all numeric test assertions compare real/imaginary parts within `1e-9`** — never `Complex.equals` for computed values.
- Existing suite, including `QuantumRegisterGoldenMasterTest`, must stay green and unchanged.
- Follow the existing gate pattern: `super(numberQubits, matrix, typeString, indexes)`.
- Standard/Qiskit matrix conventions (see spec).
- No `Co-Authored-By` trailer in commits.

**Reference:** spec `docs/superpowers/specs/2026-07-09-issue-7-phase-a-parametric-gates-design.md`.

**Test/build commands:**
- Single test class: `mvn -B -Dtest=QuantumParametricGateTest test`
- Full suite: `mvn -B test`

---

### Task 1: `Complex.expI` helper + test scaffold

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/math/Complex.java`
- Create: `src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java`

**Interfaces:**
- Produces: `public static Complex Complex.expI(double theta)` returning `new Complex(Math.cos(theta), Math.sin(theta))`.
- Produces (test helpers, reused by later tasks in the same file): `assertComplex(Complex expected, Complex actual)`, `dagger(ComplexMatrix)`, `mul2x2(ComplexMatrix, ComplexMatrix)`, `assertMatrix2(ComplexMatrix expected, ComplexMatrix actual)`, `assertIdentity2(Complex[][])`, constant `TOL = 1e-9`.

- [ ] **Step 1: Write the failing test (creates the test class with shared helpers)**

Create `src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java`:

```java
package org.aitan.jqapi.test;

import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexMatrix;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumParametricGateTest {

    private static final double TOL = 1e-9;

    private static void assertComplex(Complex expected, Complex actual) {
        assertEquals(expected.getReal(), actual.getReal(), TOL, "real part");
        assertEquals(expected.getImaginary(), actual.getImaginary(), TOL, "imag part");
    }

    private static ComplexMatrix dagger(ComplexMatrix m) {
        Complex[][] d = new Complex[2][2];
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                Complex e = m.getEntry(c, r);
                d[r][c] = new Complex(e.getReal(), -e.getImaginary());
            }
        }
        return ComplexMatrix.createMatrixWithData(d);
    }

    private static Complex[][] mul2x2(ComplexMatrix a, ComplexMatrix b) {
        Complex[][] p = new Complex[2][2];
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                Complex sum = Complex.ZERO;
                for (int k = 0; k < 2; k++) {
                    sum = sum.add(a.getEntry(r, k).multiply(b.getEntry(k, c)));
                }
                p[r][c] = sum;
            }
        }
        return p;
    }

    private static void assertMatrix2(ComplexMatrix expected, ComplexMatrix actual) {
        for (int r = 0; r < 2; r++) {
            for (int c = 0; c < 2; c++) {
                assertComplex(expected.getEntry(r, c), actual.getEntry(r, c));
            }
        }
    }

    private static void assertIdentity2(Complex[][] m) {
        assertComplex(Complex.ONE, m[0][0]);
        assertComplex(Complex.ZERO, m[0][1]);
        assertComplex(Complex.ZERO, m[1][0]);
        assertComplex(Complex.ONE, m[1][1]);
    }

    @Test
    void expI_returnsUnitCirclePoints() {
        assertComplex(new Complex(1, 0), Complex.expI(0));
        assertComplex(new Complex(0, 1), Complex.expI(Math.PI / 2));
        assertComplex(new Complex(-1, 0), Complex.expI(Math.PI));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: compilation failure — `cannot find symbol: method expI(double)`.

- [ ] **Step 3: Add `expI` to `Complex`**

In `src/main/java/org/aitan/jqapi/math/Complex.java`, add this method (e.g. just after the `multiply(double)` method, keeping style consistent):

```java
    /**
     * @param theta the angle in radians
     * @return {@code e^(i·theta) = (cos theta, sin theta)}
     */
    public static Complex expI(double theta) {
        return new Complex(Math.cos(theta), Math.sin(theta));
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/math/Complex.java src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java
git commit -m "feat(math): add Complex.expI helper (#7)"
```

---

### Task 2: `Constants` type strings + parametric matrix factories

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/utils/Constants.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java`

**Interfaces:**
- Consumes: `Complex.expI` (Task 1); test helpers (Task 1).
- Produces on `Constants`: string constants `RX="Rx"`, `RY="Ry"`, `RZ="Rz"`, `PHASE="P"`, `U3="U3"`; and `public static ComplexMatrix rotationXMatrix(double theta)`, `rotationYMatrix(double theta)`, `rotationZMatrix(double theta)`, `phaseMatrix(double theta)`, `u3Matrix(double theta, double phi, double lambda)`.

- [ ] **Step 1: Write the failing tests (append to the test class)**

Add these methods inside `QuantumParametricGateTest`:

```java
    @Test
    void rotationX_matchesFormula() {
        // Rx(0) = I
        assertMatrix2(ComplexMatrix.createIdentityMatrix(2),
                org.aitan.jqapi.utils.Constants.rotationXMatrix(0));
        // Rx(pi) = [[0, -i],[-i, 0]]  (= -i * X)
        ComplexMatrix rx = org.aitan.jqapi.utils.Constants.rotationXMatrix(Math.PI);
        assertComplex(new Complex(0, 0), rx.getEntry(0, 0));
        assertComplex(new Complex(0, -1), rx.getEntry(0, 1));
        assertComplex(new Complex(0, -1), rx.getEntry(1, 0));
        assertComplex(new Complex(0, 0), rx.getEntry(1, 1));
    }

    @Test
    void rotationY_matchesFormula() {
        // Ry(pi) = [[0, -1],[1, 0]]
        ComplexMatrix ry = org.aitan.jqapi.utils.Constants.rotationYMatrix(Math.PI);
        assertComplex(new Complex(0, 0), ry.getEntry(0, 0));
        assertComplex(new Complex(-1, 0), ry.getEntry(0, 1));
        assertComplex(new Complex(1, 0), ry.getEntry(1, 0));
        assertComplex(new Complex(0, 0), ry.getEntry(1, 1));
    }

    @Test
    void rotationZ_matchesFormula() {
        // Rz(pi) = diag(e^{-i pi/2}, e^{i pi/2}) = diag(-i, i)
        ComplexMatrix rz = org.aitan.jqapi.utils.Constants.rotationZMatrix(Math.PI);
        assertComplex(new Complex(0, -1), rz.getEntry(0, 0));
        assertComplex(new Complex(0, 0), rz.getEntry(0, 1));
        assertComplex(new Complex(0, 0), rz.getEntry(1, 0));
        assertComplex(new Complex(0, 1), rz.getEntry(1, 1));
    }

    @Test
    void phase_matchesFormula() {
        // P(pi/2) = diag(1, i)
        ComplexMatrix p = org.aitan.jqapi.utils.Constants.phaseMatrix(Math.PI / 2);
        assertComplex(Complex.ONE, p.getEntry(0, 0));
        assertComplex(Complex.ZERO, p.getEntry(0, 1));
        assertComplex(Complex.ZERO, p.getEntry(1, 0));
        assertComplex(new Complex(0, 1), p.getEntry(1, 1));
    }

    @Test
    void unitarity_UtimesUDagger_isIdentity() {
        double[] angles = {0.3, 1.0, Math.PI / 2, Math.PI, 2.0};
        for (double a : angles) {
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationXMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationXMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationYMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationYMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.rotationZMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.rotationZMatrix(a))));
            assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.phaseMatrix(a),
                    dagger(org.aitan.jqapi.utils.Constants.phaseMatrix(a))));
        }
        assertIdentity2(mul2x2(org.aitan.jqapi.utils.Constants.u3Matrix(1.0, 0.5, 2.0),
                dagger(org.aitan.jqapi.utils.Constants.u3Matrix(1.0, 0.5, 2.0))));
    }

    @Test
    void u3_knownEquivalences() {
        // U3(pi, 0, pi) = X
        assertMatrix2(org.aitan.jqapi.utils.Constants.PAULI_X_MATRIX,
                org.aitan.jqapi.utils.Constants.u3Matrix(Math.PI, 0, Math.PI));
        // U3(pi/2, 0, pi) = H
        assertMatrix2(org.aitan.jqapi.utils.Constants.HADAMARD_MATRIX,
                org.aitan.jqapi.utils.Constants.u3Matrix(Math.PI / 2, 0, Math.PI));
        // U3(0, 0, lambda) = P(lambda)
        double lambda = 0.7;
        assertMatrix2(org.aitan.jqapi.utils.Constants.phaseMatrix(lambda),
                org.aitan.jqapi.utils.Constants.u3Matrix(0, 0, lambda));
    }

    @Test
    void rz_isPhaseUpToGlobalPhase() {
        // Rz(theta) = e^{-i theta/2} * P(theta), entrywise
        double theta = 1.3;
        ComplexMatrix rz = org.aitan.jqapi.utils.Constants.rotationZMatrix(theta);
        ComplexMatrix p = org.aitan.jqapi.utils.Constants.phaseMatrix(theta);
        Complex global = Complex.expI(-theta / 2);
        assertComplex(p.getEntry(0, 0).multiply(global), rz.getEntry(0, 0));
        assertComplex(p.getEntry(1, 1).multiply(global), rz.getEntry(1, 1));
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: compilation failure — `cannot find symbol: method rotationXMatrix(double)` (etc.).

- [ ] **Step 3: Add type strings and factory methods to `Constants`**

In `src/main/java/org/aitan/jqapi/utils/Constants.java`, add the string constants alongside the existing type strings (e.g. after `TOFFOLI`):

```java
    public static final String RX = "Rx";
    public static final String RY = "Ry";
    public static final String RZ = "Rz";
    public static final String PHASE = "P";
    public static final String U3 = "U3";
```

And add these factory methods (e.g. at the end of the class body, before the closing brace):

```java
    /** @param theta angle in radians @return the Rx(theta) rotation matrix */
    public static ComplexMatrix rotationXMatrix(double theta) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        Complex diag = new Complex(c, 0);
        Complex offDiag = new Complex(0, -s); // -i sin(theta/2)
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {diag, offDiag},
            {offDiag, diag}});
    }

    /** @param theta angle in radians @return the Ry(theta) rotation matrix */
    public static ComplexMatrix rotationYMatrix(double theta) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {new Complex(c, 0), new Complex(-s, 0)},
            {new Complex(s, 0), new Complex(c, 0)}});
    }

    /** @param theta angle in radians @return the Rz(theta) rotation matrix */
    public static ComplexMatrix rotationZMatrix(double theta) {
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {Complex.expI(-theta / 2), Complex.ZERO},
            {Complex.ZERO, Complex.expI(theta / 2)}});
    }

    /** @param theta angle in radians @return the phase-shift P(theta) matrix */
    public static ComplexMatrix phaseMatrix(double theta) {
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {Complex.ONE, Complex.ZERO},
            {Complex.ZERO, Complex.expI(theta)}});
    }

    /** @return the universal single-qubit U3(theta, phi, lambda) matrix */
    public static ComplexMatrix u3Matrix(double theta, double phi, double lambda) {
        double c = Math.cos(theta / 2);
        double s = Math.sin(theta / 2);
        Complex m00 = new Complex(c, 0);
        Complex m01 = Complex.expI(lambda).multiply(-s);
        Complex m10 = Complex.expI(phi).multiply(s);
        Complex m11 = Complex.expI(phi + lambda).multiply(c);
        return ComplexMatrix.createMatrixWithData(new Complex[][]{
            {m00, m01},
            {m10, m11}});
    }
```

Note: `Complex` and `ComplexMatrix` are already imported in `Constants.java`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: PASS (all tests so far, including the 6 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/utils/Constants.java src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java
git commit -m "feat(gates): add parametric matrix factories and type strings to Constants (#7)"
```

---

### Task 3: Gate classes `Rx`, `Ry`, `Rz`, `Phase`, `U3`

**Files:**
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/Rx.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/Ry.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/Rz.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/Phase.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/gates/U3.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java`

**Interfaces:**
- Consumes: `Constants` factories + type strings (Task 2); test helpers (Task 1).
- Produces: `new Rx(double theta, Integer... indexes)`, `new Ry(...)`, `new Rz(...)`, `new Phase(double theta, Integer... indexes)`, `new U3(double theta, double phi, double lambda, Integer... indexes)`; each exposes `getMatrix()` and `getType()` from `Gate`.

- [ ] **Step 1: Write the failing tests (append to the test class)**

Add these imports at the top of `QuantumParametricGateTest.java`:

```java
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.Rx;
import org.aitan.jqapi.quantum.gates.Ry;
import org.aitan.jqapi.quantum.gates.Rz;
import org.aitan.jqapi.quantum.gates.Phase;
import org.aitan.jqapi.quantum.gates.U3;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.utils.Constants;
```

Add these test methods inside the class:

```java
    @Test
    void gates_exposeCorrectMatrixAndType() {
        assertMatrix2(Constants.rotationXMatrix(0.4), new Rx(0.4, 0).getMatrix());
        assertEquals(Constants.RX, new Rx(0.4, 0).getType());

        assertMatrix2(Constants.rotationYMatrix(0.4), new Ry(0.4, 0).getMatrix());
        assertEquals(Constants.RY, new Ry(0.4, 0).getType());

        assertMatrix2(Constants.rotationZMatrix(0.4), new Rz(0.4, 0).getMatrix());
        assertEquals(Constants.RZ, new Rz(0.4, 0).getType());

        assertMatrix2(Constants.phaseMatrix(0.4), new Phase(0.4, 0).getMatrix());
        assertEquals(Constants.PHASE, new Phase(0.4, 0).getType());

        assertMatrix2(Constants.u3Matrix(0.4, 0.5, 0.6), new U3(0.4, 0.5, 0.6, 0).getMatrix());
        assertEquals(Constants.U3, new U3(0.4, 0.5, 0.6, 0).getType());
    }

    @Test
    void rxPi_on_ket0_gives_minus_i_ket1() {
        Circuit circuit = new Circuit(1);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Rx(Math.PI, 0));
        circuit.addLevel(level);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        QuantumRegister reg = sim.getQuantumRegister();
        // Rx(pi)|0> = -i|1>
        assertComplex(new Complex(0, 0), reg.getRegisterState().getEntry(0));
        assertComplex(new Complex(0, -1), reg.getRegisterState().getEntry(1));
    }

    @Test
    void ryPi_on_qubit1_of_two_qubit_register() {
        // qubit 0 is the most significant bit; |00> has index 0.
        // Ry(pi) flips |0> -> |1> (real), so applying to qubit 1 gives |01> = index 1.
        Circuit circuit = new Circuit(2);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Ry(Math.PI, 1));
        circuit.addLevel(level);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        QuantumRegister reg = sim.getQuantumRegister();
        assertComplex(new Complex(0, 0), reg.getRegisterState().getEntry(0));
        assertComplex(new Complex(1, 0), reg.getRegisterState().getEntry(1));
        assertComplex(new Complex(0, 0), reg.getRegisterState().getEntry(2));
        assertComplex(new Complex(0, 0), reg.getRegisterState().getEntry(3));
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: compilation failure — `cannot find symbol: class Rx` (etc.).

- [ ] **Step 3: Create the five gate classes**

`src/main/java/org/aitan/jqapi/quantum/gates/Rx.java`:
```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Rx(theta) — rotation about the X axis.
 *
 * @author Gaetano Ferrara
 */
public class Rx extends Gate {

    public Rx(double theta, Integer... indexes) {
        super(1, Constants.rotationXMatrix(theta), Constants.RX, indexes);
    }
}
```

`src/main/java/org/aitan/jqapi/quantum/gates/Ry.java`:
```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Ry(theta) — rotation about the Y axis.
 *
 * @author Gaetano Ferrara
 */
public class Ry extends Gate {

    public Ry(double theta, Integer... indexes) {
        super(1, Constants.rotationYMatrix(theta), Constants.RY, indexes);
    }
}
```

`src/main/java/org/aitan/jqapi/quantum/gates/Rz.java`:
```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Rz(theta) — rotation about the Z axis.
 *
 * @author Gaetano Ferrara
 */
public class Rz extends Gate {

    public Rz(double theta, Integer... indexes) {
        super(1, Constants.rotationZMatrix(theta), Constants.RZ, indexes);
    }
}
```

`src/main/java/org/aitan/jqapi/quantum/gates/Phase.java`:
```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * Phase-shift gate P(theta) = diag(1, e^(i·theta)).
 *
 * @author Gaetano Ferrara
 */
public class Phase extends Gate {

    public Phase(double theta, Integer... indexes) {
        super(1, Constants.phaseMatrix(theta), Constants.PHASE, indexes);
    }
}
```

`src/main/java/org/aitan/jqapi/quantum/gates/U3.java`:
```java
package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.utils.Constants;

/**
 * U3(theta, phi, lambda) — universal single-qubit rotation.
 *
 * @author Gaetano Ferrara
 */
public class U3 extends Gate {

    public U3(double theta, double phi, double lambda, Integer... indexes) {
        super(1, Constants.u3Matrix(theta, phi, lambda), Constants.U3, indexes);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumParametricGateTest test`
Expected: PASS (all parametric-gate tests).

- [ ] **Step 5: Commit**

```bash
git add src/main/java/org/aitan/jqapi/quantum/gates/Rx.java src/main/java/org/aitan/jqapi/quantum/gates/Ry.java src/main/java/org/aitan/jqapi/quantum/gates/Rz.java src/main/java/org/aitan/jqapi/quantum/gates/Phase.java src/main/java/org/aitan/jqapi/quantum/gates/U3.java src/test/java/org/aitan/jqapi/test/QuantumParametricGateTest.java
git commit -m "feat(gates): add parametric gates Rx, Ry, Rz, Phase, U3 (#7)"
```

---

### Task 4: Document the parametric gates

**Files:**
- Modify: `docs/api/gates.md`

**Interfaces:**
- Consumes: the gate constructor signatures and type strings from Tasks 2–3.

- [ ] **Step 1: Add the "Parametric single-qubit gates" section**

In `docs/api/gates.md`, insert this new section immediately **before** the line `## Multi-qubit gates`:

```markdown
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
```

- [ ] **Step 2: Add these gates to the Contents list**

In the `## Contents` section of `docs/api/gates.md`, add a bullet matching the existing style (a link to the new section):

```markdown
- [Parametric single-qubit gates](#parametric-single-qubit-gates)
```

Place it adjacent to the existing "Single-qubit gates"/"Multi-qubit gates" entries, following the file's existing list format.

- [ ] **Step 3: Verify the doc references resolve**

Run:
```bash
grep -q 'Parametric single-qubit gates' docs/api/gates.md && grep -q 'new U3(double theta' docs/api/gates.md && echo OK
```
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/api/gates.md
git commit -m "docs: document parametric gates Rx/Ry/Rz/Phase/U3 (#7)"
```

---

### Task 5: Full-suite verification, push, PR

**Files:** none (verification + git/remote).

**Interfaces:**
- Consumes: all commits from Tasks 1–4.

- [ ] **Step 1: Run the full test suite (golden-master must stay green)**

Run: `mvn -B test`
Expected: `BUILD SUCCESS`, 0 failures, including `QuantumRegisterGoldenMasterTest` and all pre-existing tests.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feature/issue-7-phase-a-parametric-gates
```
Expected: branch published.

- [ ] **Step 3: Open the PR via REST API (token from osxkeychain; no gh CLI)**

Open a PR against `main`, title referencing issue #7 Phase A, body summarizing the five gates + `Complex.expI` + tests, and noting this is Phase A of 3 (so it does **not** close #7). Confirm the PR number/URL.

- [ ] **Step 4: Report CI status**

After the `Build` and `CodeQL` workflows run, confirm both green. Report the result. Do **not** merge — the maintainer reviews and merges.

---

## Self-Review

- **Spec coverage:** matrices → Task 2 Step 3 + tests Step 1; `Complex.expI` → Task 1; Constants factories + type strings → Task 2; gate classes → Task 3; `getType()` = category → Task 3 `gates_exposeCorrectMatrixAndType`; no simulator/register change → nothing touches those files (verified by Task 5 full suite); tolerance testing → helpers in Task 1, used throughout; unitarity + equivalences + simulator integration → Task 2 (`unitarity...`, `u3_knownEquivalences`, `rz_isPhaseUpToGlobalPhase`) + Task 3 (`rxPi...`, `ryPi...`); golden-master unchanged → Task 5 Step 1; docs → Task 4. All spec acceptance criteria mapped.
- **Placeholder scan:** none — every code step shows complete code; the one flexible instruction (Contents bullet placement) gives concrete content + a format rule.
- **Type/name consistency:** `Complex.expI(double)`, `Constants.rotationXMatrix/rotationYMatrix/rotationZMatrix/phaseMatrix/u3Matrix`, type strings `RX/RY/RZ/PHASE/U3`, gate ctors `Rx/Ry/Rz/Phase(double,Integer...)` and `U3(double,double,double,Integer...)`, and test helpers `assertComplex/assertMatrix2/assertIdentity2/mul2x2/dagger` are used identically across tasks. `Complex.multiply(double)` and `ComplexMatrix.getEntry/createMatrixWithData/createIdentityMatrix` match the existing API.
