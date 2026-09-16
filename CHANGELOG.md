# Changelog

All notable user-facing changes are documented here. GitHub Releases contain
the published release notes and source archives.

## Unreleased

### Fixed

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
