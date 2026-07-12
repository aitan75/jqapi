# TeaVM WASM/JS bridge (`jqapi-wasm`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `jqapi-wasm` module that compiles `jqapi-core` to browser-runnable JavaScript via TeaVM and exposes `run(specJson) → resultsJson`, so the Phase 2c editor can run circuits client-side; proven by a cross-check that a Bell circuit run in the compiled JS matches the JVM `LocalSimulator`.

**Architecture:** TeaVM does whole-program dead-code elimination over the *reachable* call graph. `jqapi-core`'s parallel state-vector path uses `java.util.concurrent.ForkJoinPool` + `IntStream.parallel()`, which TeaVM cannot translate. Runtime config-gating is NOT enough — the code must be structurally unreachable from the WASM entry point. So Task 1 refactors the parallel path behind an injected `OperatorExecutor` strategy whose parallel implementation is instantiated *only* inside `JQAPIConfig.getDefault()` (a method the WASM path never calls), and gives the JSON/mapper config-injecting entry points so the bridge never touches `getDefault()`. Tasks 2-3 add the module, the JS-facing bridge, and the JVM⇔JS cross-check.

**Tech Stack:** TeaVM 0.12.0 (JavaScript backend), JDK 21 to *run* TeaVM, Java 21 source, JUnit 5, Node.js to execute the compiled JS in the cross-check test.

## Global Constraints

_(Every finding below is verified by the Phase 2b spike, not assumed.)_

- **TeaVM 0.12.0 must run under JDK 21.** JDK 22/25 break it (unsupported class-file major version; `LambdaMetafactory`/`StringConcatFactory` bootstrap resolution fails). The core targets release 21 regardless. Pin the toolchain (Maven Toolchains, or documented `JAVA_HOME=/opt/homebrew/opt/openjdk@21/...` for the `jqapi-wasm` build only). System default JDK stays 25.
- **Compile core + wasm with `-XDstringConcat=inline`.** TeaVM cannot translate `invokedynamic` `StringConcatFactory`. Non-behavioural (classic `StringBuilder` concat).
- **`jqapi-wasm` depends on `org.teavm:teavm-classlib:0.12.0` (`provided`).** Supplies the bootstrap-method shims TeaVM substitutes.
- **No `ForkJoinPool` / `IntStream.parallel()` in the WASM-reachable graph.** The two remaining TeaVM errors after the above are exactly these; Task 1 removes them from reachability.
- Pure Java 21; **no new runtime dependency in `jqapi-core`**; JVM behaviour and public results bit-for-bit unchanged; full `mvn -B test` stays green incl. `QuantumRegisterGoldenMasterTest`. No `Co-Authored-By` trailer.
- `jqapi-core` version is `1.0.1`; `jqapi-wasm` matches it and depends on `org.aitan:jqapi:1.0.1`.

---

### Task 1: Isolate the parallel state-vector path behind `OperatorExecutor` (in `jqapi-core`)

**Files:**
- Create: `src/main/java/org/aitan/jqapi/quantum/OperatorExecutor.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/SequentialOperatorExecutor.java`
- Create: `src/main/java/org/aitan/jqapi/quantum/ParallelOperatorExecutor.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java:219-283` (remove `ForkJoinPool`/`IntStream` refs; delegate parallel branch to the executor)
- Modify: `src/main/java/org/aitan/jqapi/JQAPIConfig.java` (lazy `getDefault()`; `operatorExecutor()`; construct `ParallelOperatorExecutor` only inside `getDefault()`, never in `<clinit>`)
- Modify: `src/main/java/org/aitan/jqapi/visualization/CircuitSpecs.java` (add `toCircuit(CircuitSpec, JQAPIConfig)`)
- Modify: `src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java` (add `fromJson(String, JQAPIConfig)`)
- Modify: `src/main/java/org/aitan/jqapi/pom.xml` (root) → add `-XDstringConcat=inline` compiler arg (already applied in the spike)
- Test: `src/test/java/org/aitan/jqapi/test/OperatorExecutorTest.java`

**Interfaces:**
- Produces:
  - `interface OperatorExecutor { void applyGroups(int dimension, int targetMask, java.util.function.IntConsumer groupApplier); }`
  - `JQAPIConfig.operatorExecutor() → OperatorExecutor`
  - `JQAPIConfig.sequential(int maxQubits) → JQAPIConfig` (parallel disabled, sequential executor; instantiates only `SequentialOperatorExecutor`)
  - `CircuitSpecs.toCircuit(CircuitSpec, JQAPIConfig) → Circuit`
  - `CircuitSpecJson.fromJson(String, JQAPIConfig) → CircuitSpec` (validates against the given config's `maxQubits`; the existing `fromJson(String)` delegates with `JQAPIConfig.getDefault()`)
- Consumes (Task 2): `JQAPIConfig.sequential`, `fromJson(String, JQAPIConfig)`, `toCircuit(CircuitSpec, JQAPIConfig)`.

**Reachability contract (the whole point):** `new ParallelOperatorExecutor(...)` must appear **only** inside `JQAPIConfig.getDefault()` (a method), never in any `<clinit>` or in `QuantumRegister`. `QuantumRegister` and `JQAPIConfig.<clinit>` must not name `ForkJoinPool`, `IntStream.parallel`, or `ParallelOperatorExecutor`. Verified empirically by the Task 2 build (TeaVM must stop reporting `ForkJoinPool`/`IntStream.parallel`).

- [ ] **Step 1: Write the failing test** — behaviour parity of the two executors.

```java
package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.List;
import java.util.function.IntConsumer;
import org.aitan.jqapi.quantum.OperatorExecutor;
import org.aitan.jqapi.quantum.ParallelOperatorExecutor;
import org.aitan.jqapi.quantum.SequentialOperatorExecutor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class OperatorExecutorTest {

    private static List<Integer> collectLeaders(OperatorExecutor exec, int dimension, int targetMask) {
        List<Integer> seen = new ArrayList<>();
        IntConsumer apply = base -> {
            synchronized (seen) {
                seen.add(base);
            }
        };
        exec.applyGroups(dimension, targetMask, apply);
        seen.sort(Integer::compareTo);
        return seen;
    }

    @Test
    void sequentialAndParallel_visitTheSameLeaderIndexes() {
        int dimension = 1 << 8;
        int targetMask = 0b10; // group leaders are indexes with that bit clear
        List<Integer> seq = collectLeaders(new SequentialOperatorExecutor(), dimension, targetMask);
        List<Integer> par = collectLeaders(new ParallelOperatorExecutor(null), dimension, targetMask);
        assertEquals(seq, par);
        for (int base : seq) {
            assertEquals(0, base & targetMask, "leader must have target bits clear");
        }
    }
}
```

- [ ] **Step 2: Run it, verify it fails** — `mvn -B test -Dtest=OperatorExecutorTest` → compile failure (types don't exist).

- [ ] **Step 3: Create the executor types.**

`OperatorExecutor.java`:
```java
package org.aitan.jqapi.quantum;

import java.util.function.IntConsumer;

/**
 * Strategy for iterating the independent amplitude-group leaders of an
 * {@code applyOperator} call. Extracting this keeps {@code ForkJoinPool} and
 * {@code IntStream.parallel()} out of {@link QuantumRegister} so the TeaVM
 * (WASM/JS, issue #5 phase 2b) build can dead-code-eliminate the parallel path.
 *
 * @author Gaetano Ferrara
 */
@FunctionalInterface
public interface OperatorExecutor {

    /**
     * Invokes {@code groupApplier} once per group leader — every {@code base}
     * in {@code [0, dimension)} whose target bits (per {@code targetMask}) are
     * all zero. Groups are independent; order is unspecified.
     *
     * @param dimension the state-vector half-length (number of base indexes)
     * @param targetMask bit mask of the gate's target positions
     * @param groupApplier applied to each group leader index
     */
    void applyGroups(int dimension, int targetMask, IntConsumer groupApplier);
}
```

`SequentialOperatorExecutor.java`:
```java
package org.aitan.jqapi.quantum;

import java.util.function.IntConsumer;

/** Single-threaded {@link OperatorExecutor}. TeaVM-safe (no concurrency). */
public final class SequentialOperatorExecutor implements OperatorExecutor {

    @Override
    public void applyGroups(int dimension, int targetMask, IntConsumer groupApplier) {
        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) == 0) {
                groupApplier.accept(base);
            }
        }
    }
}
```

`ParallelOperatorExecutor.java` (the ONLY class naming `ForkJoinPool`/`IntStream.parallel`):
```java
package org.aitan.jqapi.quantum;

import java.util.concurrent.ForkJoinPool;
import java.util.function.IntConsumer;
import java.util.stream.IntStream;

/**
 * Multi-threaded {@link OperatorExecutor}. Instantiated only on the JVM path
 * (via {@link org.aitan.jqapi.JQAPIConfig#getDefault()}); never reachable from
 * the WASM entry point, so TeaVM drops it and its {@code ForkJoinPool} /
 * {@code IntStream.parallel()} references.
 *
 * @author Gaetano Ferrara
 */
public final class ParallelOperatorExecutor implements OperatorExecutor {

    private final ForkJoinPool pool;

    /** @param pool the pool to run in, or {@code null} for the common pool */
    public ParallelOperatorExecutor(ForkJoinPool pool) {
        this.pool = pool;
    }

    @Override
    public void applyGroups(int dimension, int targetMask, IntConsumer groupApplier) {
        Runnable task = () -> IntStream.range(0, dimension).parallel().forEach(base -> {
            if ((base & targetMask) == 0) {
                groupApplier.accept(base);
            }
        });
        if (pool != null) {
            pool.submit(task).join();
        } else {
            task.run();
        }
    }
}
```

- [ ] **Step 4: Run the test, verify it passes** — `mvn -B test -Dtest=OperatorExecutorTest` → PASS.

- [ ] **Step 5: Rewire `QuantumRegister.applyOperator`** — replace the `if (parallel) { … ForkJoinPool … } else { for … }` block (lines ~259-283) with delegation, and remove the now-unused `import java.util.concurrent.ForkJoinPool;` and `import java.util.stream.IntStream;`:

```java
        if (parallel) {
            final int fLocalDimension = localDimension;
            final int[] fOffsets = offsets;
            final double[] fOpRe = opRe;
            final double[] fOpIm = opIm;
            final boolean[] fOpNonZero = opNonZero;
            config.operatorExecutor().applyGroups(dimension, targetMask, base ->
                    applyOperatorGroup(base, fLocalDimension, fOffsets, fOpRe, fOpIm, fOpNonZero));
        } else {
            for (int base = 0; base < dimension; base++) {
                if ((base & targetMask) == 0) {
                    applyOperatorGroup(base, localDimension, offsets, opRe, opIm, opNonZero);
                }
            }
        }
```

- [ ] **Step 6: Rework `JQAPIConfig`** so the parallel executor is constructed only in `getDefault()`:
  - Replace `private static final JQAPIConfig DEFAULT = new JQAPIConfig(...)` with a lazily-initialised `private static JQAPIConfig defaultInstance;` and build it inside `getDefault()` (no `<clinit>` reference to `ParallelOperatorExecutor`).
  - Add `public OperatorExecutor operatorExecutor()` returning the config's executor field.
  - `getDefault()` wires `new ParallelOperatorExecutor(parallelExecutor)`; add `public static JQAPIConfig sequential(int maxQubits)` wiring `new SequentialOperatorExecutor()` and `parallelEnabled=false`.
  - Keep the existing `ForkJoinPool parallelExecutor()` / `withExecutor(ForkJoinPool)` public API unchanged (JVM-only; the bridge never calls them, and TeaVM tolerates the unused field type once no `ForkJoinPool` *method* is reachable — confirmed in Task 2). If Task 2 shows the bare field still trips TeaVM, move the `ForkJoinPool` field into `ParallelOperatorExecutor` and have those accessors delegate.

- [ ] **Step 7: Add config-injecting entry points** so the bridge avoids `getDefault()`:
  - `CircuitSpecs.toCircuit(CircuitSpec spec, JQAPIConfig config)` → `new Circuit(spec.numQubits(), config)`; existing `toCircuit(spec)` delegates with `JQAPIConfig.getDefault()`.
  - `CircuitSpecJson.fromJson(String json, JQAPIConfig config)` → `mapCircuit` uses `config.maxQubits()`; existing `fromJson(String)` delegates with `JQAPIConfig.getDefault()`.

- [ ] **Step 8: Full suite green** — `mvn -B test` → BUILD SUCCESS; `QuantumRegisterGoldenMasterTest` unchanged.

- [ ] **Step 9: Commit.**
```bash
git add src/main/java/org/aitan/jqapi/quantum/OperatorExecutor.java \
        src/main/java/org/aitan/jqapi/quantum/SequentialOperatorExecutor.java \
        src/main/java/org/aitan/jqapi/quantum/ParallelOperatorExecutor.java \
        src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java \
        src/main/java/org/aitan/jqapi/JQAPIConfig.java \
        src/main/java/org/aitan/jqapi/visualization/CircuitSpecs.java \
        src/main/java/org/aitan/jqapi/visualization/spec/CircuitSpecJson.java \
        src/test/java/org/aitan/jqapi/test/OperatorExecutorTest.java pom.xml
git commit -m "refactor(core): isolate parallel path behind OperatorExecutor for TeaVM (#5)"
```

---

### Task 2: `jqapi-wasm` module + JS bridge

**Files:**
- Create: `jqapi-wasm/pom.xml` (spike scaffold already present — finalise: replace throwaway `SpikeMain` main-class with the bridge, keep `teavm-classlib` + `-XDstringConcat=inline` + JS target)
- Create: `jqapi-wasm/src/main/java/org/aitan/jqapi/wasm/JqapiBridge.java`
- Delete: `jqapi-wasm/src/main/java/org/aitan/jqapi/wasm/SpikeMain.java`

**Interfaces:**
- Consumes: `CircuitSpecJson.fromJson(String, JQAPIConfig)`, `CircuitSpecs.toCircuit(CircuitSpec, JQAPIConfig)`, `JQAPIConfig.sequential(int)`, `LocalSimulator`, `QuantumRegister.getRegisterState()`.
- Produces: JS entry `run(specJson) → resultsJson`, where `resultsJson` is `{"amplitudes":[{"re":…,"im":…}, …]}`.

- [ ] **Step 1: Write the bridge.** Build a sequential config so `getDefault()` (and thus `ParallelOperatorExecutor`) is never on the reachable path:

```java
package org.aitan.jqapi.wasm;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.Complex;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.teavm.jso.JSExport;

/** Browser-facing bridge: JSON circuit spec in, JSON state-vector out. */
public final class JqapiBridge {

    private JqapiBridge() {
    }

    @JSExport
    public static String run(String specJson) {
        JQAPIConfig config = JQAPIConfig.sequential(JQAPIConfig.DEFAULT_MAX_QUBITS);
        CircuitSpec spec = CircuitSpecJson.fromJson(specJson, config);
        Circuit circuit = CircuitSpecs.toCircuit(spec, config);
        LocalSimulator sim = new LocalSimulator(circuit);
        sim.execute();
        ComplexVector state = sim.getQuantumRegister().getRegisterState();
        StringBuilder sb = new StringBuilder("{\"amplitudes\":[");
        for (int i = 0; i < state.getDimension(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            Complex c = state.getEntry(i);
            sb.append("{\"re\":").append(c.getReal())
                    .append(",\"im\":").append(c.getImaginary()).append('}');
        }
        return sb.append("]}").toString();
    }
}
```

Point the TeaVM plugin at a module entry (0.12 supports `@JSExport` module output; set `<mainClass>` to a class with a `main` that does nothing, or configure `entryPointName`/module target). Keep `<targetType>JAVASCRIPT</targetType>`, `<targetDirectory>${project.build.directory}/js</targetDirectory>`.

- [ ] **Step 2: Build under JDK 21** — `JAVA_HOME=/opt/homebrew/opt/openjdk@21/... mvn -f jqapi-wasm/pom.xml -B clean package`.
Expected: BUILD SUCCESS; **no** `ForkJoinPool` / `IntStream.parallel` errors (proves Task 1's reachability contract); non-empty `target/js/*.js`.
If `ForkJoinPool` still reported → the bare field in `JQAPIConfig` trips TeaVM; apply Task 1 Step 6's fallback (move the field into `ParallelOperatorExecutor`) and rebuild.

- [ ] **Step 3: Commit.**
```bash
git add jqapi-wasm/pom.xml jqapi-wasm/src/main/java/org/aitan/jqapi/wasm/JqapiBridge.java
git rm jqapi-wasm/src/main/java/org/aitan/jqapi/wasm/SpikeMain.java
git commit -m "feat(wasm): jqapi-wasm module + JS bridge run(specJson) via TeaVM (#5)"
```

---

### Task 3: JVM⇔JS cross-check test

**Files:**
- Create: `jqapi-wasm/src/test/java/org/aitan/jqapi/wasm/test/BridgeCrossCheckTest.java`

**Interfaces:**
- Consumes: `JqapiBridge.run` (JVM, for the reference), the compiled JS (run via Node), `LocalSimulator`.

- [ ] **Step 1: Write the test.** Run the SAME Bell spec through (a) `JqapiBridge.run` on the JVM and (b) the TeaVM-compiled JS in Node, and assert the amplitude JSON matches (parse + compare with 1e-9 tolerance). Skip gracefully (`Assumptions.assumeTrue`) if `node` is absent or the JS artifact is missing, so the core suite stays runnable without Node. The Bell reference amplitudes are `[1/√2, 0, 0, 1/√2]`.

```java
// Bell spec:
// {"version":1,"numQubits":2,"levels":[
//   {"gates":[{"kind":"H","targets":[0],"controls":[],"params":{}}]},
//   {"gates":[{"kind":"CNOT","targets":[1],"controls":[0],"params":{}}]}]}
// (a) JVM: JqapiBridge.run(bell)
// (b) Node: `node -e "const m=require('target/js/jqapi.js'); console.log(m.run(bell))"`
// assert amplitudes[0].re ≈ amplitudes[3].re ≈ 0.70710678, others ≈ 0.
```

- [ ] **Step 2: Run** — `JAVA_HOME=…21 mvn -f jqapi-wasm/pom.xml -B test` (with Node present) → PASS; without Node → skipped, build green.

- [ ] **Step 3: Commit.**
```bash
git add jqapi-wasm/src/test/java/org/aitan/jqapi/wasm/test/BridgeCrossCheckTest.java
git commit -m "test(wasm): Bell circuit JS output matches JVM LocalSimulator (#5)"
```

---

## Verification

- Task 1: `OperatorExecutorTest` parity + full `mvn -B test` green, golden-master unchanged.
- Task 2: TeaVM JS build succeeds under JDK 21 with **zero** `ForkJoinPool`/`IntStream.parallel` errors (the reachability contract, proven by the compiler).
- Task 3: Bell amplitudes from the compiled JS equal the JVM `LocalSimulator` within 1e-9.
- Zero new `jqapi-core` runtime dependencies; JVM behaviour bit-for-bit unchanged.

## Out of scope (deferred to 2c / later)

WASM-GC backend (JS backend chosen for maturity — `ponytail:` JS target, revisit WASM-GC only if JS perf is inadequate at editor scale); React/react-konva editor; save/load/URL; npm supply-chain controls; Maven Toolchains automation (documented `JAVA_HOME` suffices until CI needs it).
