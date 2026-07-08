# Issue #12 Phase 3 — Complete commons-math3 Removal — Design

## Problem

Phases 1-2 of issue #12 benchmarked and validated a raw `double[]` amplitude
representation (see
`docs/superpowers/specs/2026-07-07-complex-representation-spike-design.md`)
and applied it to `QuantumRegister`'s hot loop (see
`docs/superpowers/specs/2026-07-07-issue-12-phase2-migration-design.md`). One
of issue #12's acceptance criteria remains open: `pom.xml` dependency updated
(commons-math3 replaced or its usage removed) and build passes, migration API
changes documented (`docs/api/math.md`).

`org.apache.commons:commons-math3` is still used in 9 production files
(`Complex`, `ComplexVector`, `ComplexMatrix`, `Constants`, `Qubit`,
`QubitOne`, `QubitSuperposition`, `Algorithm`, `LocalSimulator`) and 5 test
files, and remains a `compile`-scope dependency in `pom.xml`, alongside
`ejml-zdense` (added `test`-scope for Phase 1's spike, unused since the
`double[]` decision was made).

`ComplexVector extends ArrayFieldVector<Complex>` and `ComplexMatrix extends
BlockFieldMatrix<Complex>` directly — they are not thin wrappers, so fully
removing math3 requires rewriting these two classes plus introducing jqapi's
own `Complex` type (today `Complex` is math3's own class, imported
everywhere).

## Compatibility decision

`ComplexVector`/`ComplexMatrix`'s public method names and behavior are
preserved (`getEntry`, `setEntry`, `getDimension`, `getData`,
`outerProduct`, `tensorProduct`, `factorize`, `kroneckerProduct`,
`createIdentityMatrix`, `createMatrixWithData`, `createGateMatrix`,
`getRowDimension`, `getColumnDimension`). The one unavoidable break for
external consumers: `Complex` becomes `org.aitan.jqapi.math.Complex` instead
of `org.apache.commons.math3.complex.Complex` — a single import change, no
call-site logic changes, since jqapi's `Complex` matches the same method
surface consumers already use.

## Why one branch, one PR (not independently-mergeable phases)

Unlike Phase 1 (isolated spike, no production code touched) and Phase 2
(touched only `QuantumRegister.java`, no overlap with other files), this
phase cannot be split into independently-mergeable slices. `ComplexVector`
and `ComplexMatrix`'s method signatures reference `Complex` directly
(`getEntry(...): Complex`, `createMatrixWithData(Complex[][])`, ...). The
moment `Complex`'s identity changes from math3's class to jqapi's own, every
file that passes or receives a `Complex` to/from `ComplexVector`/
`ComplexMatrix` stops compiling until updated — there is no
partially-migrated compiling state. All tasks below therefore land as
sequential commits on a single feature branch, merged via a single PR — the
same structure Phase 2 used internally (Task 1..4 on one branch), just
scaled to this phase's larger blast radius.

## Scope

**In scope:**
- New `org.aitan.jqapi.math.Complex` — immutable value class, no math3
  inheritance.
- Rewritten `ComplexVector`, `ComplexMatrix` — backed by primitive
  `double[]`, no math3 inheritance.
- Migration of all 9 production files and 5 test files off
  `org.apache.commons.math3.*` imports.
- Removal of `commons-math3` and `ejml-zdense` from `pom.xml`.
- Final golden-master + benchmark re-validation, `docs/api/math.md` update,
  closing issue #12.

**Out of scope:**
- Any change to observable numeric behavior or public API shape beyond the
  `Complex` import change described above.
- Any new library adoption (EJML/ojAlgo) — already rejected in Phase 1's
  spike; no new evidence changes that.

## Component design

### `Complex`

Immutable, `private final double re, im` — no interface implementation:

```java
public final class Complex {
    public Complex(double re, double im) { ... }

    public double getReal() { ... }
    public double getImaginary() { ... }

    public Complex add(Complex other) { ... }
    public Complex add(double real) { ... }          // used by ComplexVector.factorize
    public Complex subtract(Complex other) { ... }     // used internally by sqrt1z
    public Complex multiply(Complex other) { ... }
    public Complex multiply(double scalar) { ... }
    public double abs() { ... }
    public Complex sqrt() { ... }                      // principal square root
    public Complex sqrt1z() { ... }                    // = ONE.subtract(this.multiply(this)).sqrt()

    @Override public boolean equals(Object o) { ... }  // exact re/im comparison, same as today
    @Override public int hashCode() { ... }
    @Override public String toString() { ... }

    public static final Complex ZERO = new Complex(0, 0);
    public static final Complex ONE  = new Complex(1, 0);
    public static final Complex I    = new Complex(0, 1);
}
```

`sqrt()`/`sqrt1z()` implement the standard principal-square-root formula,
matching math3's semantics for finite inputs — the only case that occurs in
this codebase (amplitudes are always finite). math3's NaN/Infinity edge-case
hardening (a general-purpose-library concern) is not replicated; this is a
documented behavioral caveat, not a functional gap for jqapi's own use.

`equals`/`hashCode` remain an exact bitwise comparison on `re`/`im` (no
tolerance), matching math3's `Complex.equals` today.

### `ComplexVector`

Backed by `double[] data`, interleaved re/im (`data[2i]`=re,
`data[2i+1]`=im) — the same convention `QuantumRegister` already uses
post-Phase-2:

```java
public class ComplexVector {
    public ComplexVector(int size) { ... }              // zero-filled
    public ComplexVector(Complex[] values) { ... }        // boxing only at this boundary

    public Complex getEntry(int i) { ... }
    public void setEntry(int i, Complex value) { ... }
    public int getDimension() { ... }
    public Complex[] getData() { ... }                    // boxing only at this boundary

    public ComplexMatrix outerProduct(ComplexVector other) { ... }
    public ComplexVector tensorProduct(ComplexVector other) { ... }
    public static ComplexVector[] factorize(ComplexVector vector) { ... }

    @Override public String toString() { ... }
}
```

`tensorProduct` is reimplemented directly against `ComplexMatrix` (reading
`getEntry(row, col)`), dropping the old `matrixVectorization(FieldMatrix<Complex>)`
helper — it had no external callers and its parameter type (`FieldMatrix<Complex>`)
no longer exists once math3 is gone. `factorize`'s signature narrows from
`FieldVector<Complex>` to the concrete `ComplexVector` (the only type ever
passed).

### `ComplexMatrix`

Backed by `double[] data`, flat, row-major, same interleaved convention
(`data[2*(r*cols+c)]`=re, `+1`=im):

```java
public class ComplexMatrix {
    private ComplexMatrix(Complex[][] data) { ... }   // private constructors, unchanged shape

    public static ComplexMatrix createIdentityMatrix(int size) { ... }
    public static ComplexMatrix createMatrixWithData(Complex[][] data) { ... }
    public static ComplexMatrix createGateMatrix(Gate g) { return g.getMatrix(); }
    public static ComplexMatrix kroneckerProduct(List<ComplexMatrix> matrixList) { ... }

    public int getRowDimension() { ... }
    public int getColumnDimension() { ... }
    public Complex getEntry(int r, int c) { ... }
    public Complex[][] getData() { ... }               // boxing only at this boundary

    @Override public String toString() { ... }
}
```

`kroneckerProduct` is not a hot path (small dimensions, circuit-construction
time only), so its existing algorithm is ported near-verbatim, operating on
`Complex[][]` internally and materializing the final `double[]` via
`createMatrixWithData` — lower risk, no measurable performance concern.

## Consumer migration

For the remaining 7 production files (`Constants`, `Qubit`, `QubitOne`,
`QubitSuperposition`, `Algorithm`, `LocalSimulator`, `QuantumRegister` —
`ComplexVector`/`ComplexMatrix` are rewritten, not migrated, per the
component design above) and all 5 test files: swap the
`org.apache.commons.math3.complex.Complex` import for
`org.aitan.jqapi.math.Complex`. Two call sites need more than an import
swap:

- `Qubit.java`: `ComplexUtils.convertToComplex(new double[]{alpha,beta})` →
  inlined as `new Complex[]{new Complex(alpha,0), new Complex(beta,0)}`.
- `QubitOne.java` / `QubitSuperposition.java`: `Precision.round(x, n)`
  (math3, unrelated to `Complex`) → a small local rounding helper. This is
  the only other math3 usage outside the `Complex`/`ComplexVector`/
  `ComplexMatrix` triad, and must go too since the goal is complete removal.

## Testing

- Existing test suite (`QuantumRegisterGoldenMasterTest`, `QuantumRegisterTest`,
  `QuantumAlgorithmTest`, `LinearAlgebraTest`, `JavaQuantumAPITest`,
  `QuantumMeasurementTest`) is the primary equivalence proof — no test logic
  changes beyond the import swap. This suite already exercises `add`,
  `multiply`, `abs`, `equals`, `outerProduct`, `kroneckerProduct`, and
  `factorize` on real inputs repeatedly and in depth via gate/circuit/
  measurement coverage — no dedicated new test file is needed for that
  surface.
- **Gap found and closed:** `Complex.sqrt()`'s general (non-real) branch and
  `sqrt1z()` are reachable only via the `Qubit(Complex a)` /
  `QubitSuperposition(Complex complex)` constructor, which has **zero
  callers** anywhere in `src/main` or `src/test` today (the constructor
  actually exercised by tests, `QubitSuperposition(double alpha)`, computes
  beta via plain `Math.sqrt`, never touching `Complex`). Without a targeted
  check, a bug in this one non-trivial formula would go completely
  undetected. Add a couple of targeted assertions for `sqrt()`/`sqrt1z()`
  with non-trivial (non-zero imaginary part) input to the existing
  `LinearAlgebraTest` — not a new dedicated test file, since everything else
  is already covered transitively.
- Full `mvn test` clean after each task; final task confirms zero remaining
  `org.apache.commons.math3` references in `src/`.

## Performance re-validation

Re-run `QuantumRegisterHotLoopBenchmark` (unchanged, from Phase 2) on the
math3-free code to confirm removing the dependency doesn't regress Phase 2's
measured gains. Recorded in this spec's own results section once the
migration lands (same pattern as Phase 2).

### Results

(filled in after the migration lands)

## Documentation

Update `docs/api/math.md` to describe the new `Complex`/`ComplexVector`/
`ComplexMatrix` (no math3 dependency) and note the import-path change for
`Complex`, as required by issue #12's acceptance criteria.

## Out of scope

- Any new third-party linear-algebra library adoption.
- Any change to gate semantics, circuit semantics, or public method
  signatures beyond the `Complex` import path.
