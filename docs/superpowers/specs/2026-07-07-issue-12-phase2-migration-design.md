# Issue #12 Phase 2 — QuantumRegister Primitive State Migration — Design

## Problem

Issue #12 asks to remove the boxed-`Complex` allocation cost from jqapi's quantum
simulation. Phase 1 (merged to `main`, see
`docs/superpowers/specs/2026-07-07-complex-representation-spike-design.md`) settled
*which* primitive representation to target — a raw `double[]` (interleaved re/im) —
by benchmarking it against EJML on the actual `QuantumRegister.applyOperator` hot-loop
workload. It did not change any production code.

Phase 2 is the actual migration: give `QuantumRegister`'s hot loop that primitive
representation for real.

Investigation for this phase found that boxed `Complex` does not stay confined to
`ComplexVector`/`ComplexMatrix` — it escapes directly into `Qubit`, `QubitSuperposition`,
`Algorithm`, and `Constants.java` (~64 `Complex` gate-matrix literals), all of which
construct or manipulate `Complex` objects by hand. A full elimination of boxing
everywhere would touch all ~13 consumer files — a large blast radius for a benefit
that was only ever measured on one method: `QuantumRegister.applyOperator`, the single
hot path invoked once per gate by `LocalSimulator`. This is also the specific
maintainability/blast-radius tradeoff flagged during this design's review.

## Scope

**In scope:** `QuantumRegister`'s internal state representation and the hot methods
that read/write it (`applyOperator`, `measure`, `measureQubitAtIndexes` and their
private helpers). Conversion to/from `ComplexVector` at the (non-hot) boundaries:
construction, `getRegisterState()`, `getQubitRegisterState()`, and the deprecated
`setRegisterState(ComplexVector)`.

**Out of scope:**
- `ComplexVector`, `ComplexMatrix`, `Qubit`, `QubitSuperposition`, `Algorithm`,
  `Constants.java`, and the gate classes — **zero changes**. They keep using boxed
  `Complex` exactly as today.
- Eliminating boxing anywhere outside `QuantumRegister`'s hot methods.
- Removing or changing the deprecated `setRegisterState`/`forSimulation` methods'
  visibility or existence — they keep working, just backed differently internally.

## Architecture

`QuantumRegister` replaces its `private ComplexVector registerState` field with a
`private double[] registerState` holding interleaved amplitudes: amplitude `i`'s real
part lives at `registerState[2*i]`, imaginary part at `registerState[2*i + 1]` — the
same convention Phase 1's `AmplitudeState` used, so the eventual perf re-validation
(below) is measuring the same shape of workload the spike already validated.

**Construction** (`initializeQuantumRegister()` and its two overloads, lines 302-332)
is unchanged in its logic — it still builds the initial state via
`Qubit.getValue().tensorProduct(...)` chains, since this runs once per register and
isn't the hot path Phase 1 or this phase targets. The only change: the final
`ComplexVector` produced by the tensor-product chain is converted once into the
`double[]` field via its `getData()` (a `Complex[]`) at the end of each
`initializeQuantumRegister` variant.

**`applyOperator(ComplexMatrix operator, List<Integer> targetQubits)`** (lines
208-251) keeps its existing offset/mask indexing logic (unchanged — already verified
correct in Phase 1's review) but works entirely in primitives:
1. Flatten `operator` into two local `double[]` arrays (`opRe`, `opIm`) of length
   `localDimension * localDimension`, once per call: for each `(r, c)`, read
   `Complex entry = operator.getEntry(r, c)` once, record `opNonZero[r][c] =
   !entry.equals(Complex.ZERO)` from that same boxed `entry` (byte-for-byte the same
   check as today's skip optimization), then extract `entry.getReal()`/
   `.getImaginary()` into `opRe`/`opIm` — the boxed read and the zero-check happen
   together, before anything is treated as primitive. `getReal()`/`getImaginary()`
   are plain field reads, not allocations.
2. Gather the `localDimension` local amplitudes' re/im pairs directly from the
   `double[]` state (`registerState[2*(base|offsets[t])]` /
   `registerState[2*(base|offsets[t]) + 1]`) into local primitive arrays.
3. Accumulate each output amplitude's real/imaginary parts in primitive `double`
   accumulators using the standard complex-multiply-accumulate formula
   (`re += opRe*localRe - opIm*localIm; im += opRe*localIm + opIm*localRe`), skipping
   entries where `opNonZero` is false.
4. Write the two accumulated doubles directly into `registerState` at
   `2*(base|offsets[r])` / `+1`.

No `Complex` object is allocated anywhere in this method's per-amplitude loops — the
only per-call allocations are the three small flatten arrays sized
`localDimension`/`localDimension²` (`localDimension` is `2^k`, and `k` is the gate's
qubit arity — 1, 2, or occasionally 3 for Toffoli/CSwap — so these are tiny compared
to the `2^n`-sized register state).

**`measure()`** (lines 255-267) and its private helpers
(`calculateCollapsedIndex()`/`calculateCollapsedIndex(int)`/
`updateRegisterStateAfterQubitCollapsed`, lines 334-381) read/write `registerState`
directly as primitives: zeroing an amplitude sets both `double[]` slots to `0.0`,
setting an amplitude to `Complex.ONE` sets slots to `(1.0, 0.0)`, and probability
(`|amplitude|²`) is computed as `re*re + im*im` instead of
`Math.pow(complex.abs(), 2)`. These are mathematically identical (amplitudes are
bounded to magnitude ≤ 1, so there is no overflow concern that would otherwise justify
`Complex.abs()`'s `Math.hypot`-style care) and differ at most at floating-point
rounding noise — covered by the tolerance-based equivalence tests below, not a
behavior change.

**Boundary conversions** (non-hot, unchanged cost profile):
- `getRegisterState()` (line 164): builds a `Complex[]` from the `double[]` pairs and
  wraps it in a `new ComplexVector(...)` — same public return type and semantics as
  today.
- `getQubitRegisterState()` (lines 180-188) and its `verifySeparable` helper (lines
  388-400): both need a `FieldVector<Complex>`/`ComplexVector` view of the state to
  call the unchanged `ComplexVector.factorize(...)`. Build one temporary
  `ComplexVector` from the `double[]` at the start of `getQubitRegisterState()` — this
  method already isn't hot (no other in-repo caller) and factorization is already
  `O(2^n · size)`, dominating any conversion cost.
- `setRegisterState(ComplexVector)` (lines 190-198, `@Deprecated`, no in-repo callers):
  validates dimension against `registerState.length / 2` (was
  `this.registerState.getDimension()`) and converts the incoming `ComplexVector`'s
  `getData()` into the `double[]` field.

## Numerical equivalence validation

The existing test suite is thin for this purpose: `QuantumRegisterTest` has 3
`@Test` methods (Hadamard on 1 qubit, a dimension-mismatch error case, and one
`Complex.ONE` equality check) and `QuantumAlgorithmTest` has 4 — neither covers
CNOT, CZ, CY, Swap, Toffoli, CSwap, S, T, or multi-qubit/multi-gate-level
combinations. That's not enough to back the "float-tolerance equivalence" claim
Issue #12's acceptance criteria requires.

Before touching `QuantumRegister`, add a new test,
`src/test/java/org/aitan/jqapi/test/QuantumRegisterGoldenMasterTest.java`, that
captures the *current* (pre-migration, `Complex`-based) implementation's output as
literal expected amplitude arrays for: each single-qubit gate (H, X, Y, Z, S, T) on a
1-qubit and a 2-qubit register (gate applied to one target among several qubits), each
2-qubit gate (CNOT, CZ, CY, Swap) on a 2-qubit and a 3-qubit register, each 3-qubit
gate (Toffoli, CSwap) on a 3-qubit register, and two multi-level circuits (H on all
qubits then CNOT; H then a different single-qubit gate then CNOT) on a 3-qubit
register — using the existing `EPS = 1e-9` tolerance convention from
`QuantumRegisterTest`. This test runs and passes against the current implementation
first (proving the captured values are correct), then continues to pass unmodified
against the migrated implementation — that's the equivalence proof.

## Performance re-validation

Phase 1's benchmark measured an isolated spike harness, not production code. Add a
new benchmark class following the `MemoryLimitBenchmark`/`RepresentationBenchmark`
convention (`main()`-driven, non-`@Test`-matching name, excluded from `mvn test`)
that measures the real `QuantumRegister.applyOperator` — same {16, 20} qubits ×
{1-qubit, 2-qubit gate} matrix as Phase 1 — run once before the migration (recording
baseline `Complex`-based numbers) and once after (recording the new numbers), so the
issue's original acceptance criteria ("reduced allocation/GC and improved runtime at
16 and 20 qubits") is verified against the actual production method, not inferred
from the spike alone. Results recorded in this spec's own results section, filled in
during implementation (same pattern as Phase 1).

## Testing

- `QuantumRegisterGoldenMasterTest` (new, above) — the primary equivalence proof.
- Existing `QuantumRegisterTest` and `QuantumAlgorithmTest` must continue to pass
  unmodified — they exercise the same public API and are a second, independent
  equivalence signal.
- Full `mvn test` must pass; the new before/after benchmark class must continue to be
  excluded from surefire's include patterns, same as `MemoryLimitBenchmark`.

## Out of scope

- Any change to `ComplexVector`, `ComplexMatrix`, `Qubit`, `QubitSuperposition`,
  `Algorithm`, `Constants.java`, or the gate classes.
- Eliminating boxed `Complex` anywhere outside `QuantumRegister`'s internal state and
  hot methods.
- Changing `setRegisterState`/`forSimulation`'s deprecated status, visibility, or
  removing them.
- Parallelization (issue #8), density matrices (issue #9), parametric gates (issue
  #7) — unrelated, separate issues.

## Results

Benchmark: `QuantumRegisterHotLoopBenchmark` (production `applyOperator`,
50 warmup + 200 timed iterations, allocation via
`ThreadMXBean.getThreadAllocatedBytes`). Same machine and JVM for both runs
(see environment header transcribed below).

Environment: os.name: Mac OS X, os.arch: aarch64, java.version: 25.0.3, availableProcessors: 8

### Before migration (Complex-based, commit 3e8107a)

| n  | gate          | ns/op | bytes/op |
|----|---------------|-------|----------|
| 16 | 1-qubit (H)   | 1019949.2 | 4194352.0 |
| 16 | 2-qubit (CNOT)| 1359834.4 | 2097216.0 |
| 20 | 1-qubit (H)   | 24250018.5 | 67108912.0 |
| 20 | 2-qubit (CNOT)| 20050607.5 | 33554496.0 |

### After migration (double[]-based)

(filled in after the migration lands — see plan Task 4)

### Verdict

(filled in after the migration lands — see plan Task 4)
