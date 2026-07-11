# Issue #5 Phase 1 — CircuitSpec DTO + ASCII renderer — Implementation Plan

> Executed inline (TDD, commit per task). Ref spec: `docs/superpowers/specs/2026-07-11-issue-5-phase-1-ascii-render-design.md`.

**Goal:** Ship the canonical `CircuitSpec` DTO + a deterministic ASCII circuit renderer, entirely in `jqapi-core`, zero deps.

## Global constraints
- Pure Java 21; no new runtime dependency; all in `jqapi-core`.
- New packages: `org.aitan.jqapi.visualization` (mapper + renderer), `.visualization.spec` (DTO), `.visualization.render` (renderer).
- Deterministic renderer output (`\n`, `Locale.ROOT`, fixed iteration order) for golden-master tests.
- Existing suite incl. `QuantumRegisterGoldenMasterTest` stays green. No `Co-Authored-By` trailer.

## Tasks

### Task 1 — DTO
- Create `spec/{GateKind,CircuitSpec,LevelSpec,GateSpec,ComplexCell}.java` (records + enum).
- Test `visualization/CircuitSpecDtoTest`: record construction/equality; `GateKind` has a constant for every gate label (sanity vs `Constants`).
- Commit.

### Task 2 — `CircuitSpecs.toCircuit` (lossless build)
- `CircuitSpecs.toCircuit(CircuitSpec)`: per level → `CircuitLevel`, switch on `GateKind` → concrete gate (`RX→Rx(theta,…)`, `CNOT→ControlledNot(controls[0],targets[0])`, `MULTI_CONTROLLED→MultiControlled(matrix,controls.size(),controls++targets)`, `ORACLE→Oracle(matrix,idx)`, `GENERIC→GenericGate(matrix,size,idx)`, `MEASUREMENT/RESET/IDENTITY` handled), `circuit.addLevel(level)`.
- Test: build a Bell spec + a parametric/CNOT spec; `toCircuit` → `LocalSimulator.execute()` → `getRegisterState()` equals the API-built circuit's state (tolerance). Commit.

### Task 3 — `CircuitSpecs.toSpec` (best-effort reflect-back)
- Map `getType()`→`GateKind`; fixed-arity controlled gates split `getIndexes()` into controls/targets; parametric + `MultiControlled` degrade to `GENERIC` (matrix + indexes as targets), documented.
- Test: `toSpec` of API-built non-lossy circuit → expected kinds/controls/targets; lossy gate → `GENERIC`. Commit.

### Task 4 — `AsciiCircuitRenderer`
- `draw(CircuitSpec)`, `draw(Circuit)` (via `toSpec`), `print`. Grid wire×level; glyphs (`[H]`, `●`, `⊕`, `×`, `│`, `┼`, `──`); unicode + `asciiOnly` fallback; deterministic.
- Golden-master exact-string tests: single H, Bell/CNOT, multi-level multi-qubit, non-adjacent control/target, ascii fallback. Commit.

### Task 5 — Docs + verify + PR
- `docs/api/visualization.md` + README note.
- `mvn -B test` full suite green.
- Push branch, open PR (`Phase 1 of #5`, does NOT close #5).

## Verification
- Renderer: exact-string golden-master.
- Mapper: `toCircuit` state-vector equivalence vs API; `toSpec` kind/controls/targets assertions.
- Full suite + golden-master unchanged.
