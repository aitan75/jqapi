# Java 25 improvement review

Reviewed on 2026-09-23 against baseline `c00591f`, starting from the local
`reports/jqapi_java_25_report.md`. The original report is an ignored local
artifact; this document records the verified decisions and results.

## Assessment of the original proposals

| Proposal | Decision and evidence |
| --- | --- |
| Replace serialization with `String.join()` | Keep the existing builder: JSON is emitted incrementally, and a join would need intermediate strings. Remove unnecessary sorting allocations instead. No blanket Java 25 speedup is assumed. |
| Adopt value classes | Deferred. They are not a delivered feature of standard JDK 25; see the [JDK 25 feature list](https://openjdk.org/projects/jdk/25/) and [Valhalla](https://openjdk.org/projects/valhalla/). The register and matrices already use primitive interleaved arrays. |
| Replace ForkJoinPool with virtual threads | Keep the CPU-oriented executor. Virtual threads were finalized in Java 21 and do not improve CPU-bound throughput simply by adding threads; see [JEP 444](https://openjdk.org/jeps/444). TeaVM still requires the sequential path. |
| Introduce records and pattern matching | `CircuitSpec`, `GateSpec`, `LevelSpec`, and `ComplexCell` are already records. The JSON mapper already uses pattern matching; renderer dispatch already uses switch expressions. |
| Move enums into a new package | No change: `GateSpec` and `LevelSpec` are records, not enums. Moving public types would break consumer imports without improving simulation. |
| Apply newer string methods and `var` throughout | Make local changes only when they remove work or clarify behavior. Preserve the TeaVM string-concatenation compiler flag. |

## Implemented changes

- JSON serialization avoids `TreeMap` construction for empty and single-entry
  parameter maps while preserving deterministic key order. Parameter names are
  escaped correctly, including control characters; unpaired surrogates are
  rejected consistently with the parser.
- JSON parsing now enforces the JSON number grammar, rejects raw control
  characters in strings, and accepts only the four JSON whitespace characters.
  Inputs such as `+1`, `01`, `.1`, and `1.` previously passed Java's number parser.
- Rendering appends trimmed character-array slices directly. Connector bounds
  and membership checks no longer construct per-gate/per-wire stream pipelines.
  Existing exact-output tests preserve Unicode and ASCII layouts.
- `QuantumRegister.applyOperator` validates target arity, range, uniqueness,
  nulls, and both matrix dimensions before modifying amplitudes or shifting bits.
  Previously, duplicate targets could corrupt the state and extra matrix columns
  could be silently ignored.
- Partial measurement uses a strict probability comparison: a random draw of
  zero cannot select a branch of probability zero. Deterministic regression
  tests exercise both partial measurement and reset on an excited qubit.
- State-vector tests take one snapshot per assertion loop instead of repeatedly
  allocating and copying the entire vector. The same amplitudes are checked.
- The JVM/JavaScript comparison loads the actual ES module, requires the generated
  artifact, checks that the Bell result contains four amplitudes, and compares
  malformed-number rejection across JVM and Node. Node absence still skips the
  cross-runtime tests.

These are compatible, source-level improvements for the existing Java 25/TeaVM
build, rather than changes requiring preview language features. Malformed JSON
and invalid operator calls are intentionally rejected earlier.

## Allocation measurements

Oracle JDK 25.0.3, macOS aarch64, `-Xms256m -Xmx512m`. Each fixture has eight
qubits and CNOT, RX, and U3 gates per level. The same benchmark bytecode was run
against baseline and modified core classes in separate JVMs, with 500 warmup
iterations and 1,000 measured iterations. The source is
[`CircuitVisualizationAllocationBenchmark`](../src/test/java/org/aitan/jqapi/benchmark/CircuitVisualizationAllocationBenchmark.java).

| Levels | JSON before/after (bytes/op) | Renderer before/after (bytes/op) |
| ---: | ---: | ---: |
| 10 | 17,312 / 14,992 | 40,496 / 14,576 |
| 100 | 189,312 / 164,512 | 364,172 / 126,640 |
| 1,000 | 1,743,152 / 1,495,152 | 2,455,152 / 1,088,568 |

The largest fixture allocates approximately 14% less for JSON and 56% less for
rendering. These are local per-thread allocation measurements, not throughput
claims or CI performance thresholds; JIT decisions affect the exact counts.

Reproduce after compiling test sources:

```sh
mvn -B -DskipTests package
java -Xms256m -Xmx512m -cp target/classes:target/test-classes \
  org.aitan.jqapi.benchmark.CircuitVisualizationAllocationBenchmark
```

For comparison, replace `target/classes` with classes compiled from the baseline.
The existing `StateVectorSimulatorTest` class took 77.76 seconds in the baseline
run and about 0.03 seconds after snapshot reuse. That difference concerns test
overhead, not simulator throughput.

## Additional opportunities found in the code

1. `QuantumRegister.initializeQuantumRegister()` still builds a zero state through
   repeated `ComplexVector.tensorProduct` calls before flattening it. A direct
   primitive-array initializer could avoid intermediate vectors. Benchmark peak
   allocation and retain input-qubit semantics before changing all constructors.
2. `QuantumRegister.applyOperatorGroup()` allocates two scratch arrays per group.
   A sequential path could reuse scratch buffers; parallel execution needs buffers
   isolated per task. Measure with the existing hot-loop benchmarks and retain
   bit-for-bit parallel/sequential equivalence before changing scheduling.

Both are follow-up optimization candidates, not performance claims. This pass
does not replace the executor or alter the state-vector representation.

## Validation

- `mvn -B clean install`: 292 tests passed; all JaCoCo coverage thresholds passed
  from a clean build.
- `mvn -f jqapi-wasm/pom.xml -B clean package`: TeaVM compilation passed on JDK 25;
  9 bridge tests passed with no skips, including the Node comparisons.
- `jqapi-web/src/wasm/jqapi.js` was copied from the new TeaVM output and compared
  byte-for-byte. It was not edited by hand.
- After `npm ci --ignore-scripts`, the web suite passed all 33 tests; the
  production build and lint command exited successfully. Existing warnings
  remain for React refs/effect usage in `App.tsx` and the bundle size above
  500 kB. No web application source or dependency manifest was changed.
- `git diff --check` passed.
