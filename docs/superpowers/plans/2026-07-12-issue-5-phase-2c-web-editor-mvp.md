# MVP visual circuit editor (`jqapi-web`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A minimal Vite + React + TypeScript web app that draws a small circuit on a grid, runs it through the vendored Phase 2b WASM bridge, and shows outcome probabilities — closing issue #5 end-to-end. Everything else → a follow-up FEATURE issue.

**Architecture:** Standalone `jqapi-web/` npm module (not in the Maven reactor). The Phase 2b TeaVM output `jqapi.js` is vendored under `src/wasm/` and wrapped by a typed `bridge.ts`. A pure-TS model builds a `CircuitSpec` (Phase 2a JSON) from the grid; the bridge runs it; a results module derives probabilities. React + react-konva render palette, canvas, selector, and results.

**Tech Stack:** Vite, React 18, TypeScript 5, react-konva + konva, Vitest. No runtime backend. The vendored `jqapi.js` is produced by the Phase 2b build (`JAVA_HOME=…/openjdk@21 mvn -f jqapi-wasm/pom.xml -B clean package`).

## Global Constraints

- **Standalone module** `jqapi-web/`; its own npm build; NOT wired into Maven. Root CI unaffected.
- **Minimal, pinned deps.** `.npmrc` with `ignore-scripts=true`; committed `package-lock.json`; install via `npm ci --ignore-scripts`. Runtime deps limited to `react`, `react-dom`, `react-konva`, `konva`; dev deps to Vite/TS/Vitest tooling only. No new dependency for anything a few lines cover.
- **Gate set:** `H`, `X`, `Z`, `CNOT` only. **Grid:** qubits `1..min(8, MAX_QUBITS)` (MAX_QUBITS = 8 for the MVP UI), 8 fixed columns. **Results:** probability bars only.
- **Wire format** = Phase 2a `CircuitSpec` JSON, unchanged. `toSpec()` output must round-trip through the bridge.
- No Playwright E2E (deferred). Tests are Vitest unit tests. No `Co-Authored-By` trailer.
- The follow-up FEATURE issue (full gate set, raw amplitudes, save/load, URL, undo/redo, zoom/pan, dynamic grid, automated build wiring, CSP + SCA in CI) is opened at MVP merge.

---

### Task 1: Scaffold `jqapi-web` + vendored WASM bridge (verified interop)

**Files:**
- Create: `jqapi-web/` (Vite react-ts scaffold: `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`)
- Create: `jqapi-web/.npmrc`
- Create: `jqapi-web/src/wasm/jqapi.js` (vendored Phase 2b output)
- Create: `jqapi-web/src/wasm/bridge.ts`
- Create: `jqapi-web/src/wasm/types.ts`
- Create: `jqapi-web/src/wasm/bridge.test.ts`
- Create: `jqapi-web/README.md` (how to regenerate `jqapi.js`)

**Interfaces:**
- Produces: `bridge.run(spec: CircuitSpec): RunResult` where
  `CircuitSpec = { version: number; numQubits: number; levels: { gates: Gate[] }[] }`,
  `Gate = { kind: string; targets: number[]; controls: number[]; params: Record<string, number> }`,
  `RunResult = { amplitudes: { re: number; im: number }[] }`.
- Consumes: the vendored `jqapi.js` (`exports.run(specJson: string): string`).

- [ ] **Step 1: Scaffold the app.**
```bash
cd jqapi-web-parent-dir   # the repo root
npm create vite@latest jqapi-web -- --template react-ts
cd jqapi-web
printf 'ignore-scripts=true\n' > .npmrc
npm install --ignore-scripts
npm install --ignore-scripts react-konva konva
npm install --ignore-scripts -D vitest
```
Add a `test` script to `package.json`: `"test": "vitest run"`.

- [ ] **Step 2: Vendor the Phase 2b bridge output.**
```bash
# from repo root, with the Phase 2b module present:
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  mvn -f jqapi-wasm/pom.xml -B clean package
cp jqapi-wasm/target/js/jqapi.js jqapi-web/src/wasm/jqapi.js
```
Document these two commands in `jqapi-web/README.md` as the regeneration procedure. The artifact is a CommonJS module exposing `exports.run(specJson) -> resultJson`.

- [ ] **Step 3: Write the typed bridge + types.**

`src/wasm/types.ts`:
```ts
export interface Gate {
  kind: string;
  targets: number[];
  controls: number[];
  params: Record<string, number>;
}
export interface Level { gates: Gate[]; }
export interface CircuitSpec { version: number; numQubits: number; levels: Level[]; }
export interface Amplitude { re: number; im: number; }
export interface RunResult { amplitudes: Amplitude[]; }
```

`src/wasm/bridge.ts`:
```ts
import type { CircuitSpec, RunResult } from './types';
// Vendored TeaVM (Phase 2b) CommonJS module; esbuild/Vite provides the default interop.
import jqapi from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
export function run(spec: CircuitSpec): RunResult {
  const out = (jqapi as { run(json: string): string }).run(JSON.stringify(spec));
  return JSON.parse(out) as RunResult;
}
```
If the default import does not expose `run` (CJS interop shape), fall back to `import * as jqapi from './jqapi.js'` — the Step 4 test decides.

- [ ] **Step 4: Write the interop test (the riskiest thing, verified first).**

`src/wasm/bridge.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { run } from './bridge';
import type { CircuitSpec } from './types';

const bell: CircuitSpec = {
  version: 1, numQubits: 2, levels: [
    { gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] },
    { gates: [{ kind: 'CNOT', targets: [1], controls: [0], params: {} }] },
  ],
};

describe('wasm bridge', () => {
  it('runs a Bell circuit and returns 4 amplitudes matching 1/√2 on |00> and |11>', () => {
    const { amplitudes } = run(bell);
    expect(amplitudes).toHaveLength(4);
    const inv = 1 / Math.sqrt(2);
    expect(amplitudes[0].re).toBeCloseTo(inv, 9);
    expect(amplitudes[3].re).toBeCloseTo(inv, 9);
    expect(amplitudes[1].re).toBeCloseTo(0, 9);
    expect(amplitudes[2].re).toBeCloseTo(0, 9);
  });
});
```

- [ ] **Step 5: Run the test.** `cd jqapi-web && npm run test`
Expected: PASS. If it fails on the import shape, apply the Step 3 fallback and re-run. If it fails because the CommonJS artifact references Node-only globals in the jsdom/Vite environment, regenerate the artifact as an ES module (`<jsModuleType>ES2015</jsModuleType>` in `jqapi-wasm/pom.xml`, then re-copy) and adjust the import to named `import { run as wasmRun } from './jqapi.js'`.

- [ ] **Step 6: Commit.**
```bash
git add jqapi-web/
git commit -m "feat(web): scaffold jqapi-web + vendored WASM bridge with interop test (#5)"
```
(Confirm `jqapi-web/node_modules/` and `jqapi-web/dist/` are git-ignored — the Vite template adds a `.gitignore`; verify it covers both.)

---

### Task 2: Editor model — `toSpec()` and probabilities (pure TS, unit-tested)

**Files:**
- Create: `jqapi-web/src/model/circuit.ts`
- Create: `jqapi-web/src/model/circuit.test.ts`
- Create: `jqapi-web/src/model/results.ts`
- Create: `jqapi-web/src/model/results.test.ts`

**Interfaces:**
- Consumes: `CircuitSpec`, `Gate` (Task 1 `types.ts`), `Amplitude`.
- Produces:
  - `COLUMNS = 8`, `MAX_QUBITS = 8`.
  - `type Placement = { kind: 'H' | 'X' | 'Z' } | { kind: 'CNOT'; role: 'control' | 'target' }`.
  - `class CircuitModel` with `numQubits: number`, `place(qubit, step, placement)`, `clear(qubit, step)`, `setNumQubits(n)`, and `toSpec(): CircuitSpec`.
  - `probabilities(amps: Amplitude[]): number[]` and `basisLabel(index: number, numQubits: number): string`.

- [ ] **Step 1: Write the model tests.**

`src/model/circuit.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CircuitModel } from './circuit';

describe('CircuitModel.toSpec', () => {
  it('builds the Bell CircuitSpec from a drawn circuit', () => {
    const m = new CircuitModel(2);
    m.place(0, 0, { kind: 'H' });
    m.place(0, 1, { kind: 'CNOT', role: 'control' });
    m.place(1, 1, { kind: 'CNOT', role: 'target' });
    expect(m.toSpec()).toEqual({
      version: 1, numQubits: 2, levels: [
        { gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'CNOT', targets: [1], controls: [0], params: {} }] },
      ],
    });
  });

  it('drops empty columns and ignores incomplete CNOTs', () => {
    const m = new CircuitModel(2);
    m.place(0, 3, { kind: 'X' });
    m.place(0, 5, { kind: 'CNOT', role: 'control' }); // no target → ignored
    expect(m.toSpec()).toEqual({
      version: 1, numQubits: 2, levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
      ],
    });
  });
});
```

`src/model/results.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { probabilities, basisLabel } from './results';

describe('results', () => {
  it('computes probabilities as re^2 + im^2', () => {
    const inv = 1 / Math.sqrt(2);
    const p = probabilities([
      { re: inv, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: inv, im: 0 },
    ]);
    expect(p).toEqual([0.5, 0, 0, 0.5].map((x) => expect.closeTo(x, 9)));
  });
  it('labels basis states big-endian', () => {
    expect(basisLabel(1, 2)).toBe('|01⟩');
    expect(basisLabel(2, 2)).toBe('|10⟩');
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail.** `npm run test` → FAIL (modules missing).

- [ ] **Step 3: Implement `results.ts`.**
```ts
import type { Amplitude } from '../wasm/types';

/** Outcome probability of each basis state: |amplitude|² = re² + im². */
export function probabilities(amps: Amplitude[]): number[] {
  return amps.map((a) => a.re * a.re + a.im * a.im);
}

/** Big-endian computational-basis label, e.g. index 1 of 2 qubits → "|01⟩". */
export function basisLabel(index: number, numQubits: number): string {
  return '|' + index.toString(2).padStart(numQubits, '0') + '⟩';
}
```

- [ ] **Step 4: Implement `circuit.ts`.**
```ts
import type { CircuitSpec, Gate } from '../wasm/types';

export const COLUMNS = 8;
export const MAX_QUBITS = 8;

export type Placement =
  | { kind: 'H' | 'X' | 'Z' }
  | { kind: 'CNOT'; role: 'control' | 'target' };

/** Grid model: cells[qubit][step] holds a placement or null. */
export class CircuitModel {
  numQubits: number;
  private cells: (Placement | null)[][];

  constructor(numQubits: number) {
    this.numQubits = numQubits;
    this.cells = CircuitModel.emptyGrid(numQubits);
  }

  private static emptyGrid(n: number): (Placement | null)[][] {
    return Array.from({ length: n }, () => Array<Placement | null>(COLUMNS).fill(null));
  }

  setNumQubits(n: number): void {
    this.numQubits = n;
    this.cells = CircuitModel.emptyGrid(n); // MVP: resizing clears the grid
  }

  place(qubit: number, step: number, p: Placement): void {
    this.cells[qubit][step] = p;
  }

  clear(qubit: number, step: number): void {
    this.cells[qubit][step] = null;
  }

  cellAt(qubit: number, step: number): Placement | null {
    return this.cells[qubit][step];
  }

  /** Walk columns → levels (dropping empty ones), emitting gates in qubit order. */
  toSpec(): CircuitSpec {
    const levels: { gates: Gate[] }[] = [];
    for (let step = 0; step < COLUMNS; step++) {
      const gates: Gate[] = [];
      let controlQubit = -1;
      let targetQubit = -1;
      for (let q = 0; q < this.numQubits; q++) {
        const c = this.cells[q][step];
        if (!c) continue;
        if (c.kind === 'CNOT') {
          if (c.role === 'control') controlQubit = q;
          else targetQubit = q;
        } else {
          gates.push({ kind: c.kind, targets: [q], controls: [], params: {} });
        }
      }
      if (controlQubit >= 0 && targetQubit >= 0 && controlQubit !== targetQubit) {
        gates.push({ kind: 'CNOT', targets: [targetQubit], controls: [controlQubit], params: {} });
      }
      if (gates.length > 0) levels.push({ gates });
    }
    return { version: 1, numQubits: this.numQubits, levels };
  }
}
```

- [ ] **Step 5: Run the tests, verify they pass.** `npm run test` → PASS (bridge + model + results).

- [ ] **Step 6: Commit.**
```bash
git add jqapi-web/src/model/
git commit -m "feat(web): circuit model toSpec + probabilities with unit tests (#5)"
```

---

### Task 3: UI — palette, canvas, selector, results, Run

**Files:**
- Create: `jqapi-web/src/components/GatePalette.tsx`
- Create: `jqapi-web/src/components/QubitSelector.tsx`
- Create: `jqapi-web/src/components/CircuitCanvas.tsx`
- Create: `jqapi-web/src/components/ResultsPanel.tsx`
- Modify: `jqapi-web/src/App.tsx`
- Create/Modify: `jqapi-web/src/App.css` (minimal styling incl. probability bars)

**Interfaces:**
- Consumes: `CircuitModel`, `Placement`, `COLUMNS`, `MAX_QUBITS` (Task 2); `run` (Task 1); `probabilities`, `basisLabel` (Task 2).
- Produces: the assembled SPA (no exported API).

- [ ] **Step 1: `GatePalette`** — renders four selectable gate buttons (`H`, `X`, `Z`, `CNOT`); calls `onSelect(tool)` where `tool` is `'H' | 'X' | 'Z' | 'CNOT-control' | 'CNOT-target'`. The selected tool is the "brush" applied on canvas cell click (click-to-place is simpler and more reliable than HTML5 drag for the MVP; the spec's "drag-drop" is satisfied by click-to-place — note this simplification).

```tsx
type Tool = 'H' | 'X' | 'Z' | 'CNOT-control' | 'CNOT-target' | 'erase';
export function GatePalette({ tool, onSelect }: { tool: Tool; onSelect: (t: Tool) => void }) {
  const tools: Tool[] = ['H', 'X', 'Z', 'CNOT-control', 'CNOT-target', 'erase'];
  return (
    <div className="palette">
      {tools.map((t) => (
        <button key={t} className={t === tool ? 'selected' : ''} onClick={() => onSelect(t)}>
          {t === 'CNOT-control' ? '● (CNOT ctrl)' : t === 'CNOT-target' ? '⊕ (CNOT tgt)' : t === 'erase' ? '⌫' : t}
        </button>
      ))}
    </div>
  );
}
export type { Tool };
```

- [ ] **Step 2: `QubitSelector`** — number input clamped to `1..MAX_QUBITS`; `onChange(n)`.
```tsx
import { MAX_QUBITS } from '../model/circuit';
export function QubitSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className="qubits">
      Qubits:
      <input type="number" min={1} max={MAX_QUBITS} value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(MAX_QUBITS, Number(e.target.value) || 1)))} />
    </label>
  );
}
```

- [ ] **Step 3: `CircuitCanvas`** (react-konva) — draws `numQubits` horizontal wires × `COLUMNS` cells; clicking a cell applies the current tool (place gate / CNOT endpoint / erase). Renders placed gates: `H/X/Z` as a labelled box, CNOT control as a filled dot, CNOT target as ⊕, with a vertical connector when both endpoints exist in a column. Takes `model`, `tool`, and an `onCellClick(qubit, step)` callback; parent owns model mutation + re-render.

```tsx
import { Stage, Layer, Line, Rect, Text, Circle } from 'react-konva';
import { COLUMNS, CircuitModel } from '../model/circuit';

const CELL = 56, LABEL_W = 48;
export function CircuitCanvas({ model, onCellClick, version }:
  { model: CircuitModel; onCellClick: (q: number, s: number) => void; version: number }) {
  const width = LABEL_W + COLUMNS * CELL, height = model.numQubits * CELL;
  const rows = [];
  for (let q = 0; q < model.numQubits; q++) {
    const y = q * CELL + CELL / 2;
    rows.push(<Line key={`w${q}`} points={[LABEL_W, y, width, y]} stroke="#888" />);
    rows.push(<Text key={`l${q}`} x={4} y={y - 8} text={`q${q}`} />);
    for (let s = 0; s < COLUMNS; s++) {
      const x = LABEL_W + s * CELL + CELL / 2;
      const c = model.cellAt(q, s);
      rows.push(<Rect key={`c${q}-${s}`} x={x - CELL / 2 + 4} y={q * CELL + 4}
        width={CELL - 8} height={CELL - 8} stroke="#ddd"
        onClick={() => onCellClick(q, s)} onTap={() => onCellClick(q, s)} />);
      if (c && c.kind !== 'CNOT') {
        rows.push(<Rect key={`g${q}-${s}`} x={x - 16} y={y - 16} width={32} height={32}
          fill="#e8f0ff" stroke="#3366cc" onClick={() => onCellClick(q, s)} onTap={() => onCellClick(q, s)} />);
        rows.push(<Text key={`t${q}-${s}`} x={x - 6} y={y - 8} text={c.kind}
          onClick={() => onCellClick(q, s)} onTap={() => onCellClick(q, s)} />);
      } else if (c && c.kind === 'CNOT') {
        rows.push(c.role === 'control'
          ? <Circle key={`cc${q}-${s}`} x={x} y={y} radius={7} fill="#000" onClick={() => onCellClick(q, s)} onTap={() => onCellClick(q, s)} />
          : <Circle key={`ct${q}-${s}`} x={x} y={y} radius={12} stroke="#000" onClick={() => onCellClick(q, s)} onTap={() => onCellClick(q, s)} />);
      }
    }
  }
  // vertical CNOT connectors per column
  for (let s = 0; s < COLUMNS; s++) {
    let cy = -1, ty = -1;
    for (let q = 0; q < model.numQubits; q++) {
      const c = model.cellAt(q, s);
      if (c && c.kind === 'CNOT') { if (c.role === 'control') cy = q; else ty = q; }
    }
    if (cy >= 0 && ty >= 0) {
      const x = LABEL_W + s * CELL + CELL / 2;
      rows.push(<Line key={`cx${s}`} points={[x, cy * CELL + CELL / 2, x, ty * CELL + CELL / 2]} stroke="#000" />);
    }
  }
  return <Stage width={width} height={height} key={version}><Layer>{rows}</Layer></Stage>;
}
```

- [ ] **Step 4: `ResultsPanel`** — one labelled CSS bar per basis state.
```tsx
import { basisLabel } from '../model/results';
export function ResultsPanel({ probs, numQubits }: { probs: number[] | null; numQubits: number }) {
  if (!probs) return null;
  return (
    <div className="results">
      {probs.map((p, i) => (
        <div className="bar-row" key={i}>
          <span className="bar-label">{basisLabel(i, numQubits)}</span>
          <span className="bar"><span className="bar-fill" style={{ width: `${(p * 100).toFixed(1)}%` }} /></span>
          <span className="bar-val">{(p * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `App.tsx`** — compose everything; the current tool is the click brush; **Run** calls the bridge and derives probabilities; a try/catch shows an error banner.
```tsx
import { useRef, useState } from 'react';
import { CircuitModel } from './model/circuit';
import { probabilities } from './model/results';
import { run } from './wasm/bridge';
import { GatePalette, type Tool } from './components/GatePalette';
import { QubitSelector } from './components/QubitSelector';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ResultsPanel } from './components/ResultsPanel';
import './App.css';

export default function App() {
  const modelRef = useRef(new CircuitModel(2));
  const [tool, setTool] = useState<Tool>('H');
  const [version, setVersion] = useState(0);       // bump to force canvas re-render
  const [numQubits, setNumQubits] = useState(2);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bump = () => setVersion((v) => v + 1);

  const onCellClick = (q: number, s: number) => {
    const m = modelRef.current;
    if (tool === 'erase') m.clear(q, s);
    else if (tool === 'CNOT-control') m.place(q, s, { kind: 'CNOT', role: 'control' });
    else if (tool === 'CNOT-target') m.place(q, s, { kind: 'CNOT', role: 'target' });
    else m.place(q, s, { kind: tool });
    bump();
  };
  const onQubits = (n: number) => { setNumQubits(n); modelRef.current.setNumQubits(n); setProbs(null); bump(); };
  const onRun = () => {
    try { setError(null); setProbs(probabilities(run(modelRef.current.toSpec()).amplitudes)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="app">
      <h1>jqapi — circuit editor (MVP)</h1>
      <div className="toolbar">
        <QubitSelector value={numQubits} onChange={onQubits} />
        <GatePalette tool={tool} onSelect={setTool} />
        <button className="run" onClick={onRun}>Run</button>
      </div>
      {error && <div className="error" role="alert" onClick={() => setError(null)}>{error}</div>}
      <CircuitCanvas model={modelRef.current} onCellClick={onCellClick} version={version} />
      <ResultsPanel probs={probs} numQubits={numQubits} />
    </div>
  );
}
```

- [ ] **Step 6: `App.css`** — minimal layout + bar styles (`.bar` grey track, `.bar-fill` coloured width, `.palette button.selected` highlighted, `.error` red banner). Keep it small; no CSS framework.

- [ ] **Step 7: Verify build + tests.**
```bash
cd jqapi-web && npm run test && npx tsc --noEmit && npm run build
```
Expected: tests PASS, no type errors, `dist/` produced.

- [ ] **Step 8: Manual smoke (documented, not automated).**
`npm run dev`; set qubits = 2; place `H` on (q0, col0); place CNOT control on (q0, col1) and target on (q1, col1); click **Run**; confirm two ~50.0% bars on `|00⟩` and `|11⟩`.

- [ ] **Step 9: Commit.**
```bash
git add jqapi-web/src/ jqapi-web/src/App.css
git commit -m "feat(web): circuit editor UI (palette, canvas, results, run) (#5)"
```

---

## Verification

- Task 1: `bridge.test.ts` proves the vendored WASM runs a Bell circuit correctly inside the web toolchain (the riskiest integration, verified first).
- Task 2: `toSpec()` produces the exact Phase 2a Bell JSON; `probabilities()` correct.
- Task 3: `npm run test` green, `tsc --noEmit` clean, `npm run build` succeeds; manual smoke shows correct Bell probabilities.
- Closes issue #5 (MVP). A follow-up FEATURE issue captures the deferred scope.

## Notes / deliberate simplifications

- `ponytail:` click-to-place brush instead of HTML5 drag-and-drop — same result, far less event plumbing; real drag can be the follow-up issue.
- `ponytail:` vendored `jqapi.js`, regenerated manually (README) — automated Maven↔npm build is the follow-up issue.
- `ponytail:` changing qubit count clears the grid — avoids reflow/migration logic for the MVP.
