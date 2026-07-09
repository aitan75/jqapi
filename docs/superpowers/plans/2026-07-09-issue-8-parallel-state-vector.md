# Parallel State-Vector Updates (Issue #8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parallelize the per-gate amplitude-group loop in `QuantumRegister.applyOperator` across CPU cores, keeping results bit-for-bit identical to the sequential path.

**Architecture:** The independent amplitude groups (one per leader index where all target bits are 0) are spread over the common `ForkJoinPool` via `IntStream.range(...).parallel().forEach`. The per-group work is extracted into a private method that allocates its own scratch buffers (thread-local by construction); the shared operator arrays are read-only and register writes are at disjoint indices. A size threshold keeps small registers on the sequential path; an explicit `parallel` overload allows opt-out and direct equivalence testing.

**Tech Stack:** Java 21 (`java.util.stream` / common `ForkJoinPool` — standard library, no new deps), native `Complex`/`ComplexMatrix`, JUnit 5.

## Global Constraints

- Pure Java 21; no new runtime dependencies (`java.util.concurrent`/streams are stdlib).
- Parallelism lives **strictly inside a single `applyOperator` call**; `LocalSimulator.execute` gate/level ordering is unchanged.
- Results must be **bit-for-bit identical** to the sequential path regardless of thread count (groups are independent; no cross-group reduction).
- Existing suite incl. `QuantumRegisterGoldenMasterTest` (24 tests, small registers → sequential path) stays green and unchanged.
- Degree of parallelism is configurable via `-Djava.util.concurrent.ForkJoinPool.common.parallelism=N`; per-call opt-out via the `parallel` overload.
- Threshold: `PARALLEL_MIN_DIMENSION = 1 << 16` (state dimension, i.e. 16 qubits).
- No `Co-Authored-By` trailer in commits.

**Reference:** issue #8 (parallelize state-vector updates). The hot loop moved to `QuantumRegister.applyOperator` (line ~210) after the phase-2 migration; the issue's `LocalSimulator.applyGate` line numbers are historical.

**Test/build commands:**
- Single class: `mvn -B -Dtest=QuantumRegisterParallelTest test`
- Full suite: `mvn -B test`

---

### Task 1: Parallelize `applyOperator`

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`
- Create: `src/test/java/org/aitan/jqapi/test/QuantumRegisterParallelTest.java`

**Interfaces:**
- Produces: `public void applyOperator(ComplexMatrix, List<Integer>)` (auto: parallel when `dimension >= PARALLEL_MIN_DIMENSION`) and `public void applyOperator(ComplexMatrix, List<Integer>, boolean parallel)` (explicit). Both yield identical results; private `applyOperatorGroup(int, int, int[], double[], double[], boolean[])` does the per-group work.

- [ ] **Step 1: Write the failing tests (creates the test class)**

Create `src/test/java/org/aitan/jqapi/test/QuantumRegisterParallelTest.java`:

```java
package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumRegisterParallelTest {

    private static final double TOL = 1e-9;

    // A dense state: Hadamard on every qubit (built via the sequential path).
    private static QuantumRegister uniformSuperposition(int n) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int q = 0; q < n; q++) {
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(q), false);
        }
        return reg;
    }

    private static void assertRegistersEqual(QuantumRegister a, QuantumRegister b, int n) {
        ComplexVector va = a.getRegisterState();
        ComplexVector vb = b.getRegisterState();
        int dim = 1 << n;
        for (int i = 0; i < dim; i++) {
            assertEquals(va.getEntry(i), vb.getEntry(i), "amplitude " + i);
        }
    }

    @Test
    void parallel_matchesSequential_hadamard() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), false);
        par.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_cnotNonAdjacent() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), false);
        par.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_rotationZ() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), false);
        par.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void autoPath_largeRegister_hadamardIsCorrect() {
        int n = 16; // dimension 65536 >= PARALLEL_MIN_DIMENSION -> auto parallel
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)); // auto path
        double inv = 1.0 / Math.sqrt(2.0);
        // Qubit 0 is the MSB: its |1> branch is index (1 << (n-1)).
        assertEquals(inv, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(0).getImaginary(), TOL);
        assertEquals(inv, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(12345).getReal(), TOL);
    }

    @Test
    void autoPath_hadamardTwice_isIdentity() {
        int n = 16;
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        assertEquals(1.0, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn -B -Dtest=QuantumRegisterParallelTest test`
Expected: compilation failure — no `applyOperator(ComplexMatrix, List, boolean)` overload.

- [ ] **Step 3: Add the `IntStream` import and the threshold constant**

In `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`:

Add to the import block (after `import java.util.Objects;`):
```java
import java.util.stream.IntStream;
```

Add the threshold constant next to the existing `RANDOM` field (immediately after the `private static final SecureRandom RANDOM = new SecureRandom();` line):
```java
    /** State-vector dimension at/above which applyOperator parallelizes the amplitude-group loop. */
    private static final int PARALLEL_MIN_DIMENSION = 1 << 16;
```

- [ ] **Step 4: Replace the `applyOperator` method with the two overloads + the per-group helper**

Replace the **entire existing `applyOperator(ComplexMatrix operator, List<Integer> targetQubits)` method** (its Javadoc through its closing brace) with the following. The setup (offsets, flattened operator) is unchanged; only the loop is split into a dispatch plus the extracted `applyOperatorGroup`:

```java
    /**
     * Applies a 2^k x 2^k gate matrix (operator) to the k target qubits of the register state, in place.
     * For every group of 2^k amplitudes that differ only in the target-qubit bits, the group is multiplied
     * by the operator matrix. Parallelizes the (independent) groups across cores when the state is large.
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits) {
        boolean parallel = (this.registerState.length / 2) >= PARALLEL_MIN_DIMENSION;
        applyOperator(operator, targetQubits, parallel);
    }

    /**
     * As {@link #applyOperator(ComplexMatrix, List)} but with explicit control over
     * multi-threading. Results are bit-for-bit identical regardless of {@code parallel}:
     * the amplitude groups are independent and there is no cross-group reduction.
     *
     * @param operator the 2^k x 2^k matrix operator to apply
     * @param targetQubits the list of target qubits
     * @param parallel whether to spread the independent amplitude groups across cores
     */
    public void applyOperator(ComplexMatrix operator, List<Integer> targetQubits, boolean parallel) {
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

        if (parallel) {
            final int fLocalDimension = localDimension;
            final int fTargetMask = targetMask;
            final int[] fOffsets = offsets;
            final double[] fOpRe = opRe;
            final double[] fOpIm = opIm;
            final boolean[] fOpNonZero = opNonZero;
            IntStream.range(0, dimension).parallel().forEach(base -> {
                if ((base & fTargetMask) == 0) {
                    applyOperatorGroup(base, fLocalDimension, fOffsets, fOpRe, fOpIm, fOpNonZero);
                }
            });
        } else {
            for (int base = 0; base < dimension; base++) {
                if ((base & targetMask) == 0) {
                    applyOperatorGroup(base, localDimension, offsets, opRe, opIm, opNonZero);
                }
            }
        }
    }

    /**
     * Applies the operator to the single amplitude group whose leader index is
     * {@code base} (all target bits zero). Allocates its own scratch buffers, so
     * it is safe to call concurrently for disjoint {@code base} values.
     */
    private void applyOperatorGroup(int base, int localDimension, int[] offsets,
            double[] opRe, double[] opIm, boolean[] opNonZero) {
        double[] localRe = new double[localDimension];
        double[] localIm = new double[localDimension];
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `mvn -B -Dtest=QuantumRegisterParallelTest test`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java src/test/java/org/aitan/jqapi/test/QuantumRegisterParallelTest.java
git commit -m "feat(quantum): parallelize applyOperator amplitude-group loop (#8)"
```

---

### Task 2: Sequential-vs-parallel benchmark

**Files:**
- Create: `src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterParallelBenchmark.java`

**Interfaces:**
- Consumes: `QuantumRegister.applyOperator(ComplexMatrix, List<Integer>, boolean)` (Task 1).

- [ ] **Step 1: Create the benchmark (not a JUnit test)**

Create `src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterParallelBenchmark.java`. Its name does not match surefire's patterns (`*Test`, `Test*`, `*Tests`, `*TestCase`), so `mvn test` never runs it; run it manually via its `main`:

```java
package org.aitan.jqapi.benchmark;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;

/**
 * Standalone benchmark comparing sequential vs parallel {@code applyOperator}
 * wall-clock for issue #8. NOT a JUnit test (no {@code @Test}, name doesn't match
 * surefire patterns). Run via its {@code main} method. Degree of parallelism is
 * controlled by {@code -Djava.util.concurrent.ForkJoinPool.common.parallelism=N}.
 */
public final class QuantumRegisterParallelBenchmark {

    private static final int[] QUBIT_COUNTS = {20, 22};
    private static final int WARMUP = 20;
    private static final int TIMED = 100;

    private QuantumRegisterParallelBenchmark() {
    }

    public static void main(String[] args) {
        System.out.println("os.arch             : " + System.getProperty("os.arch"));
        System.out.println("java.version        : " + System.getProperty("java.version"));
        System.out.println("availableProcessors : " + Runtime.getRuntime().availableProcessors());
        System.out.println("commonPool.parallelism : "
                + java.util.concurrent.ForkJoinPool.commonPool().getParallelism());
        System.out.printf("%-6s %-14s %-14s %-14s %-10s%n", "n", "gate", "seq ns/op", "par ns/op", "speedup");
        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", Constants.HADAMARD_MATRIX, Collections.singletonList(0));
            runCase(n, "2-qubit(CNOT)", Constants.CONTROLLED_NOT_MATRIX, Arrays.asList(0, n - 1));
        }
    }

    private static void runCase(int n, String label, ComplexMatrix gate, List<Integer> targets) {
        double seq = time(n, gate, targets, false);
        double par = time(n, gate, targets, true);
        System.out.printf("%-6d %-14s %-14.1f %-14.1f %-10.2f%n", n, label, seq, par, seq / par);
    }

    private static double time(int n, ComplexMatrix gate, List<Integer> targets, boolean parallel) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int i = 0; i < WARMUP; i++) {
            reg.applyOperator(gate, targets, parallel);
        }
        long start = System.nanoTime();
        for (int i = 0; i < TIMED; i++) {
            reg.applyOperator(gate, targets, parallel);
        }
        return (System.nanoTime() - start) / (double) TIMED;
    }
}
```

- [ ] **Step 2: Confirm it compiles and is excluded from the test run**

Run: `mvn -B -Dtest=QuantumRegisterParallelTest test`
Expected: PASS, and the benchmark is compiled (test-compile) but not executed (no `@Test`).

- [ ] **Step 3: (Optional) run the benchmark and note numbers**

Run: `mvn -B -q test-compile && java -cp target/test-classes:target/classes org.aitan.jqapi.benchmark.QuantumRegisterParallelBenchmark`
Expected: a table printing `seq ns/op`, `par ns/op`, `speedup` (speedup > 1 on a multi-core machine at 20+ qubits). Record the output for the PR body.

- [ ] **Step 4: Commit**

```bash
git add src/test/java/org/aitan/jqapi/benchmark/QuantumRegisterParallelBenchmark.java
git commit -m "test(benchmark): sequential vs parallel applyOperator benchmark (#8)"
```

---

### Task 3: Document parallel behavior

**Files:**
- Modify: `docs/api/simulator.md`

**Interfaces:**
- Consumes: the `applyOperator` overload + threshold from Task 1.

- [ ] **Step 1: Add a "Parallelism" subsection to `docs/api/simulator.md`**

Append this section to `docs/api/simulator.md` (at the end of the file, after the existing content):

```markdown
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
```

- [ ] **Step 2: Verify the doc mentions the key knobs**

Run:
```bash
grep -q 'Parallelism' docs/api/simulator.md && grep -q 'ForkJoinPool.common.parallelism' docs/api/simulator.md && echo OK
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add docs/api/simulator.md
git commit -m "docs: document parallel applyOperator behavior and knobs (#8)"
```

---

### Task 4: Full-suite verification, push, PR

**Files:** none (verification + git/remote).

**Interfaces:**
- Consumes: all commits from Tasks 1–3.

- [ ] **Step 1: Run the full test suite (golden-master must stay bit-for-bit green)**

Run: `mvn -B test`
Expected: `BUILD SUCCESS`, 0 failures, including `QuantumRegisterGoldenMasterTest` (24) and `QuantumRegisterParallelTest` (5).

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feature/issue-8-parallel-state-vector
```

- [ ] **Step 3: Open the PR via REST API (token from osxkeychain; no gh CLI)**

Open a PR against `main`, title referencing issue #8, body summarizing the parallelized `applyOperator` + threshold + opt-out overload + tests (and benchmark numbers if captured). Include a `Closes #8` line. Confirm PR number/URL.

- [ ] **Step 4: Report CI status**

After `Build` and `CodeQL` run, confirm both green. Report. Do **not** merge — the maintainer reviews and merges.

---

## Self-Review

- **Issue coverage:** parallelize the amplitude loop → Task 1 Step 4 (`IntStream...parallel().forEach`); thread-local scratch → `applyOperatorGroup` allocates its own `localRe/localIm`; shared read-only op arrays + disjoint writes → same method; bit-for-bit identical → `parallel_matchesSequential_*` tests; ordering stays sequential → `LocalSimulator.execute` untouched (Task 4 full suite confirms); size threshold → `PARALLEL_MIN_DIMENSION`; configurable degree/opt-out → ForkJoinPool property + `parallel` overload (docs Task 3); benchmark → Task 2; existing tests + golden-master green + docs → Task 4 Step 1 + Task 3. All acceptance criteria mapped.
- **Placeholder scan:** none — every code step has complete code; the optional benchmark-run step is explicitly optional.
- **Type/name consistency:** `applyOperator(ComplexMatrix, List<Integer>)`, `applyOperator(ComplexMatrix, List<Integer>, boolean)`, `applyOperatorGroup(int, int, int[], double[], double[], boolean[])`, `PARALLEL_MIN_DIMENSION`, and test helpers `uniformSuperposition`/`assertRegistersEqual` are used identically across tasks. `ComplexVector.getEntry(int)` returns `Complex`; `Complex.equals` is exact, valid for the seq-vs-par comparison because both paths run identical arithmetic per group.
