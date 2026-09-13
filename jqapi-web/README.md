# jqapi-web — MVP circuit editor

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
`run(specJson) -> resultJson`. `src/wasm/bridge.ts` is the typed wrapper.

Regenerate it when the bridge or core changes (requires JDK 21 — TeaVM 0.12.0
does not run under newer JDKs):

```bash
# from the repository root
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  mvn -f jqapi-wasm/pom.xml -B clean package
cp jqapi-wasm/target/js/jqapi.js jqapi-web/src/wasm/jqapi.js
```

## Editor features

The palette supports single-qubit, parametric (`RX`, `RY`, `RZ`, `PHASE`, `U3`),
controlled, swap, multi-control, measurement/reset, oracle and generic 2×2
matrix gates. Circuits support drag-and-drop or click placement, dynamic wires
and columns, undo/redo, zoom/pan, JSON/local-storage save-load and shareable URL
fragments. Results show probabilities and complex amplitudes.

`npm run test:e2e` runs the Playwright Bell-circuit smoke test (install Chromium
once with `npx playwright install chromium`). CI rebuilds the TeaVM asset before
the web checks and verifies that the committed bridge is current.
The gate palette is grouped by arity (single, two, three, and multi-qubit), while the algorithms are in a separate menu. Both menu structures support English and Italian.
The desktop editor keeps those menus in a left sidebar, with the circuit, actions, and results in the central workspace; the footer displays the current system time.
