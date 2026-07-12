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

## Scope

MVP gate set: `H`, `X`, `Z`, `CNOT`; 1–8 qubits; 8 fixed columns; probability
bars. The full gate set, raw amplitudes, save/load, URL sharing, undo/redo,
zoom/pan, and automated build wiring are tracked in the follow-up FEATURE issue.
