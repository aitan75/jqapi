# Issue #5 Phase 2c — MVP visual circuit editor (`jqapi-web`) — Design

> MVP of the browser editor: draw a circuit on a grid, run it through the
> Phase 2b WASM bridge, see the outcome probabilities. Deliberately minimal —
> the smallest vertical slice that closes issue #5 end-to-end. Everything else
> goes to a follow-up FEATURE issue.

## Goal

A zero-backend web app that lets a user pick a qubit count, drag a small set of
gates onto a circuit grid, press **Run**, and see the measurement-outcome
probabilities — reusing `CircuitSpec` JSON (Phase 2a) as the wire format and the
TeaVM-compiled simulator (Phase 2b) as the engine.

## Scope (MVP)

- **Gates:** `H`, `X`, `Z` (single-qubit) and `CNOT` (control + target). Nothing
  parametric, no measurement/reset, no multi-control, no matrices.
- **Grid:** qubit count selectable `1..min(8, maxQubits)`; **8 fixed** time-step
  columns. No dynamic add/remove of wires or columns.
- **Run:** builds a `CircuitSpec`, calls the vendored WASM bridge synchronously,
  renders results.
- **Results:** per basis state, a CSS probability bar (`|amplitude|²`). No raw
  amplitude view.

## Out of scope → follow-up FEATURE issue

Other gates (parametric `RX/RY/RZ/U3/PHASE`, `SWAP`, multi-control, oracle/
matrix, measurement/reset), raw-amplitude results view, save/load, URL sharing,
undo/redo, zoom/pan, dynamic add/remove of qubits/columns, automated Maven↔npm
build wiring, CSP + `osv-scanner`/Socket supply-chain scanning in CI, and the
Playwright E2E happy-path.

## Decision (ADR summary)

- **Vite + React + TypeScript + react-konva.** Matches the Phase 2 design spec's
  frontend direction; react-konva gives a canvas grid with drag-and-drop without
  hand-rolling SVG. Chosen over plain SVG/DOM (more manual for canvas interaction)
  and over a heavier framework (unnecessary for an MVP).
- **WASM integration = vendored artifact (approach A).** The Phase 2b TeaVM
  output `jqapi.js` is copied into `jqapi-web/src/wasm/` and wrapped by a typed
  `bridge.ts`. No cross-toolchain Maven↔npm build. Chosen over `frontend-maven-plugin`
  wiring (couples npm to the Maven lifecycle; more CI surface) and an npm package
  (overkill). `ponytail:` manual regeneration of the vendored artifact; automate
  in the follow-up issue.
- **Standalone npm module,** not in the Maven reactor. Root CI is unaffected.

## Architecture & module split

```
jqapi-web/                     (Vite + React + TS SPA; its own npm build)
  src/
    wasm/jqapi.js              vendored Phase 2b TeaVM output (CommonJS)
    wasm/bridge.ts             typed wrapper: run(spec) -> ResultJson
    model/circuit.ts           editor state + toSpec(): CircuitSpec JSON
    model/results.ts           probabilities(amplitudes): number[]
    components/GatePalette.tsx  drag sources for H, X, Z, CNOT
    components/CircuitCanvas.tsx react-konva grid; drop gates into cells
    components/QubitSelector.tsx number input 1..min(8, maxQubits)
    components/ResultsPanel.tsx  CSS probability bars per basis state
    App.tsx                     layout + Run button + error banner
  .npmrc                       ignore-scripts=true, pinned registry
  package.json / package-lock.json  minimal pinned deps
  README.md                    how to regenerate the vendored jqapi.js
```

Each unit has one responsibility and a clear interface: the model produces the
`CircuitSpec` JSON (testable without React), the bridge is the only thing that
touches WASM, and the components are presentational over the model.

## Data flow & contract

```
[GatePalette] drag gate → [CircuitCanvas] drop into cell[qubit][step]
   → [model.circuit] holds the grid; toSpec() → CircuitSpec JSON (Phase 2a format)
   → [bridge.run(json)] vendored WASM → {"amplitudes":[{"re":…,"im":…}, …]}
   → [model.results] probabilities = amplitudes.map(a => a.re² + a.im²)
   → [ResultsPanel] one bar per basis state |q…⟩
```

No network, no server. The `CircuitSpec` JSON produced by `toSpec()` is exactly
the Phase 2a format; the same validation runs inside the WASM `run`.

### Wire format (produced by `toSpec()`, consumed by the bridge)

```json
{"version":1,"numQubits":2,"levels":[
  {"gates":[{"kind":"H","targets":[0],"controls":[],"params":{}}]},
  {"gates":[{"kind":"CNOT","targets":[1],"controls":[0],"params":{}}]}
]}
```

Each grid column becomes one `LevelSpec` (empty columns are dropped). A cell
holds `H`/`X`/`Z` (single target = its qubit) or one end of a `CNOT` (control on
one row, target on another, same column).

## Components

- **`model/circuit.ts`** — `numQubits`, a `cells` structure keyed by
  `(qubit, step)`, and mutators (place/remove a gate, set a CNOT control/target,
  set qubit count). `toSpec(): CircuitSpec` walks columns→levels, dropping empty
  columns and emitting gates in row order. Pure TS, no React — unit-tested.
- **`model/results.ts`** — `probabilities(amplitudes)` → `number[]` of
  `re²+im²`; and a basis-state label helper (`|00⟩`, `|01⟩`, …). Pure, tested.
- **`wasm/bridge.ts`** — imports the vendored `jqapi.js` (whose `run` takes a
  JSON **string** and returns a JSON **string**), and exposes a typed
  `run(spec: CircuitSpec): { amplitudes: {re:number; im:number}[] }` that
  `JSON.stringify`s the spec on the way in and `JSON.parse`s the result on the
  way out. `CircuitSpec` here is a TS interface mirroring the Phase 2a JSON.
  Errors thrown by the Java bridge surface as JS exceptions.
- **`GatePalette`** — buttons/draggables for H, X, Z, CNOT.
- **`CircuitCanvas`** (react-konva) — draws qubit wires (rows) × 8 step columns;
  accepts drops; renders placed gates; CNOT drawn as control dot + target ⊕ with
  a vertical connector.
- **`QubitSelector`** — number input clamped to `1..min(8, maxQubits)` (maxQubits
  is a constant mirrored from the core default, 24 → clamped to 8 here).
- **`ResultsPanel`** — a labelled CSS bar per basis state; hidden until first Run.
- **`App`** — composes the above; **Run** calls `bridge.run(model.toSpec())`,
  routes the result to `ResultsPanel`, and shows any thrown error in a banner.

## Error handling

- CNOT placement UI forbids control == target and requires both endpoints in the
  same column before the gate is emitted; incomplete CNOTs are ignored by
  `toSpec()`.
- `bridge.run` may still throw (defensive: bad spec / limits). `App` wraps the
  call in try/catch and shows the message in a dismissible banner; the editor
  state is untouched.

## Testing strategy (MVP)

- **Vitest unit tests** (no framework beyond Vitest):
  - `model.toSpec()`: a drawn Bell circuit (H on q0 col0, CNOT q0→q1 col1) equals
    the golden `CircuitSpec` JSON above.
  - `model.results.probabilities()`: known amplitudes → expected probabilities
    (Bell → `[0.5, 0, 0, 0.5]`).
- No Playwright E2E in the MVP (deferred).
- Manual smoke: `npm run dev`, draw Bell, Run, see two ~50% bars.

## Security / supply-chain (MVP baseline)

Minimal, pinned dependency set (`react`, `react-dom`, `react-konva`, `konva`,
plus Vite/TS/Vitest dev deps); committed `package-lock.json`; `.npmrc` with
`ignore-scripts=true`; install via `npm ci --ignore-scripts`. Full CSP and
`osv-scanner`/Socket CI scanning are deferred to the follow-up issue (documented
there), consistent with the Phase 2 design's supply-chain plan.

## Follow-up FEATURE issue (to open at MVP merge)

Title: *Visual editor — full gate set & editor polish (follow-up to #5 phase 2c)*.
Contents: the full "Out of scope" list above, so the MVP can close #5 promptly.
