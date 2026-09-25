# jqapi-web — quantum circuit editor

A zero-backend Vite + React + TypeScript app: draw a small quantum circuit on a
grid, run it through the vendored WebAssembly/JS simulator bridge (Phase 2b),
and see the outcome probabilities. Issue #5 phase 2c.

## Develop

```bash
npm ci --ignore-scripts
npm run dev      # dev server
npm run test     # vitest unit tests
npm run build    # type-check + production build
```

## Languages

The editor supports English and Italian. Select the language from the header;
the browser saves the choice locally. All user-visible copy lives in
`src/i18n.ts`, including gate labels, tooltips, preset descriptions, and result
messages.

Simulation errors use stable codes from the WASM bridge and are translated by
the same catalog; raw Java exception messages are never displayed in the UI.

## Vendored WASM bridge

`src/wasm/jqapi.js` is the TeaVM output of the `jqapi-wasm` module (Phase 2b),
committed here (approach A — no Maven↔npm build wiring). It exposes
`run(specJson) -> resultJson` and `sample(specJson, shots) -> resultJson`; sampling returns measured outcome counts for 1–10,000 independent shots. `expectation(specJson, observableJson)` and `sampleExpectation(specJson, observableJson, shots)` return exact and shot-based ⟨H⟩ for a Pauli-sum observable ([format and error codes](../docs/api/simulator.md#browser-bridge-expectation-exports)). `src/wasm/bridge.ts` is the typed wrapper; `src/wasm/jqapi.d.ts` declares the exports by hand.

Regenerate it when the bridge or core changes (requires JDK 25 — TeaVM 0.15
runs under JDK 25 only):

```bash
# from the repository root
JAVA_HOME=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home \
  mvn -f jqapi-wasm/pom.xml -B clean package
cp jqapi-wasm/target/js/jqapi.js jqapi-web/src/wasm/jqapi.js
```

## Editor features

The multi-qubit palette includes an exact forward QFT macro. Select its contiguous register width, then drop it on that register's most-significant wire. The editor inserts the Hadamard, controlled-phase, and swap decomposition and shifts later gates to preserve circuit order.

The palette supports single-qubit, parametric (`RX`, `RY`, `RZ`, `PHASE`, `U3`),
controlled, swap, multi-control, measurement/reset, oracle and generic 2×2
matrix gates. Drag a palette gate onto the grid to place it; dragging a placed
gate moves every component of that operation together, while dropping it outside
the grid removes it. Circuits support dynamic wires and columns, undo/redo,
zoom/pan, JSON/local-storage save-load and shareable URL fragments. Results show
theoretical probabilities, complete complex amplitudes, magnitude/phase/Bloch details, and observed counts with empirical probabilities for the selected number of shots.

The **Observable ⟨H⟩** panel evaluates a Hamiltonian inside **Run**. Enter one
term per line, `[coefficient] LABEL`, with one Pauli letter (`I`, `X`, `Y`, `Z`)
per qubit and q0 first, e.g. `0.5 ZZ`; at most 1024 terms. The panel shows the
exact value, the sampled value ± standard error with the total shots, and a
per-term table. Parse errors appear inline with their line number and never
block the circuit run; an empty panel leaves Run unchanged. Each value can fail
independently: circuits with measurement or reset have no exact value, a single
shot has no sampled estimate, and engine limits are reported in the panel rather
than in the global banner. Editing the circuit or the observable clears the
result. The observable is an execution input and is not saved in JSON or shared
links.

`npm run test:e2e` runs the Playwright Bell-circuit smoke test (install Chromium
once with `npx playwright install chromium`). CI rebuilds the TeaVM asset before
the web checks and verifies that the committed bridge is current.
The gate palette is grouped by arity (single, two, three, and multi-qubit), while the algorithms are in a separate menu. Both menu structures support English and Italian.
The desktop editor keeps those menus in a left sidebar, with the circuit, actions, and results in the central workspace; the footer displays the current system time.

## Security hardening

The 2026-09-16 audit (issue #103) hardened the editor's untrusted-input paths:

- **Shared-circuit URL fragments.** A decoded `#circuit=…` payload is passed
  through `isCircuitSpec` (`src/model/circuit.ts`) before it can build a
  `CircuitModel`. The same structural guard validates loaded JSON files, so a
  malformed or out-of-range spec is ignored and never reaches the WASM bridge as
  a trusted `CircuitSpec`. The guard checks the format version, shape, qubit
  bounds, unique and disjoint indexes, gate kinds, per-kind arity, `2^n × 2^n`
  matrices, and the level/gate limits (`MAX_LEVELS`/`MAX_GATES`).
- **Content-Security-Policy.** `index.html` keeps `'unsafe-inline'` for
  `style-src`. The editor relies on dynamic inline style attributes (gate-menu
  position and result-bar widths), which CSP nonces/hashes cannot cover because
  they apply to `<style>` elements rather than to style attributes. Removing it
  would require rendering those overlays with class-only styling; that refactor
  is the recorded follow-up for audit finding L-1.
