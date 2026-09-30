# Changelog

All notable user-facing changes are documented here. GitHub Releases contain
the published release notes and source archives.

## Unreleased

### Added

- Live web state views: reduced Bloch sphere for any qubit, probability/phase heatmap, and a seeded per-operation timeline with discrete measurement outcomes.
- Guided teleportation with editable input angles, implicit classical bits and conditional X/Z corrections, plus fidelity against Bob's reduced state (#125).
- `LocalSimulator.execute(OperationListener)` and a bounded TeaVM `trace` export; editor save/load supports the implicit CircuitSpec v2 classical subset.

- OpenQASM 2 import and export for a documented subset, including measurement,
  reset, and one-bit `if` conditions (`OpenQasmParser`, `OpenQasmSerializer`).
- Pauli observables: `PauliString`, `PauliSum`, Hermitian overlap, fidelity and
  exact expectation values without dense operators, plus shot-based estimates
  with `ExpectationSampler`. The TeaVM bridge exports `expectation` and
  `sampleExpectation`, and the studio adds an Observable ⟨H⟩ panel.
- `ParametricCircuit` templates with named parameters, validated binding to
  runnable circuits or `CircuitSpec`, and independent runtime gates per binding.
- Scientific reference tests against committed analytic and pinned Qiskit
  fixtures, and reproducible JVM/browser benchmarks with a documented baseline.

- Studio OpenQASM 2 import/export: failed or unsupported imports keep the
  current circuit, and unsupported exports fail explicitly (#113).
- Studio simulations run in cancellable Web Workers with a deadline, under a
  measured browser budget (qubits, shots, depth, dense-matrix cells, work, trace
  and result size) exposed by the bridge `capabilities` export (#113).

### Fixed

- `U3` no longer produces NaN amplitudes when `phi + lambda` overflows for
  extremely large finite angles.
- OpenQASM interop bitstring conversion is tested, and CI validates exported
  programs with an external OpenQASM parser.

### Changed

- The browser bridge is limited to 8 quantum and classical bits and the
  trace snapshot budget is 65,536 amplitudes; JVM defaults are unchanged. JSON
  `MULTI_CONTROLLED` imports into Studio accept only X or single-control phase
  matrices (#113).
- Corrected the documented TeaVM requirement to JDK 25 exactly and refreshed the
  README with a studio overview and shots demo.

## 1.1.1 - 2026-09-24

### Added

- Quantum Fourier transform and inverse-QFT circuit builders, with a QFT macro
  in the web editor.
- Reproducible core circuit sampling and repeated-shot simulation in Studio.
- Classical measurement records and conditional circuit execution, including
  CircuitSpec v2 serialization and TeaVM bridge support.
- Broader numerical and cross-runtime checks, with JaCoCo coverage gates in CI.

### Fixed

- Grover iteration selection for searches with multiple matching states.
- React compatibility warnings and validation of shot-count input in Studio.
- Simulation boundary validation and CodeQL workflow version consistency.
- `CircuitSpecJson.fromJson` rejects lone UTF-16 surrogate escapes (and raw lone
  surrogates), so string escape sequences decode to valid Unicode scalar values
  per RFC 8259 §8.2. It also rejects duplicate target/control indexes and caps
  the level count at `MAX_LEVELS`.
- The browser editor validates shared-circuit URL fragments and loaded JSON
  with a structural guard before building a circuit model, so malformed payloads
  never reach the WASM bridge as a trusted `CircuitSpec`. The guard enforces
  qubit bounds, unique and disjoint indexes, per-kind arity, `2^n × 2^n`
  matrices, and level/gate limits.

### Changed

- The core and TeaVM bridge now require Java 25; the bridge uses TeaVM 0.15.
- Updated locked frontend dependencies, including React 19.3, Vite 8.3,
  and oxlint 1.85; TypeScript 6.0 and Vitest 4.1 remain in use.
- Reduced allocations in circuit rendering and CircuitSpec JSON serialization.
- Documented the unavoidable inline-style requirement of the editor's CSP
  (`style-src 'unsafe-inline'`) and the retained shared `SecureRandom` for
  measurement, backed by a concurrency benchmark.

## 1.1.0 - 2026-09-15

### Added

- A browser circuit editor backed by the TeaVM bridge, with a gate palette,
  circuit canvas, presets, execution results, and a Bell-state walkthrough.
- `CircuitSpec` and JSON serialization for lossless circuit interchange,
  together with conversion to and from runnable circuits.
- Deterministic ASCII circuit rendering for terminals, tests, and bug reports.
- Internationalized browser-editor UI and atomic handling of multi-qubit gate
  interactions.

### Changed

- Grover search applies its operators in place.
- Build, security, and web-editor workflows were updated and hardened.

### Fixed

- Browser ESM bridge loading.
- Non-blocking handling of software-composition-analysis timeouts.

## 1.0.1 - 2026-07-10

- Added parametric gates, generic multi-controlled gates, and mid-circuit
  reset.
- Made parallel state-vector updates configurable through `JQAPIConfig`.
- Removed per-amplitude string allocations on measurement and readout paths.
- Replaced runtime math dependencies with native complex-number types and added
  Maven checksum verification.

## 1.0.0 - 2021-04-29

- First official release of jqapi.

## 0.1.0 - 2021-04-29

- Early development release.
