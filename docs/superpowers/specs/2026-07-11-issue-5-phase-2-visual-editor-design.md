# Issue #5 Phase 2 — Interactive visual circuit editor (Option C: web + WASM) — Design

> Direction B of #5: a browser-based drag-and-drop quantum circuit editor with
> best-in-class UX that builds a `Circuit`, runs it, and shows results — with
> **zero backend**. Follows Phase 1 (CircuitSpec DTO + ASCII renderer, merged in
> PR #53).

## Goal

Let a user draw a quantum circuit on a grid (qubit wires × time-step levels),
run it through jqapi's `LocalSimulator`, and see the results — entirely in the
browser, with the simulator compiled from `jqapi-core` to WebAssembly. Reuse
`CircuitSpec` (Phase 1) as the single shared representation for rendering,
building, running, save/load, and URL-sharing.

## Decision (ADR summary)

Chosen: **Option C — web frontend + `jqapi-core` compiled to WASM via TeaVM, no
server.** Considered and rejected: JavaFX/Compose desktop (UX not best-in-class
for interactive editing; user explicitly rejected Swing/AWT-class desktop UI) and
web + Java backend (introduces an untrusted-input-to-simulator trust boundary —
server-side `2^n` DoS, insecure deserialization, CORS/auth — all avoided by
running the simulator client-side).

**Why C wins:** it delivers the interactive web UX the project wants *and*
eliminates the entire CRITICAL server-side risk family (no endpoint exists). The
`2^n` blow-up can only ever cost the user their own browser tab. Consistent with
jqapi's zero-runtime-dependency, security-conscious ethos.

**Residual risks (accepted, mitigated):**
- npm client-side supply chain (npm is under active worm attacks) → `npm ci
  --ignore-scripts`, pinned lockfile, `osv-scanner` + Socket in CI, pinned
  registry in `.npmrc`.
- TeaVM maturity + single-threaded browser runtime → the WASM build forces the
  sequential simulator path (see Compatibility below).

## Architecture & module split

```
jqapi-core   (Java 21, ZERO runtime deps — UNCHANGED apart from the addition below)
  └─ + CircuitSpec JSON (de)serialization: zero-dep, TeaVM-safe, with hard
       validation at the parse boundary.                         ← Phase 2a
jqapi-wasm   (build module: TeaVM compiles jqapi-core + a thin JS-facing bridge
             to WASM/JS. Exposes run(specJson) -> resultsJson.)  ← Phase 2b
jqapi-web    (React + TypeScript SPA using react-konva for the canvas editor;
             its own npm build. Contains ALL UI/npm dependencies.) ← Phase 2c
```

`jqapi-core` stays pure and zero-dependency; every UI/npm dependency is confined
to `jqapi-web`. The reactor structure keeps the published library artifact free
of any editor dependency.

## Data flow & contract

`CircuitSpec` serialized to **JSON** is the only interface crossing the JS↔Java
boundary, and the same format used for save/load and URL-sharing.

```
[React UI + react-konva] user drags gates onto the grid
   → builds a CircuitSpec (JS object) → JSON string
   → [WASM bridge] jqapi.run(specJson)
       → Java: parse+validate JSON → CircuitSpec → CircuitSpecs.toCircuit
       → LocalSimulator.execute() → measurement/amplitude results → JSON
   → [React UI] renders state / measurement outcomes
```

No network endpoint, no untrusted network input, no server to operate. Save =
serialize CircuitSpec to JSON (download / localStorage / URL fragment); load =
parse JSON back into the editor model.

## CircuitSpec JSON format (Phase 2a)

Round-trippable, versioned by `CircuitSpec.version`. Illustrative Bell circuit:

```json
{
  "version": 1,
  "numQubits": 2,
  "levels": [
    { "gates": [ { "kind": "H", "targets": [0], "controls": [], "params": {} } ] },
    { "gates": [ { "kind": "CNOT", "targets": [1], "controls": [0], "params": {} } ] }
  ]
}
```

- `params` present only for parametric kinds (`theta`/`phi`/`lambda`).
- `matrix` present only for `GENERIC`/`ORACLE`/`MULTI_CONTROLLED`, as a nested
  array of `{"re":…,"im":…}` cells.
- Serialization lives in `jqapi-core` as a small hand-rolled reader/writer (no
  JSON dependency — keeps the zero-dep guarantee and stays within TeaVM's
  supported `java.*` subset). `ponytail:` hand-rolled JSON, swap for a lib only
  if the format grows beyond CircuitSpec.

### Validation at the parse boundary (defense in depth)

Even client-side, `fromJson` rejects malformed/oversized specs so a bad file or
URL cannot crash the tab or corrupt simulator invariants (controls from the
security review):

- `0 < numQubits ≤ JQAPIConfig.maxQubits`;
- gate count ≤ a configured ceiling;
- every control/target index in `[0, numQubits)`, controls and targets disjoint;
- matrix (when present) is `2^k × 2^k` for `k = targets.size()`, entries finite
  (reject `NaN`/`Inf`);
- unknown `kind` / missing required fields → typed error, not a silent default.

Full unitarity checking (O(N³)) is out of scope; noted, not enforced.

## Frontend (Phase 2c)

- **React + TypeScript**, **react-konva** for the canvas: one row per qubit wire,
  one column per level, gates snap to grid cells.
- Palette of gates (single-qubit, controlled, parametric with an angle input,
  measurement/reset); drag from palette to cell; place controls/targets for
  multi-qubit gates; non-adjacent control/target wiring.
- Interactions: drag-drop, snap-to-grid, add/remove level & qubit, undo/redo,
  zoom/pan. UX reference: Quirk (Apache-2.0).
- **Run** button → WASM bridge → results panel (measurement counts / state
  amplitudes). Save/Load (JSON file + localStorage) and shareable URL.
- Load an API-built circuit: import a `CircuitSpec` JSON produced elsewhere
  (secondary feature; `CircuitSpecs.toSpec` fidelity from Phase 1 suffices —
  lossless reflect-back remains a later, optional enhancement).

## Compatibility notes (TeaVM)

- No reflection/JNI/native in `jqapi-core` (verified — only `getClass()` in an
  `equals`).
- `QuantumRegister` uses `ForkJoinPool` + parallel streams (issue #8). The
  browser WASM runtime is single-threaded, so the WASM build injects a
  sequential executor via `JQAPIConfig` (the parallel path is already
  config-gated). Fine for editor-scale circuits (≤ ~16 qubits, as Quirk).
- Confirm `jqapi-core` uses only TeaVM-supported `java.*` packages during 2b;
  the core is pure math + collections, so this is expected to hold.

## Security / supply-chain plan

- `jqapi-core` / `jqapi-wasm`: Maven chain, already covered (Maven `--strict-checksums`
  from #23, gitleaks). Add SCA (`osv-scanner`) + SAST (CodeQL, already present).
- `jqapi-web`: `npm ci --ignore-scripts`, committed pinned `package-lock.json`,
  `osv-scanner` + Socket scan in CI, `.npmrc` with pinned registry and
  `ignore-scripts=true`. CSP on the served SPA; no inline eval.
- `CircuitSpec` validation (above) is the client-side trust boundary.

## Phasing (each sub-phase → its own implementation plan)

- **2a — CircuitSpec JSON (de)serialization in `jqapi-core`.** Zero-dep,
  TeaVM-safe, hard validation, round-trip + golden-JSON tests. Small, isolated,
  no UI. *This branch starts here.*
- **2b — TeaVM WASM build + JS bridge.** New `jqapi-wasm` module; `run(specJson)
  → resultsJson`; sequential executor; smoke test that a Bell spec run in WASM
  matches the JVM result.
- **2c — React + react-konva editor.** The interactive UI, run, results,
  save/load/URL, and the frontend security controls.

## Testing strategy

- 2a: JSON round-trip (`spec == fromJson(toJson(spec))`), exact golden-JSON
  strings, and validation rejections (each rule) — mirrors Phase 1's approach.
- 2b: cross-check WASM `run` output against the JVM `LocalSimulator` for a set of
  fixture circuits.
- 2c: component tests for the editor→CircuitSpec mapping (drawn circuit equals
  the API-built one) and E2E happy-path (draw Bell → run → correlated results).

## Out of scope (Phase 2)

Lossless reflect-back accessors, SVG/PNG export, quantikz/QASM export,
collaborative editing, and any server component.
