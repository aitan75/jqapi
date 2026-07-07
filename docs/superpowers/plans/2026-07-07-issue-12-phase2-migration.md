# Issue #12 Phase 2 — QuantumRegister Primitive State Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `QuantumRegister`'s internal `ComplexVector` state with a raw interleaved `double[]`, eliminating boxed `Complex` allocation from the `applyOperator`/`measure` hot paths, with a golden-master test proving numerical equivalence and a production benchmark proving the perf win.

**Architecture:** Single-file production change (`QuantumRegister.java`): the state becomes `private double[] registerState` (amplitude `i` real part at `2*i`, imaginary at `2*i+1`); hot methods work entirely in primitives; boundary methods (`getRegisterState`, `getQubitRegisterState`, `setRegisterState`, register initialization) convert to/from `ComplexVector` once per call. A characterization ("golden master") test is written FIRST against the current `Complex`-based implementation and must keep passing unmodified after the migration. A production benchmark of the real `applyOperator` runs once BEFORE the migration (baseline) and once after.

**Tech Stack:** Java 21, Maven, JUnit Jupiter 6, commons-math3 3.6.1 (stays — only `QuantumRegister`'s internals stop using its boxed `Complex` in hot loops).

**Spec:** `docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md` (committed at `0ba2fbf`). Read it if any requirement here seems ambiguous — the spec governs.

## Global Constraints

- **Zero changes** to `ComplexVector`, `ComplexMatrix`, `Qubit`, `QubitZero`, `QubitOne`, `QubitSuperposition`, `Algorithm`, `Constants.java`, `Utils.java`, `LocalSimulator.java`, or any gate class under `src/main/java/org/aitan/jqapi/quantum/gates/`. The ONLY production file modified in this entire plan is `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java` (Task 3).
- Interleaved layout convention: amplitude `i` real part at `registerState[2*i]`, imaginary part at `registerState[2*i + 1]`.
- Squared magnitude is computed as `re*re + im*im` (replaces `Math.pow(complex.abs(), 2)`).
- Test tolerance: `EPS = 1e-9` (same constant/convention as `QuantumRegisterTest`).
- Existing tests (`QuantumRegisterTest`, `QuantumAlgorithmTest`, and the rest of the suite) must pass **unmodified** at the end of every task.
- The benchmark class must NOT match surefire's include patterns (`*Test`, `Test*`, `*Tests`, `*TestCase`) so `mvn test` never runs it — same convention as `MemoryLimitBenchmark`/`RepresentationBenchmark`.
- Commits: conventional-commit style, referencing `(#12)` in the subject.
- Working directory: worktree `/Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration`, branch `feature/issue-12-phase2-migration` (branched from `main` at `0ba2fbf`). Already created; `mvn -q test` verified green on the branch point.
- **Shell caveat:** a broken `rtk` shell hook intercepts bare `git` (fails with "hook integrity check FAILED"). Always invoke git as `/usr/bin/git` (e.g. `/usr/bin/git -C <worktree> add …`). Maven and `java` are unaffected.
- Task order is load-bearing: Task 2's baseline benchmark run MUST happen before Task 3's migration lands (it measures the pre-migration implementation). Do not reorder.
- Qubit/bit convention (from `QuantumRegister`/`LocalSimulator` javadoc): qubit 0 is the MOST significant bit of the state index; qubit `q` lives at integer bit position `size - 1 - q`. In a multi-qubit gate, the first listed target qubit is the most significant bit of the gate's local basis.

---

### Task 1: Golden-master characterization test

Capture the CURRENT (pre-migration, `Complex`-based) implementation's output as literal expected amplitudes. This is a characterization test, not classic TDD: it must PASS immediately against the current implementation (proving the captured values are right), and it is the safety net Task 3 must not break.

**Files:**
- Create: `src/test/java/org/aitan/jqapi/test/QuantumRegisterGoldenMasterTest.java`

**Interfaces:**
- Consumes: `QuantumRegister(int)`, `QuantumRegister.applyOperator(ComplexMatrix, List<Integer>)`, `QuantumRegister.getRegisterState()` → `ComplexVector` (`getEntry(i)` → `Complex` with `getReal()`/`getImaginary()`), gate classes `Hadamard(Integer...)`, `PauliX/Y/Z/S/T(Integer...)`, `ControlledNot/ControlledZ/ControlledY/Swap(Integer, Integer)`, `Toffoli/ControlledSwap(Integer, Integer, Integer)` — each exposing `getMatrix()`.
- Produces: the test class `QuantumRegisterGoldenMasterTest` (20 `@Test` methods) that Tasks 3 and 4 re-run as the equivalence proof. No production API.

- [ ] **Step 1: Write the test**

The expected values below were derived from the documented conventions (qubit 0 = MSB; first listed gate qubit = MSB of the gate's local basis) and the gate matrices in `Constants.java`. Every state is prepared from `|0…0>` through `applyOperator` calls only (no measurement — everything is deterministic).

Create `src/test/java/org/aitan/jqapi/test/QuantumRegisterGoldenMasterTest.java`:

```java
package org.aitan.jqapi.test;

import java.util.Arrays;
import java.util.Collections;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.gates.ControlledNot;
import org.aitan.jqapi.quantum.gates.ControlledSwap;
import org.aitan.jqapi.quantum.gates.ControlledY;
import org.aitan.jqapi.quantum.gates.ControlledZ;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliS;
import org.aitan.jqapi.quantum.gates.PauliT;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.gates.PauliY;
import org.aitan.jqapi.quantum.gates.PauliZ;
import org.aitan.jqapi.quantum.gates.Swap;
import org.aitan.jqapi.quantum.gates.Toffoli;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Golden-master characterization tests for issue #12 phase 2: the expected
 * amplitudes below were captured from the pre-migration, Complex-based
 * QuantumRegister and must keep passing unmodified after the internal state
 * migrates to a primitive double[]. Every state is prepared deterministically
 * via applyOperator (no measurement). Conventions: qubit 0 is the most
 * significant bit of the state index; in a multi-qubit gate the first target
 * qubit is the most significant bit of the gate's local basis.
 */
public class QuantumRegisterGoldenMasterTest {

    private static final double EPS = 1e-9;
    private static final double INV_SQRT2 = 1.0 / Math.sqrt(2.0);
    /** Uniform amplitude of a 3-qubit register after H on every qubit. */
    private static final double UNIFORM_3 = 1.0 / (2.0 * Math.sqrt(2.0));

    /** Asserts every amplitude of the register, given as interleaved (re, im) pairs. */
    private static void assertState(QuantumRegister qreg, double... expectedInterleaved) {
        ComplexVector state = qreg.getRegisterState();
        assertEquals(expectedInterleaved.length / 2, state.getDimension(), "state dimension");
        for (int i = 0; i < state.getDimension(); i++) {
            assertEquals(expectedInterleaved[2 * i], state.getEntry(i).getReal(), EPS, "re[" + i + "]");
            assertEquals(expectedInterleaved[2 * i + 1], state.getEntry(i).getImaginary(), EPS, "im[" + i + "]");
        }
    }

    //--- single-qubit gates on a 1-qubit register ---

    @Test
    public void testHadamardOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        //H|0> = (|0> + |1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, INV_SQRT2, 0);
    }

    @Test
    public void testPauliXOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        //X|0> = |1>
        assertState(qreg, 0, 0, 1, 0);
    }

    @Test
    public void testPauliYOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new PauliY(0).getMatrix(), Collections.singletonList(0));
        //Y|0> = i|1>
        assertState(qreg, 0, 0, 0, 1);
    }

    @Test
    public void testPauliZOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliZ(0).getMatrix(), Collections.singletonList(0));
        //ZH|0> = (|0> - |1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, -INV_SQRT2, 0);
    }

    @Test
    public void testPauliSOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliS(0).getMatrix(), Collections.singletonList(0));
        //SH|0> = (|0> + i|1>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0, INV_SQRT2);
    }

    @Test
    public void testPauliTOnOneQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(1);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliT(0).getMatrix(), Collections.singletonList(0));
        //TH|0> = (|0> + e^{i*pi/4}|1>)/sqrt(2); e^{i*pi/4}/sqrt(2) = 0.5 + 0.5i
        assertState(qreg, INV_SQRT2, 0, 0.5, 0.5);
    }

    //--- single-qubit gates applied to one target (qubit 1) of a 2-qubit register ---

    @Test
    public void testHadamardOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        //(|00> + |01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, INV_SQRT2, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliXOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        //|01>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliYOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliY(1).getMatrix(), Collections.singletonList(1));
        //i|01>
        assertState(qreg, 0, 0, 0, 1, 0, 0, 0, 0);
    }

    @Test
    public void testPauliZOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliZ(1).getMatrix(), Collections.singletonList(1));
        //(|00> - |01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, -INV_SQRT2, 0, 0, 0, 0, 0);
    }

    @Test
    public void testPauliSOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliS(1).getMatrix(), Collections.singletonList(1));
        //(|00> + i|01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0, INV_SQRT2, 0, 0, 0, 0);
    }

    @Test
    public void testPauliTOnTargetQubitOfTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new PauliT(1).getMatrix(), Collections.singletonList(1));
        //(|00> + e^{i*pi/4}|01>)/sqrt(2)
        assertState(qreg, INV_SQRT2, 0, 0.5, 0.5, 0, 0, 0, 0);
    }

    //--- 2-qubit gates on a 2-qubit register ---

    @Test
    public void testControlledNotOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CNOT(control 0, target 1)|10> = |11>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 1, 0);
    }

    @Test
    public void testControlledZOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledZ(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CZ on the uniform 2-qubit state flips the sign of |11> only
        assertState(qreg, 0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0);
    }

    @Test
    public void testControlledYOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledY(0, 1).getMatrix(), Arrays.asList(0, 1));
        //CY on (|10> + |11>)/sqrt(2): |10> <- -i/sqrt(2), |11> <- i/sqrt(2)
        assertState(qreg, 0, 0, 0, 0, 0, -INV_SQRT2, 0, INV_SQRT2);
    }

    @Test
    public void testSwapOnTwoQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(2);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Swap(0, 1).getMatrix(), Arrays.asList(0, 1));
        //Swap|10> = |01>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    //--- 2-qubit gates on a 3-qubit register, non-adjacent targets (qubits 0 and 2) ---

    @Test
    public void testControlledNotOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 2).getMatrix(), Arrays.asList(0, 2));
        //CNOT(control 0, target 2)|100> = |101>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    @Test
    public void testControlledZOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledZ(0, 2).getMatrix(), Arrays.asList(0, 2));
        //Uniform over qubits 0 and 2 (qubit 1 stays |0>): |000>,|001>,|100>,|101> at 1/2;
        //CZ(0,2) flips the sign of |101> only
        assertState(qreg, 0.5, 0, 0.5, 0, 0, 0, 0, 0, 0.5, 0, -0.5, 0, 0, 0, 0, 0);
    }

    @Test
    public void testControlledYOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledY(0, 2).getMatrix(), Arrays.asList(0, 2));
        //CY(0,2) on (|100> + |101>)/sqrt(2): |100> <- -i/sqrt(2), |101> <- i/sqrt(2)
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, -INV_SQRT2, 0, INV_SQRT2, 0, 0, 0, 0);
    }

    @Test
    public void testSwapOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Swap(0, 2).getMatrix(), Arrays.asList(0, 2));
        //Swap(0,2)|100> = |001>
        assertState(qreg, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    //--- 3-qubit gates on a 3-qubit register ---

    @Test
    public void testToffoliOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new Toffoli(0, 1, 2).getMatrix(), Arrays.asList(0, 1, 2));
        //Toffoli|110> = |111>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0);
    }

    @Test
    public void testControlledSwapOnThreeQubitRegister() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new PauliX(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliX(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new ControlledSwap(0, 1, 2).getMatrix(), Arrays.asList(0, 1, 2));
        //CSwap(control 0)|110> = |101>
        assertState(qreg, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);
    }

    //--- multi-level circuits on a 3-qubit register ---

    @Test
    public void testMultiLevelHadamardAllThenControlledNot() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new Hadamard(1).getMatrix(), Collections.singletonList(1));
        qreg.applyOperator(new Hadamard(2).getMatrix(), Collections.singletonList(2));
        qreg.applyOperator(new ControlledNot(0, 1).getMatrix(), Arrays.asList(0, 1));
        //The uniform state is invariant under the CNOT permutation: all amplitudes 1/(2*sqrt(2))
        assertState(qreg,
                UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0,
                UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0, UNIFORM_3, 0);
    }

    @Test
    public void testMultiLevelHadamardPauliTThenControlledNot() {
        QuantumRegister qreg = new QuantumRegister(3);
        qreg.applyOperator(new Hadamard(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new PauliT(0).getMatrix(), Collections.singletonList(0));
        qreg.applyOperator(new ControlledNot(0, 2).getMatrix(), Arrays.asList(0, 2));
        //H(0) then T(0): (|000> + e^{i*pi/4}|100>)/sqrt(2); CNOT(0,2) moves |100> to |101>.
        //Entangled final state: |000>/sqrt(2) + (0.5 + 0.5i)|101>
        assertState(qreg, INV_SQRT2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 0);
    }
}
```

- [ ] **Step 2: Run the new test — it must PASS against the current implementation**

Run: `mvn -q test -Dtest=QuantumRegisterGoldenMasterTest`
Expected: BUILD SUCCESS, 20 tests run, 0 failures. If any test fails, the expected literal in THAT test is wrong (the current implementation is the oracle by definition) — re-derive the value from the conventions above and fix the test, not the production code.

- [ ] **Step 3: Run the full suite to confirm nothing else is disturbed**

Run: `mvn -q test`
Expected: BUILD SUCCESS (quiet output = success).

- [ ] **Step 4: Commit**

```bash
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration add src/test/java/org/aitan/jqapi/test/QuantumRegisterGoldenMasterTest.java
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration commit -m "test: golden-master characterization of QuantumRegister amplitudes (#12)"
```

---

### Task 2: Production benchmark class + pre-migration baseline run

Measures the REAL `QuantumRegister.applyOperator` (not Phase 1's isolated spike harness). This task MUST run before Task 3: the numbers recorded here are the `Complex`-based baseline.

**Files:**
- Create: `src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterHotLoopBenchmark.java`
- Modify: `docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md` (append a `## Results` section with the baseline table)

**Interfaces:**
- Consumes: `QuantumRegister(int)`, `applyOperator(ComplexMatrix, List<Integer>)`, `Constants.HADAMARD_MATRIX`, `Constants.CONTROLLED_NOT_MATRIX`. Default `JQAPIConfig` allows 24 qubits, so 16/20-qubit registers need no config override.
- Produces: `QuantumRegisterHotLoopBenchmark` with `public static void main(String[])`, re-run unchanged in Task 4.

- [ ] **Step 1: Write the benchmark class**

Create `src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterHotLoopBenchmark.java`:

```java
package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;

/**
 * Standalone benchmark of the production {@code QuantumRegister.applyOperator}
 * hot loop, for issue #12 phase 2's before/after comparison. Like
 * {@link MemoryLimitBenchmark} and {@link RepresentationBenchmark}, this is
 * intentionally NOT a JUnit test: no {@code @Test} method, and its name doesn't
 * match surefire's include patterns ({@code *Test}, {@code Test*},
 * {@code *Tests}, {@code *TestCase}), so {@code mvn test} never runs it. Run it
 * manually via its {@code main} method.
 * <p>
 * For each of {16, 20} qubits x {1-qubit Hadamard, 2-qubit CNOT}, measures
 * steady-state wall-clock time and per-thread allocated bytes for repeated
 * gate application on an already-constructed register. Both gates are
 * self-inverse, so repeated application keeps the state bounded.
 */
public final class QuantumRegisterHotLoopBenchmark {

    private static final int[] QUBIT_COUNTS = {16, 20};
    private static final int WARMUP_ITERATIONS = 50;
    private static final int TIMED_ITERATIONS = 200;

    private QuantumRegisterHotLoopBenchmark() {
    }

    public static void main(String[] args) {
        printEnvironment();
        System.out.printf("%-6s %-14s %-14s %-14s%n", "n", "gate", "ns/op", "bytes/op");
        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", Constants.HADAMARD_MATRIX, Collections.singletonList(0));
            runCase(n, "2-qubit(CNOT)", Constants.CONTROLLED_NOT_MATRIX, Arrays.asList(0, n - 1));
        }
    }

    private static void runCase(int n, String gateLabel, ComplexMatrix gate, List<Integer> targets) {
        QuantumRegister register = new QuantumRegister(n);
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            register.applyOperator(gate, targets);
        }

        ThreadMXBean threadBean = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        if (threadBean.isThreadAllocatedMemorySupported() && !threadBean.isThreadAllocatedMemoryEnabled()) {
            threadBean.setThreadAllocatedMemoryEnabled(true);
        }
        long threadId = Thread.currentThread().threadId();

        long allocBefore = threadBean.getThreadAllocatedBytes(threadId);
        long start = System.nanoTime();
        for (int i = 0; i < TIMED_ITERATIONS; i++) {
            register.applyOperator(gate, targets);
        }
        long elapsedNs = System.nanoTime() - start;
        long allocAfter = threadBean.getThreadAllocatedBytes(threadId);

        double nsPerOp = elapsedNs / (double) TIMED_ITERATIONS;
        double bytesPerOp = (allocAfter - allocBefore) / (double) TIMED_ITERATIONS;
        System.out.printf("%-6d %-14s %-14.1f %-14.1f%n", n, gateLabel, nsPerOp, bytesPerOp);
    }

    private static void printEnvironment() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("==============================================================");
        System.out.println(" JQAPI QuantumRegister hot-loop benchmark (issue #12 phase 2)");
        System.out.println("==============================================================");
        System.out.println("os.name              : " + System.getProperty("os.name"));
        System.out.println("os.arch              : " + System.getProperty("os.arch"));
        System.out.println("java.version         : " + System.getProperty("java.version"));
        System.out.println("availableProcessors  : " + rt.availableProcessors());
        System.out.println();
    }
}
```

- [ ] **Step 2: Compile and confirm surefire exclusion**

Run: `mvn -q test`
Expected: BUILD SUCCESS, and the surefire report list must NOT contain `QuantumRegisterHotLoopBenchmark`. Verify with:
`/bin/ls target/surefire-reports/ | /usr/bin/grep -c QuantumRegisterHotLoopBenchmark` → expected output `0` (exit code 1 from grep is fine — it means zero matches).

- [ ] **Step 3: Run the baseline (pre-migration) benchmark**

```bash
mvn -q test-compile dependency:build-classpath -Dmdep.outputFile=target/classpath.txt
java -cp target/classes:target/test-classes:$(cat target/classpath.txt) org.aitan.jqapi.benchmark.QuantumRegisterHotLoopBenchmark
```

Expected: the environment header plus 4 result rows (16/H, 16/CNOT, 20/H, 20/CNOT) with large `bytes/op` values (the current implementation allocates boxed `Complex` per amplitude — expect on the order of megabytes/op at 20 qubits). Save the full output; the next step transcribes it.

- [ ] **Step 4: Record the baseline in the spec**

Append to `docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md` (at the end of the file):

```markdown

## Results

Benchmark: `QuantumRegisterHotLoopBenchmark` (production `applyOperator`,
50 warmup + 200 timed iterations, allocation via
`ThreadMXBean.getThreadAllocatedBytes`). Same machine and JVM for both runs
(see environment header transcribed below).

Environment: <transcribe the os.name / os.arch / java.version / availableProcessors lines here>

### Before migration (Complex-based, commit <baseline commit short-hash>)

| n  | gate          | ns/op | bytes/op |
|----|---------------|-------|----------|
| 16 | 1-qubit (H)   | <fill from output> | <fill from output> |
| 16 | 2-qubit (CNOT)| <fill from output> | <fill from output> |
| 20 | 1-qubit (H)   | <fill from output> | <fill from output> |
| 20 | 2-qubit (CNOT)| <fill from output> | <fill from output> |

### After migration (double[]-based)

(filled in after the migration lands — see plan Task 4)

### Verdict

(filled in after the migration lands — see plan Task 4)
```

Replace every `<fill from output>` with the actual numbers from Step 3 and `<baseline commit short-hash>` with the output of `/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration rev-parse --short HEAD`. The two "(filled in after…)" placeholders are intentional at this stage — Task 4 replaces them.

- [ ] **Step 5: Commit**

```bash
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration add src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterHotLoopBenchmark.java docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration commit -m "perf: production applyOperator benchmark + Complex baseline numbers (#12)"
```

---

### Task 3: Migrate QuantumRegister's internal state to double[]

The single production change of this plan. Every method below is shown in full — replace the existing method bodies exactly. The golden-master test from Task 1 and the whole existing suite are the pass criteria and must not be modified.

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`
- Test (existing, unmodified): `src/test/java/org/aitan/jqapi/test/QuantumRegisterGoldenMasterTest.java`, `src/test/java/org/aitan/jqapi/test/QuantumRegisterTest.java`, `src/test/java/org/aitan/jqapi/test/QuantumAlgorithmTest.java`

**Interfaces:**
- Consumes: `ComplexVector.getData()` → `Complex[]`, `ComplexVector.factorize(FieldVector<Complex>)`, `ComplexMatrix.getEntry(int,int)`/`getRowDimension()`, `Utils.bitAtIndex(int,int,int)`, `Utils.toBinary(int,int)` — all unchanged.
- Produces: identical public API as today (`getRegisterState()` still returns a fresh `ComplexVector`; `applyOperator`, `measure`, `measureQubitAtIndexes`, `getQubitRegisterState`, deprecated `setRegisterState` keep exact signatures and observable behavior). Internal field becomes `private double[] registerState` (interleaved re/im).

- [ ] **Step 1: Change the field and imports**

In `QuantumRegister.java`, replace the field declaration (line 27):

```java
    private double[] registerState;
```

Add `import java.util.Arrays;` to the imports (alphabetically, after `java.security.SecureRandom`). All existing imports stay — `Complex`, `ComplexVector`, `ComplexMatrix` are still used.

- [ ] **Step 2: Add the two private conversion helpers**

Add at the bottom of the class (before the closing brace), after `verifySeparable`:

```java
    /** Flattens a complex vector into the interleaved (re, im) primitive layout. */
    private static double[] toInterleaved(ComplexVector vector) {
        Complex[] data = vector.getData();
        double[] interleaved = new double[data.length * 2];
        for (int i = 0; i < data.length; i++) {
            interleaved[2 * i] = data[i].getReal();
            interleaved[2 * i + 1] = data[i].getImaginary();
        }
        return interleaved;
    }

    /** Builds a fresh complex-vector view of the interleaved primitive state. */
    private ComplexVector toComplexVector() {
        int dimension = this.registerState.length / 2;
        Complex[] data = new Complex[dimension];
        for (int i = 0; i < dimension; i++) {
            data[i] = new Complex(this.registerState[2 * i], this.registerState[2 * i + 1]);
        }
        return new ComplexVector(data);
    }
```

- [ ] **Step 3: Rewrite the boundary methods**

Replace `getRegisterState()`:

```java
    /** @return the full complex amplitude vector of the register state */
    public ComplexVector getRegisterState() {
        return this.toComplexVector();
    }
```

In `getQubitRegisterState()`, replace only the first line of the body:

```java
        ComplexVector[] factorize = ComplexVector.factorize(this.toComplexVector());
```

Replace `setRegisterState(ComplexVector)` (keeps its deprecation and message):

```java
    /** @param registerState the new complex amplitude vector
     *  @deprecated Use {@link #applyOperator(ComplexMatrix, List)} instead to apply quantum gates. */
    @Deprecated
    public void setRegisterState(ComplexVector registerState) {
        if (registerState.getDimension() != this.registerState.length / 2) {
            throw new IllegalArgumentException("ERROR: Overflow register dimension");
        }
        this.registerState = toInterleaved(registerState);
    }
```

In the three `initializeQuantumRegister` overloads, the tensor-product construction logic stays byte-for-byte identical; only the final assignment changes from
`this.registerState = registerStateToUpdate;` to:

```java
        this.registerState = toInterleaved(registerStateToUpdate);
```

(one occurrence in each of the three overloads — no-arg, `Qubit[]`, and `double...`).

- [ ] **Step 4: Rewrite applyOperator in primitives**

Replace the whole `applyOperator` method:

```java
    /**
     * Applies a 2^k x 2^k gate matrix (operator) to the k target qubits of the register state, in place.
     * For every group of 2^k amplitudes that differ only in the target-qubit bits, the group is multiplied
     * by the operator matrix.
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits) {
        int k = targetQubits.size();
        int localDimension = 1 << k;
        if (operator.getRowDimension() != localDimension) {
            throw new IllegalArgumentException("Gate matrix of dimension " + operator.getRowDimension()
                    + " cannot be applied to " + k + " qubit(s)");
        }
        int dimension = this.registerState.length / 2;

        //offsets[t] = bits to set in the base index to select the local state t.
        //Qubit q lives at integer bit position (size - 1 - q) because qubit 0
        //is the most significant; local bit j of the gate maps to targetQubits[j].
        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (this.size - 1 - targetQubits.get(j));
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        //Flatten the operator once per call: the zero-check happens on the boxed
        //entry (same check as before the migration); the per-amplitude loops
        //below then run entirely on primitives, with no Complex allocation.
        double[] opRe = new double[localDimension * localDimension];
        double[] opIm = new double[localDimension * localDimension];
        boolean[] opNonZero = new boolean[localDimension * localDimension];
        for (int r = 0; r < localDimension; r++) {
            for (int c = 0; c < localDimension; c++) {
                Complex entry = operator.getEntry(r, c);
                int flat = r * localDimension + c;
                opNonZero[flat] = !entry.equals(Complex.ZERO);
                opRe[flat] = entry.getReal();
                opIm[flat] = entry.getImaginary();
            }
        }

        double[] localRe = new double[localDimension];
        double[] localIm = new double[localDimension];
        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue; //visit each amplitude group once, starting from the index with all target bits at 0
            }
            for (int t = 0; t < localDimension; t++) {
                int amplitudeIndex = base | offsets[t];
                localRe[t] = this.registerState[2 * amplitudeIndex];
                localIm[t] = this.registerState[2 * amplitudeIndex + 1];
            }
            for (int r = 0; r < localDimension; r++) {
                double sumRe = 0.0;
                double sumIm = 0.0;
                for (int c = 0; c < localDimension; c++) {
                    int flat = r * localDimension + c;
                    if (opNonZero[flat]) {
                        sumRe += opRe[flat] * localRe[c] - opIm[flat] * localIm[c];
                        sumIm += opRe[flat] * localIm[c] + opIm[flat] * localRe[c];
                    }
                }
                int amplitudeIndex = base | offsets[r];
                this.registerState[2 * amplitudeIndex] = sumRe;
                this.registerState[2 * amplitudeIndex + 1] = sumIm;
            }
        }
    }
```

- [ ] **Step 5: Rewrite measure() and the private measurement helpers in primitives**

Replace `measure()`:

```java
    /** Collapses the whole register to a basis state according to the current
     *  measurement probabilities. */
    public void measure() {
        int indexCollapsed = this.calculateCollapsedIndex();
        //Initialize all register state to 0
        Arrays.fill(this.registerState, 0.0);
        //Set indexCollapsed element of register state to 1
        this.registerState[2 * indexCollapsed] = 1.0;
        //The collapsed state is a computational basis state: read each qubit directly from its bit
        for (int i = 0; i < size; i++) {
            result[i] = Utils.bitAtIndex(i, indexCollapsed, size) == 0 ? new QubitZero() : new QubitOne();
        }
    }
```

Replace `calculateCollapsedIndex()`:

```java
    private int calculateCollapsedIndex() {
        double random = RANDOM.nextDouble();
        int lastIndex = this.registerState.length / 2 - 1;
        int j = -1;
        while (random >= 0 && j < lastIndex) {
            j++;
            double re = this.registerState[2 * j];
            double im = this.registerState[2 * j + 1];
            random -= re * re + im * im;
        }
        return j;
    }
```

Replace `calculateCollapsedIndex(int qubitIndex)` (identical branch logic; only the probability read changes):

```java
    private int calculateCollapsedIndex(int qubitIndex) {
        double random = RANDOM.nextDouble();
        double zeroProbability = 0;
        double oneProbability = 0;

        int dimension = this.registerState.length / 2;
        for (int i = 0; i < dimension; i++) {
            String toBinary = Utils.toBinary(i, size);
            int bitAtIndex = Integer.parseInt(toBinary.substring(qubitIndex, qubitIndex + 1));
            double re = this.registerState[2 * i];
            double im = this.registerState[2 * i + 1];
            double probability = re * re + im * im;
            zeroProbability += bitAtIndex == 0 ? probability : 0;
            oneProbability += bitAtIndex == 1 ? probability : 0;
        }
        return zeroProbability >= random ? 0 : 1;
    }
```

Replace `updateRegisterStateAfterQubitCollapsed(int, int)`:

```java
    private void updateRegisterStateAfterQubitCollapsed(int qubitPos, int collapsedValue) {
        //Probability of the branch we collapsed into: sum of |amplitude|^2 over
        //all basis states whose bit at qubitPos equals the measured value
        int dimension = this.registerState.length / 2;
        double branchProbability = 0;
        for (int i = 0; i < dimension; i++) {
            if (Utils.bitAtIndex(qubitPos, i, size) == collapsedValue) {
                double re = this.registerState[2 * i];
                double im = this.registerState[2 * i + 1];
                branchProbability += re * re + im * im;
            }
        }
        if (branchProbability == 0) {
            throw new IllegalStateException("Qubit " + qubitPos + " collapsed to zero-probability branch");
        }
        //Zero out the discarded branch and renormalize the surviving amplitudes,
        //dividing by sqrt(p): preserves relative phases
        double norm = Math.sqrt(branchProbability);
        for (int i = 0; i < dimension; i++) {
            if (Utils.bitAtIndex(qubitPos, i, size) == collapsedValue) {
                this.registerState[2 * i] /= norm;
                this.registerState[2 * i + 1] /= norm;
            } else {
                this.registerState[2 * i] = 0.0;
                this.registerState[2 * i + 1] = 0.0;
            }
        }
    }
```

Replace `verifySeparable(ComplexVector[])` (the marginals stay boxed — they come from the unchanged `ComplexVector.factorize`; only the register-state read goes primitive):

```java
    /**
     * Verifies that the joint probabilities of the register state match the
     * product of the per-qubit marginal probabilities, i.e. the state is
     * (probabilistically) separable.
     */
    private void verifySeparable(ComplexVector[] qubitMarginals) {
        int dimension = this.registerState.length / 2;
        for (int i = 0; i < dimension; i++) {
            double product = 1;
            for (int q = 0; q < size; q++) {
                int bit = Utils.bitAtIndex(q, i, size);
                product *= Math.pow(qubitMarginals[q].getEntry(bit).abs(), 2);
            }
            double re = this.registerState[2 * i];
            double im = this.registerState[2 * i + 1];
            double actual = re * re + im * im;
            if (Math.abs(product - actual) > 1e-9) {
                throw new IllegalStateException("Register state is entangled and cannot be factorized into independent qubits: use measure() or read the full register state instead");
            }
        }
    }
```

- [ ] **Step 6: Compile and run the equivalence proof**

Run: `mvn -q test -Dtest=QuantumRegisterGoldenMasterTest`
Expected: BUILD SUCCESS, 20/20 pass, with ZERO changes to the test file. Any failure here is a migration bug — fix `QuantumRegister.java`, never the test.

Run: `mvn -q test -Dtest='QuantumRegisterTest,QuantumAlgorithmTest'`
Expected: BUILD SUCCESS (3 + 4 tests), unmodified.

- [ ] **Step 7: Run the full suite**

Run: `mvn -q test`
Expected: BUILD SUCCESS. Confirm no test file was touched: `/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration status --short` must show only `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java` modified.

- [ ] **Step 8: Commit**

```bash
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration add src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration commit -m "perf: migrate QuantumRegister internal state to primitive double[] (#12)"
```

---

### Task 4: Post-migration benchmark run + Results verdict

Re-run the exact benchmark from Task 2 on the migrated code and complete the spec's Results section.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md` (fill in the "After migration" table and "Verdict" placeholders left by Task 2)

**Interfaces:**
- Consumes: `QuantumRegisterHotLoopBenchmark.main` (Task 2, unchanged), migrated `QuantumRegister` (Task 3), the `## Results` section skeleton (Task 2).
- Produces: the completed Results section — the document trail closing issue #12's acceptance criteria.

- [ ] **Step 1: Run the benchmark on the migrated code**

```bash
mvn -q test-compile dependency:build-classpath -Dmdep.outputFile=target/classpath.txt
java -cp target/classes:target/test-classes:$(cat target/classpath.txt) org.aitan.jqapi.benchmark.QuantumRegisterHotLoopBenchmark
```

Expected: same 4 rows; `bytes/op` should drop dramatically (the per-amplitude loops no longer allocate — only the small per-call flatten arrays remain), `ns/op` should improve. Confirm the benchmark file itself is untouched since Task 2 (`/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration status --short` shows only the spec file once edited).

- [ ] **Step 2: Complete the spec's Results section**

In `docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md`, replace the `### After migration (double[]-based)` placeholder paragraph with a table in the same format as the Before table (same 4 rows, actual numbers, plus the migrated commit short-hash in the heading), and replace the `### Verdict` placeholder with a short factual write-up (a few sentences, not just numbers) stating, per configuration, the ns/op speedup factor and bytes/op reduction factor, and explicitly confirming or disconfirming issue #12's acceptance criteria: reduced allocation/GC pressure and improved runtime at 16 and 20 qubits on the production `applyOperator`. If any configuration regressed, say so plainly — do not smooth it over.

- [ ] **Step 3: Verify the suite one last time and commit**

Run: `mvn -q test`
Expected: BUILD SUCCESS.

```bash
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration add docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md
/usr/bin/git -C /Users/aitan/workspace/jqapi-worktrees/feature-issue-12-phase2-migration commit -m "docs: record before/after benchmark results for phase 2 migration (#12)"
```
