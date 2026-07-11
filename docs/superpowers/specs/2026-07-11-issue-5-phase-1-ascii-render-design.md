# Design — Issue #5 Phase 1: CircuitSpec DTO + ASCII renderer (MVP)

- **Issue:** #5 (bidirectional visual circuit tool) — Phase 1 of 5. See the approved multi-phase architecture (PO backlog + software-architect ADRs).
- **Date:** 2026-07-11
- **Status:** Approved (design)

## Goal

Ship the MVP of direction (A) "see your circuit" plus the **canonical serializable model** that all later phases build on — entirely inside `jqapi-core`, zero runtime dependencies, no module split yet.

## Scope (Phase 1)

- A purpose-built immutable **`CircuitSpec` DTO** (records) as the canonical circuit representation.
- A **mapper** `CircuitSpecs`: `toCircuit(spec)` (lossless build) and `toSpec(circuit)` (best-effort reflect-back).
- A deterministic **`AsciiCircuitRenderer`**: `draw(CircuitSpec)` + `draw(Circuit)` convenience + `print`.
- Tests (golden-master exact-string + mapper equivalence) and docs.

**Out of Phase 1:** graphical (SVG/PNG) render, JSON save/load, editor GUI, module split, exports, and lossless parameter reflect-back (deferred to the accessor-enabler phase).

## Why a DTO (not the runtime `Gate`)

The runtime model is **lossy**: parametric gates discard their angles, `MultiControlled` discards `numControls`+base, nothing is `Serializable`. So the `Circuit` cannot be the source of truth. The DTO carries type + params + controls/targets + matrix explicitly. (#52 already made `getType()` constant-driven and unique, so type→`GateKind` mapping in `toSpec` is now reliable.)

## Design

### DTO — new package `org.aitan.jqapi.visualization.spec`
```java
public enum GateKind { H, X, Y, Z, S, T, CNOT, CZ, CY, SWAP, CSWAP, TOFFOLI,
                       RX, RY, RZ, PHASE, U3, MULTI_CONTROLLED, ORACLE, GENERIC,
                       MEASUREMENT, RESET, IDENTITY }
public record CircuitSpec(int version, int numQubits, List<LevelSpec> levels) {}
public record LevelSpec(List<GateSpec> gates) {}
public record GateSpec(GateKind kind, List<Integer> targets, List<Integer> controls,
                       Map<String,Double> params, ComplexCell[][] matrix) {}
public record ComplexCell(double re, double im) {}
```
- `controls` explicit (controls-first = most-significant, per convention); `targets` the acted-on wires. `getIndexes()` at build = `controls ++ targets`.
- `params` holds `theta`/`phi`/`lambda` for RX/RY/RZ/PHASE/U3. `matrix` non-null only for `GENERIC`/`ORACLE`/`MULTI_CONTROLLED` base.
- `version` for forward-compatible save/load (later phase).

### Mapper `CircuitSpecs` (in `org.aitan.jqapi.visualization`)
- **`toCircuit(CircuitSpec)` — lossless**: for each `LevelSpec` build a `CircuitLevel`, switch on `kind` to construct the concrete gate (e.g. `RX → new Rx(params.theta, targets…)`, `CNOT → new ControlledNot(controls[0], targets[0])`, `MULTI_CONTROLLED → new MultiControlled(matrix, controls.size(), controls++targets…)`, `GENERIC/ORACLE → new GenericGate/Oracle(matrix, …)`); `IDENTITY` omitted (Circuit auto-pads). Then `circuit.addLevel(level)`.
- **`toSpec(Circuit)` — best-effort reflect-back**: map `getType()`→`GateKind` (reliable post-#52). For non-parametric, fixed-arity gates (CNOT/CZ/CY/Toffoli/CSwap/Swap and single-qubit), split `getIndexes()` into controls/targets by the kind's known arity. For **lossy** kinds where the object can't be recovered — parametric angles unknown, and `MultiControlled` control-count unknown — degrade to `kind=GENERIC` carrying `matrix=getMatrix()` and `targets=getIndexes()`, so the spec stays renderable/executable. Documented degradation; becomes lossless in the accessor phase.

### `AsciiCircuitRenderer` (in `org.aitan.jqapi.visualization.render`)
- Consumes `CircuitSpec`. Grid: one wire-row per qubit (`q0:` … labels), one column block per level; spacer rows for vertical connectors.
- Glyphs: single-qubit → boxed label (`[H]`); controls → `●`, targets → `⊕` (CNOT) / `×` (Swap) / boxed label (others); connectors `│`, crossings `┼`; `Identity` → plain wire `──`.
- `draw(Circuit)` convenience calls `toSpec` first.
- **Deterministic**: fixed iteration order (levels in order; gates by min index), `\n` newlines, `Locale.ROOT`, no hashing in output; unicode default with an `asciiOnly` fallback (`● → *`, `⊕ → (+)`, `× → X`, box unchanged).

## Testing

- **Renderer golden-master (exact string):** single gate (H on q0), Bell/CNOT, multi-level multi-qubit, non-adjacent control/target, single-qubit gate replicated on several wires, and the `asciiOnly` fallback. Assert the exact multiline string.
- **Mapper equivalence:** `toCircuit(spec)` run through `LocalSimulator` yields the same `getRegisterState()` as the equivalent API-built circuit (physics oracle); JSON round-trip is out of Phase 1, but `spec.equals(spec)` structural checks and `toCircuit`↔API equivalence are in.
- **Reflect-back:** `toSpec` of API-built non-lossy circuits produces the expected kinds/controls/targets; lossy gates degrade to `GENERIC` (asserted).
- Existing suite incl. golden-master stays green.

## Acceptance criteria (Phase 1)

- [ ] `CircuitSpec`/`LevelSpec`/`GateSpec`/`ComplexCell`/`GateKind` in `org.aitan.jqapi.visualization.spec` (immutable records, zero-dep).
- [ ] `CircuitSpecs.toCircuit` builds a `Circuit` equivalent (same state vector) to the API-built one; `toSpec` reflects back (best-effort, documented degradation).
- [ ] `AsciiCircuitRenderer.draw(CircuitSpec)`/`draw(Circuit)`/`print` render deterministically; single-qubit, controlled/multi-qubit, non-adjacent, and Identity cases correct; unicode + `asciiOnly`.
- [ ] Golden-master renderer tests + mapper-equivalence tests pass; existing suite unchanged.
- [ ] `docs/api/visualization.md` + README note; entirely in `jqapi-core`, no new dependency.

## Out of scope / next phases

Parameter-recovery accessors (lossless reflect-back), reactor module split, SVG/PNG, JSON save/load, Swing editor, QASM/quantikz export.
