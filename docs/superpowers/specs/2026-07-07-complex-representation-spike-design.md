# Complex Amplitude Representation — Benchmark Spike (Issue #12, Phase 1) — Design

## Problem

Issue #12 asks to replace the boxed `commons-math3` `Complex`/`ArrayFieldVector<Complex>`/
`BlockFieldMatrix<Complex>` representation used throughout jqapi with a primitive-backed
linear algebra library, to reduce allocation pressure and GC activity and improve runtime.
The issue itself calls out an open design decision — which library/representation to adopt —
and requires that decision to be "benchmark-driven" and "documented" before any migration
work starts.

The issue's own cited code locations are stale: it points at `LocalSimulator.applyGate`
(lines 90–134), a method that no longer exists. PR #14 moved the actual hot loop —
`sum = sum.add(entry.multiply(local[c]))` over `2^k` local amplitudes — into
`QuantumRegister.applyOperator(ComplexMatrix operator, List<Integer> targetQubits)`. Any
benchmark must target *that* method's workload, not the one described in the issue text.

`ComplexVector`/`ComplexMatrix` are not thin wrappers: they extend
`ArrayFieldVector<Complex>`/`BlockFieldMatrix<Complex>` directly and are consumed via the
full commons-math3 `FieldVector`/`FieldMatrix` API (`getEntry`, `multiply`, `add`, etc.) in
13 files, with `Constants.java` alone holding ~64 `Complex` references (gate matrix
literals). This makes the eventual migration (Phase 2, out of scope here) a wide-blast-radius
change — which is exactly why the library/representation choice needs to be settled with
evidence first, cheaply, before touching any of that surface.

## Scope

This spec covers **only Phase 1: an isolated benchmark spike** to produce a documented,
evidence-based decision between two candidate representations. It does **not** cover the
Phase 2 migration itself (touching `ComplexVector`, `ComplexMatrix`, `QuantumRegister`,
`Constants`, or any consumer) — that is a separate design cycle, scoped once this spike's
conclusion is known.

## Candidates

Two candidates are prototyped and measured:

1. **Raw `double[]` baseline** — amplitudes stored as an interleaved `double[]` (`re, im,
   re, im, ...`), gates as a flat `double[]`, multiplication written by hand with no boxing.
   Smallest possible representation; establishes the ceiling on how much the current
   boxed-`Complex` cost can be removed.
2. **EJML (`ZMatrixRMaj`)** — `org.ejml:ejml-zdense:0.44.0`, primitive-backed complex dense
   matrix (interleaved `double[]` internally, same layout idea as the baseline but through a
   maintained library API with existing complex linear-algebra operations).

**ojAlgo is excluded from this spike.** It reintroduces boxing for `ComplexNumber`
(`GenericStore<ComplexNumber>`), which is the exact cost this issue exists to remove; given
the workload is dominated by boxed-`Complex` elimination, prototyping it is unlikely to
change the decision and would triple the harness work for an a priori disadvantaged option.
If the raw-`double[]` vs. EJML result is inconclusive, ojAlgo can be added in a follow-up
spike — but is not built preemptively.

## Benchmark harness

New classes under `src/test/java/org/aitan/jqapi/benchmark/`, following the existing
`MemoryLimitBenchmark` convention (a `main()`-driven class, no `@Test` method, named so it
does not match surefire's `*Test`/`Test*`/`*Tests`/`*TestCase` include patterns — `mvn test`
never runs it):

- **`RawStateBaseline`** — interleaved `double[]` state + gate application, implementing a
  shared `applyGate(int[] targetQubits, double[] gateFlat)`-shaped contract.
- **`EjmlStateBenchmark`** — same contract, backed by `ZMatrixRMaj`.
- **`RepresentationBenchmark`** — the driver `main()`. For each of {16, 20} qubits × {1-qubit
  gate, 2-qubit gate} × {baseline, EJML}:
  1. Allocates the state once (outside the timed region).
  2. Runs a warm-up phase (gate applied repeatedly, results discarded) to get past JIT
     interpretation/C1 into steady state.
  3. Times M further repeated applications of the same gate on the already-allocated state —
     this isolates the cost of the hot-loop multiply itself, not allocation of the initial
     state vector or `Circuit`/`CircuitLevel`/`Algorithm` overhead (both of which are
     orthogonal to the representation question this spike answers).
  4. Records allocation activity via `com.sun.management.ThreadMXBean.getThreadAllocatedBytes`
     for the benchmark thread across the timed region (direct per-thread byte count, no GC
     log parsing needed); `-Xlog:gc` output is captured as a secondary cross-check if the
     thread-local figure looks surprising.
  5. Before timing, runs one correctness sanity check: applies the same gate once to the same
     initial state under both representations and asserts the resulting amplitudes agree
     within float tolerance. This is a guard against comparing execution times of
     implementations that don't compute the same thing — it is **not** the full numerical
     equivalence validation against the existing test suite (that belongs to Phase 2's
     migration work, not this spike).
  6. Prints a results table to stdout (same style as `MemoryLimitBenchmark`).

Run manually, same as the existing benchmark:
```
mvn test-compile && mvn -q exec:java -Dexec.classpathScope=test \
    -Dexec.mainClass=org.aitan.jqapi.benchmark.RepresentationBenchmark
```

## Dependency

`org.ejml:ejml-zdense:0.44.0` added to `pom.xml` in **`test` scope only**. It is not a
production dependency at this stage — promoting it to compile scope is a Phase 2 decision,
contingent on this spike's outcome.

## Decision documentation

Once the benchmark runs, this spec is updated in place with:
- The raw results table (wall-clock ns/op and bytes-allocated/op, per qubit count and gate
  arity, per representation).
- A short qualitative write-up of which representation is adopted for Phase 2 and why,
  written by inspecting the numbers rather than against a pre-committed numeric threshold —
  the issue's acceptance criterion is a documented, evidence-based decision, not a
  pass/fail gate.

## Out of scope

- ojAlgo (see Candidates above).
- Any change to `ComplexVector`, `ComplexMatrix`, `QuantumRegister`, `Constants`, or any of
  the 13 files currently consuming commons-math3 `Complex`.
- Formal numerical equivalence validation against the full existing test suite.
- Any migration/rollout planning — that is a separate design cycle once the representation
  decision is made here.

## Testing

The benchmark harness itself is not unit-tested (it is a manual measurement tool, like
`MemoryLimitBenchmark`). Its one correctness safeguard is the sanity check described in step
5 above, which runs as part of every benchmark invocation, not as a separate automated test.
