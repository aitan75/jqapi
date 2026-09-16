# Changelog

All notable user-facing changes are documented here. GitHub Releases contain
the published release notes and source archives.

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
