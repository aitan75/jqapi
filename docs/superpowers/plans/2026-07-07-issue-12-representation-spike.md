# Issue #12 Phase 1 — Complex Representation Benchmark Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a manually-run benchmark that measures wall-clock time and per-op allocation of gate application under two candidate amplitude representations — a raw interleaved `double[]` and EJML's `ZMatrixRMaj` — then record the results and a qualitative decision in the approved design spec.

**Architecture:** Two standalone classes (`RawStateBaseline`, `EjmlStateBenchmark`) implement a shared `AmplitudeState` interface, each mirroring the offset/group indexing of `QuantumRegister.applyOperator` (`src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251`) but with a different underlying storage: primitive `double[]` for the baseline, `ZMatrixRMaj` (via `CommonOps_ZDRM.mult`) for EJML. A driver class (`RepresentationBenchmark`) runs both at 16 and 20 qubits with a 1-qubit and a 2-qubit gate, verifies both compute identical results, then times steady-state repeated gate application and per-thread allocated bytes.

**Tech Stack:** Java 21, Maven, `org.ejml:ejml-zdense:0.44.0` (test scope), `com.sun.management.ThreadMXBean`.

## Global Constraints

- `maven.compiler.release` is 21 (`pom.xml:21`) — no language features beyond Java 21.
- New dependency `org.ejml:ejml-zdense:0.44.0` must be added in **`test` scope only** (per approved spec — it is not a production dependency at this stage).
- New classes live under `src/test/java/org/aitan/jqapi/benchmark/` and must **not** match surefire's default include patterns (`*Test`, `Test*`, `*Tests`, `*TestCase`) — same convention as the existing `MemoryLimitBenchmark` in that package, so `mvn test` never executes them.
- Per the approved spec's "Testing" section, these classes are **not** unit-tested with JUnit. The only correctness guard is the one-time sanity check embedded in `RepresentationBenchmark` (compares baseline vs. EJML output for one gate application), which runs as part of every manual invocation — there is no `@Test` method anywhere in this plan.
- ojAlgo is explicitly out of scope (per approved spec) — no task in this plan references it.
- No changes to any file under `src/main/java` — this is a test-scope-only spike.

---

### Task 1: Add EJML test-scope dependency

**Files:**
- Modify: `pom.xml:36-40` (dependencies block)

**Interfaces:**
- Produces: `org.ejml:ejml-zdense:0.44.0` on the test classpath, providing `org.ejml.data.ZMatrixRMaj` and `org.ejml.dense.row.CommonOps_ZDRM` for Task 2.

- [ ] **Step 1: Add the dependency to `pom.xml`**

In `pom.xml`, the current dependencies block is:

```xml
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-math3</artifactId>
            <version>3.6.1</version>
        </dependency>
    </dependencies>
```

Change it to:

```xml
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-math3</artifactId>
            <version>3.6.1</version>
        </dependency>
        <dependency>
            <groupId>org.ejml</groupId>
            <artifactId>ejml-zdense</artifactId>
            <version>0.44.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

- [ ] **Step 2: Verify the dependency resolves and the existing suite still passes**

Run: `mvn -q test-compile`
Expected: no output, exit code 0 (BUILD SUCCESS) — confirms `ejml-zdense` and its transitive dependencies resolve cleanly and nothing fails the enforcer plugin's `requireUpperBoundDeps`/`banDuplicatePomDependencyVersions` rules.

Run: `mvn -q test`
Expected: no output, exit code 0 — confirms adding the new test-scope dependency doesn't break the existing test suite.

- [ ] **Step 3: Commit**

```bash
git add pom.xml
git commit -m "test: add EJML test-scope dependency for issue #12 phase 1 spike (#12)"
```

---

### Task 2: Benchmark harness (baseline, EJML candidate, driver)

**Files:**
- Create: `src/test/java/org/aitan/jqapi/benchmark/AmplitudeState.java`
- Create: `src/test/java/org/aitan/jqapi/benchmark/RawStateBaseline.java`
- Create: `src/test/java/org/aitan/jqapi/benchmark/EjmlStateBenchmark.java`
- Create: `src/test/java/org/aitan/jqapi/benchmark/RepresentationBenchmark.java`

**Interfaces:**
- Consumes: `org.ejml.data.ZMatrixRMaj`, `org.ejml.dense.row.CommonOps_ZDRM` (Task 1).
- Produces: `AmplitudeState.applyGate(int[] targetQubits, double[] gateFlat)`, `AmplitudeState.snapshot()`; `RawStateBaseline(int size)`; `EjmlStateBenchmark(int size)`; `RepresentationBenchmark.main(String[])` — the runnable entry point for Task 3.

- [ ] **Step 1: Create the shared `AmplitudeState` interface**

Create `src/test/java/org/aitan/jqapi/benchmark/AmplitudeState.java`:

```java
package org.aitan.jqapi.benchmark;

/**
 * Common contract for the two candidate amplitude representations compared by
 * {@link RepresentationBenchmark}. Both implementations mirror the offset/group
 * indexing of {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251), differing
 * only in how the state and the gate are stored and multiplied.
 */
public interface AmplitudeState {

    /**
     * Applies a {@code 2^k x 2^k} gate matrix to the given target qubits, in place.
     *
     * @param targetQubits qubit indexes the gate acts on (qubit 0 is the most
     *                     significant bit of the state index, matching
     *                     QuantumRegister's convention)
     * @param gateFlat the gate matrix as interleaved (real, imaginary) pairs,
     *                 row-major, length {@code 2 * (2^k) * (2^k)}
     */
    void applyGate(int[] targetQubits, double[] gateFlat);

    /**
     * @return a fresh copy of the full state as interleaved (real, imaginary)
     *         doubles, length {@code 2 * 2^size}
     */
    double[] snapshot();
}
```

- [ ] **Step 2: Create `RawStateBaseline`**

Create `src/test/java/org/aitan/jqapi/benchmark/RawStateBaseline.java`:

```java
package org.aitan.jqapi.benchmark;

/**
 * Raw interleaved-{@code double[]} baseline: no boxing, hand-written complex
 * arithmetic. Mirrors the offset/group indexing of
 * {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251) but stores
 * amplitudes as {@code (re, im)} pairs in a flat {@code double[]} instead of
 * commons-math3 {@code Complex}.
 */
public final class RawStateBaseline implements AmplitudeState {

    private final int size;
    private final double[] state;

    public RawStateBaseline(int size) {
        this.size = size;
        int dimension = 1 << size;
        this.state = new double[2 * dimension];
        this.state[0] = 1.0; // |0...0>, amplitude 1 at index 0
    }

    @Override
    public void applyGate(int[] targetQubits, double[] gateFlat) {
        int k = targetQubits.length;
        int localDimension = 1 << k;
        int dimension = 1 << size;

        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (size - 1 - targetQubits[j]);
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        double[] localRe = new double[localDimension];
        double[] localIm = new double[localDimension];

        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue; // visit each amplitude group once, from the all-target-bits-zero index
            }
            for (int t = 0; t < localDimension; t++) {
                int idx = (base | offsets[t]) * 2;
                localRe[t] = state[idx];
                localIm[t] = state[idx + 1];
            }
            for (int r = 0; r < localDimension; r++) {
                double sumRe = 0;
                double sumIm = 0;
                for (int c = 0; c < localDimension; c++) {
                    int gIdx = (r * localDimension + c) * 2;
                    double gateRe = gateFlat[gIdx];
                    double gateIm = gateFlat[gIdx + 1];
                    double localReC = localRe[c];
                    double localImC = localIm[c];
                    sumRe += gateRe * localReC - gateIm * localImC;
                    sumIm += gateRe * localImC + gateIm * localReC;
                }
                int outIdx = (base | offsets[r]) * 2;
                state[outIdx] = sumRe;
                state[outIdx + 1] = sumIm;
            }
        }
    }

    @Override
    public double[] snapshot() {
        return state.clone();
    }
}
```

- [ ] **Step 3: Create `EjmlStateBenchmark`**

Create `src/test/java/org/aitan/jqapi/benchmark/EjmlStateBenchmark.java`:

```java
package org.aitan.jqapi.benchmark;

import org.ejml.data.ZMatrixRMaj;
import org.ejml.dense.row.CommonOps_ZDRM;

/**
 * EJML-backed candidate: the full state is a {@code ZMatrixRMaj} column vector
 * ({@code dimension x 1}), and each group's local multiply is delegated to
 * {@code CommonOps_ZDRM.mult}. Gather/scatter between the full state and the
 * per-group local vector accesses {@code ZMatrixRMaj.data} directly (EJML's
 * row-major dense matrices expose this field for exactly this kind of
 * performance-sensitive code). Mirrors the same offset/group indexing as
 * {@code QuantumRegister.applyOperator}
 * (src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:208-251).
 */
public final class EjmlStateBenchmark implements AmplitudeState {

    private final int size;
    private final ZMatrixRMaj state;

    public EjmlStateBenchmark(int size) {
        this.size = size;
        int dimension = 1 << size;
        this.state = new ZMatrixRMaj(dimension, 1);
        this.state.data[0] = 1.0; // |0...0>, amplitude 1 at index 0
    }

    @Override
    public void applyGate(int[] targetQubits, double[] gateFlat) {
        int k = targetQubits.length;
        int localDimension = 1 << k;
        int dimension = 1 << size;

        int[] offsets = new int[localDimension];
        for (int t = 0; t < localDimension; t++) {
            int offset = 0;
            for (int j = 0; j < k; j++) {
                if (((t >> (k - 1 - j)) & 1) != 0) {
                    offset |= 1 << (this.size - 1 - targetQubits[j]);
                }
            }
            offsets[t] = offset;
        }
        int targetMask = offsets[localDimension - 1];

        ZMatrixRMaj gate = new ZMatrixRMaj(localDimension, localDimension);
        System.arraycopy(gateFlat, 0, gate.data, 0, gateFlat.length);

        ZMatrixRMaj localVec = new ZMatrixRMaj(localDimension, 1);
        ZMatrixRMaj resultVec = new ZMatrixRMaj(localDimension, 1);

        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) != 0) {
                continue;
            }
            for (int t = 0; t < localDimension; t++) {
                int srcIdx = (base | offsets[t]) * 2;
                localVec.data[t * 2] = state.data[srcIdx];
                localVec.data[t * 2 + 1] = state.data[srcIdx + 1];
            }
            CommonOps_ZDRM.mult(gate, localVec, resultVec);
            for (int r = 0; r < localDimension; r++) {
                int dstIdx = (base | offsets[r]) * 2;
                state.data[dstIdx] = resultVec.data[r * 2];
                state.data[dstIdx + 1] = resultVec.data[r * 2 + 1];
            }
        }
    }

    @Override
    public double[] snapshot() {
        return state.data.clone();
    }
}
```

- [ ] **Step 4: Create the `RepresentationBenchmark` driver**

Create `src/test/java/org/aitan/jqapi/benchmark/RepresentationBenchmark.java`:

```java
package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;

/**
 * Standalone benchmark comparing the raw {@code double[]} baseline against the
 * EJML {@code ZMatrixRMaj} candidate for issue #12's amplitude representation
 * decision. Like {@link MemoryLimitBenchmark}, this is intentionally NOT a
 * JUnit test: no {@code @Test} method, and its name doesn't match surefire's
 * include patterns ({@code *Test}, {@code Test*}, {@code *Tests},
 * {@code *TestCase}), so {@code mvn test} never runs it. Run it manually via
 * its {@code main} method.
 * <p>
 * For each of {16, 20} qubits x {1-qubit gate, 2-qubit gate}, this first
 * verifies both representations compute identical results for one gate
 * application (float tolerance), then measures steady-state wall-clock time
 * and per-thread allocated bytes for repeated gate application on an
 * already-allocated state.
 */
public final class RepresentationBenchmark {

    private static final int[] QUBIT_COUNTS = {16, 20};
    private static final int WARMUP_ITERATIONS = 50;
    private static final int TIMED_ITERATIONS = 200;
    private static final double TOLERANCE = 1e-9;

    // 2x2, interleaved (re, im) row-major; mirrors Constants.HADAMARD_MATRIX
    // (src/main/java/org/aitan/jqapi/utils/Constants.java:90-92)
    private static final double HALF = 1.0 / Math.sqrt(2.0);
    private static final double[] HADAMARD_GATE_FLAT = {
        HALF, 0.0, HALF, 0.0,
        HALF, 0.0, -HALF, 0.0
    };

    // 4x4, interleaved (re, im) row-major; mirrors Constants.CONTROLLED_NOT_MATRIX
    // (src/main/java/org/aitan/jqapi/utils/Constants.java:40-45)
    private static final double[] CNOT_GATE_FLAT = {
        1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 1, 0, 0, 0
    };

    private RepresentationBenchmark() {
    }

    public static void main(String[] args) {
        printEnvironment();
        System.out.printf("%-6s %-14s %-20s %-14s %-14s %-12s%n",
                "n", "gate", "impl", "ns/op", "bytes/op", "correctness");

        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", new int[]{0}, HADAMARD_GATE_FLAT);
            runCase(n, "2-qubit(CNOT)", new int[]{0, n - 1}, CNOT_GATE_FLAT);
        }
    }

    private static void runCase(int n, String gateLabel, int[] targets, double[] gateFlat) {
        boolean correct = checkCorrectness(n, targets, gateFlat);

        Result baseline = measure(new RawStateBaseline(n), targets, gateFlat);
        Result ejml = measure(new EjmlStateBenchmark(n), targets, gateFlat);

        printRow(n, gateLabel, "double[] baseline", baseline, correct);
        printRow(n, gateLabel, "EJML ZMatrixRMaj", ejml, correct);
    }

    private static void printRow(int n, String gateLabel, String impl, Result result, boolean correct) {
        System.out.printf("%-6d %-14s %-20s %-14.1f %-14.1f %-12s%n",
                n, gateLabel, impl, result.nsPerOp, result.bytesPerOp, correct ? "OK" : "MISMATCH");
    }

    private static boolean checkCorrectness(int n, int[] targets, double[] gateFlat) {
        RawStateBaseline baseline = new RawStateBaseline(n);
        EjmlStateBenchmark ejml = new EjmlStateBenchmark(n);
        baseline.applyGate(targets, gateFlat);
        ejml.applyGate(targets, gateFlat);
        double[] a = baseline.snapshot();
        double[] b = ejml.snapshot();
        for (int i = 0; i < a.length; i++) {
            if (Math.abs(a[i] - b[i]) > TOLERANCE) {
                return false;
            }
        }
        return true;
    }

    private static Result measure(AmplitudeState impl, int[] targets, double[] gateFlat) {
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            impl.applyGate(targets, gateFlat);
        }

        ThreadMXBean threadBean = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        if (threadBean.isThreadAllocatedMemorySupported() && !threadBean.isThreadAllocatedMemoryEnabled()) {
            threadBean.setThreadAllocatedMemoryEnabled(true);
        }
        long threadId = Thread.currentThread().threadId();

        long allocBefore = threadBean.getThreadAllocatedBytes(threadId);
        long start = System.nanoTime();
        for (int i = 0; i < TIMED_ITERATIONS; i++) {
            impl.applyGate(targets, gateFlat);
        }
        long elapsedNs = System.nanoTime() - start;
        long allocAfter = threadBean.getThreadAllocatedBytes(threadId);

        double nsPerOp = elapsedNs / (double) TIMED_ITERATIONS;
        double bytesPerOp = (allocAfter - allocBefore) / (double) TIMED_ITERATIONS;
        return new Result(nsPerOp, bytesPerOp);
    }

    private static void printEnvironment() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("========================================================");
        System.out.println(" JQAPI Representation Benchmark (Issue #12 Phase 1 spike)");
        System.out.println("========================================================");
        System.out.println("os.name              : " + System.getProperty("os.name"));
        System.out.println("os.arch              : " + System.getProperty("os.arch"));
        System.out.println("java.version         : " + System.getProperty("java.version"));
        System.out.println("availableProcessors  : " + rt.availableProcessors());
        System.out.println();
    }

    private static final class Result {
        final double nsPerOp;
        final double bytesPerOp;

        Result(double nsPerOp, double bytesPerOp) {
            this.nsPerOp = nsPerOp;
            this.bytesPerOp = bytesPerOp;
        }
    }
}
```

- [ ] **Step 5: Compile**

Run: `mvn -q test-compile`
Expected: no output, exit code 0 (BUILD SUCCESS) — all four new classes compile against the `ejml-zdense` dependency from Task 1.

- [ ] **Step 6: Run the benchmark and verify correctness**

Run: `mvn -q exec:java -Dexec.classpathScope=test -Dexec.mainClass=org.aitan.jqapi.benchmark.RepresentationBenchmark`
Expected: a results table with 8 rows (2 qubit counts x 2 gates x 2 implementations). Every row's `correctness` column must read `OK` — if any row reads `MISMATCH`, stop and fix `RawStateBaseline`/`EjmlStateBenchmark`'s indexing before proceeding (the two representations disagreeing means at least one has an indexing bug, and timing numbers from a broken implementation are meaningless). The `ns/op`/`bytes/op` values themselves will vary by machine — that variation is expected and not a failure condition.

- [ ] **Step 7: Confirm `mvn test` still excludes the new classes**

Run: `mvn -q test`
Expected: no output, exit code 0 — the existing suite passes unchanged, confirming `AmplitudeState`, `RawStateBaseline`, `EjmlStateBenchmark`, and `RepresentationBenchmark` are correctly excluded from surefire (none of their names match `*Test`/`Test*`/`*Tests`/`*TestCase`).

- [ ] **Step 8: Commit**

```bash
git add src/test/java/org/aitan/jqapi/benchmark/AmplitudeState.java \
        src/test/java/org/aitan/jqapi/benchmark/RawStateBaseline.java \
        src/test/java/org/aitan/jqapi/benchmark/EjmlStateBenchmark.java \
        src/test/java/org/aitan/jqapi/benchmark/RepresentationBenchmark.java
git commit -m "test: add double[]/EJML representation benchmark harness for issue #12 (#12)"
```

---

### Task 3: Record results and decision in the spec

**Files:**
- Modify: `docs/superpowers/specs/2026-07-07-complex-representation-spike-design.md` (the "Decision documentation" section)

**Interfaces:**
- Consumes: the stdout table produced by `RepresentationBenchmark.main` (Task 2, Step 6).

- [ ] **Step 1: Re-run the benchmark and capture its full output**

Run: `mvn -q exec:java -Dexec.classpathScope=test -Dexec.mainClass=org.aitan.jqapi.benchmark.RepresentationBenchmark`
Expected: the same 8-row table as Task 2 Step 6, all rows `OK`. Copy the full stdout output (environment block + table) verbatim for the next step.

- [ ] **Step 2: Update the spec's "Decision documentation" section**

Open `docs/superpowers/specs/2026-07-07-complex-representation-spike-design.md` and replace the "Decision documentation" section (currently a description of what will go there) with the actual results table (as a Markdown table transcribed from the captured stdout) and a short qualitative write-up — a few sentences — of which representation is adopted for Phase 2 and why, based on inspecting the `ns/op` and `bytes/op` columns across both qubit counts and both gate arities. Judge on the numbers themselves (e.g. "EJML is consistently N% faster and allocates M% less at both 16 and 20 qubits, adopt EJML for Phase 2" or "the two are within noise of each other; adopt the double[] baseline for Phase 2 since it has no new external dependency and equal performance") — there is no pre-committed numeric threshold for this decision (per the approved spec).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-07-complex-representation-spike-design.md
git commit -m "docs: record issue #12 phase 1 spike results and representation decision (#12)"
```
