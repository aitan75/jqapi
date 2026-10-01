import { useEffect, useRef, useState } from 'react';
import { CircuitModel, isCircuitSpec, isUnsupportedCircuitSpec, PAULI_X_MATRIX, type EditorState, type Placement } from './model/circuit';
import { probabilities } from './model/results';
import { parseObservable } from './model/observable';
import { shotBudgets } from './model/budget';
import { startJob, type Job } from './wasm/client';
import { BROWSER_BUDGET } from './wasm/policy';
import { editableQasmSpec } from './model/qasm';
import type { CircuitSpec, ComplexMatrix, TraceFrame, EngineErrorCode, LintDiagnostic, LintResult, LintRule, QasmLintResult } from './wasm/types';
import type { Preset } from './model/presets';
import { GatePalette, type Tool } from './components/GatePalette';
import { QubitSelector } from './components/QubitSelector';
import { PresetSelector } from './components/PresetSelector';
import { CircuitCanvas } from './components/CircuitCanvas';
import { Timeline } from './components/Timeline';
import { TeleportationGuide } from './components/TeleportationGuide';
import { ResultsPanel } from './components/ResultsPanel';
import { ObservablePanel, type ObservableOutcome } from './components/ObservablePanel';
import { LintPanel } from './components/LintPanel';
import { QasmEditor } from './components/QasmEditor';
import { initialLanguage, LANGUAGE_STORAGE_KEY, messages, type Language } from './i18n';
import './App.css';

const DEFAULT_MATRIX = JSON.stringify(PAULI_X_MATRIX);

function parseMatrix(text: string): ComplexMatrix {
  // ponytail: matrix placement is 2×2 on one wire; add multi-wire matrix placement when that UI is needed.
  const matrix = JSON.parse(text) as ComplexMatrix;
  if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some((row) => !Array.isArray(row) || row.length !== 2 || row.some((cell) => !Number.isFinite(cell?.re) || !Number.isFinite(cell?.im)))) {
    throw new Error('Matrix must be a 2×2 JSON array of {"re": number, "im": number} cells.');
  }
  return matrix;
}

function placementFor(tool: Tool, theta: number, phi: number, lambda: number, matrixText: string): Placement | null {
  if (tool === 'erase') return null;
  if (tool === 'CNOT-control' || tool === 'CNOT-target') return { kind: 'CNOT', role: tool.endsWith('control') ? 'control' : 'target' };
  if (tool === 'CZ-control' || tool === 'CZ-target') return { kind: 'CZ', role: tool.endsWith('control') ? 'control' : 'target' };
  if (tool === 'CY-control' || tool === 'CY-target') return { kind: 'CY', role: tool.endsWith('control') ? 'control' : 'target' };
  if (tool === 'CSWAP-control' || tool === 'CSWAP-swap') return { kind: 'CSWAP', role: tool.endsWith('control') ? 'control' : 'swap' };
  if (tool === 'TOFFOLI-control' || tool === 'TOFFOLI-target') return { kind: 'TOFFOLI', role: tool.endsWith('control') ? 'control' : 'target' };
  if (tool === 'MCX-control' || tool === 'MCX-target') return { kind: 'MULTI_CONTROLLED', role: tool.endsWith('control') ? 'control' : 'target' };
  if (tool === 'SWAP') return { kind: 'SWAP', role: 'swap' };
  if (tool === 'RX' || tool === 'RY' || tool === 'RZ' || tool === 'PHASE') return { kind: tool, theta };
  if (tool === 'U3') return { kind: 'U3', theta, phi, lambda };
  if (tool === 'ORACLE' || tool === 'GENERIC') return { kind: tool, matrix: parseMatrix(matrixText) };
  if (tool === 'QFT') throw new Error('QFT is inserted as a circuit macro.');
  return { kind: tool };
}

function specFromHash(): CircuitSpec | 'unsupported' | null {
  const value = new URLSearchParams(location.hash.slice(1)).get('circuit');
  if (!value || value.length > BROWSER_BUDGET.maxInputChars) return null;
  try {
    const parsed: unknown = JSON.parse(atob(value));
    if (isUnsupportedCircuitSpec(parsed)) return 'unsupported';
    return isCircuitSpec(parsed) ? parsed : null;
  } catch {
    // A malformed base64/JSON fragment is ignored, never loaded.
    return null;
  }
}

export default function App() {
  const modelRef = useRef(new CircuitModel(2));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qasmInputRef = useRef<HTMLInputElement>(null);
  const traceJob = useRef<{ cancel: () => void } | null>(null);
  const countsJob = useRef<{ cancel: () => void } | null>(null);
  const transferJob = useRef<{ cancel: () => void } | null>(null);
  const transferRevision = useRef(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [phi, setPhi] = useState(0);
  const [lambda, setLambda] = useState(0);
  const [qftWidth, setQftWidth] = useState(2);
  const [matrixText, setMatrixText] = useState(DEFAULT_MATRIX);
  const [version, setVersion] = useState(0);
  const [numQubits, setNumQubits] = useState(2);
  const [executionSpec, setExecutionSpec] = useState<CircuitSpec>({ version: 1, numQubits: 2, levels: [] });
  const [columns, setColumns] = useState(modelRef.current.columns);
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);
  const [condition, setCondition] = useState('');
  const [seed, setSeed] = useState(1);
  const [live, setLive] = useState<{ frames: TraceFrame[]; columns: number[]; qubits: number; revision: number } | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [pending, setPending] = useState(true);
  const [liveError, setLiveError] = useState<EngineErrorCode | null>(null);
  const revision = useRef(0);
  const [guided, setGuided] = useState(false);
  const [guideAngles, setGuideAngles] = useState({ theta: Math.PI / 3, phi: Math.PI / 4 });
  const frame = live?.frames[frameIndex];
  const amplitudes = frame?.amplitudes ?? null;
  const probs = amplitudes ? probabilities(amplitudes) : null;
  const [sampled, setSampled] = useState<{ shots: number; counts: number[] } | null>(null);
  const [shots, setShots] = useState(1000);
  const [observableText, setObservableText] = useState('');
  const [observableOutcome, setObservableOutcome] = useState<ObservableOutcome | null>(null);
  const [error, setErrorState] = useState<{ message: string; detail?: string } | null>(null);
  const setError = (message: string | null, detail?: string) => setErrorState(message === null ? null : { message, detail });
  const [isRunning, setIsRunning] = useState(false);
  const [lint, setLint] = useState<{ diagnostics: LintDiagnostic[]; columns: number[]; version: number; spec: CircuitSpec } | null>(null);
  /** Last imported QASM and the circuit it produced; its barriers apply while the circuit is unchanged. */
  const importedQasm = useRef<{ source: string; spec: string } | null>(null);
  const [dismissedHints, setDismissedHints] = useState<ReadonlySet<string>>(new Set());
  const [disabledRules, setDisabledRules] = useState<ReadonlySet<LintRule>>(new Set());
  const [qasmText, setQasmText] = useState('');
  const lintControls = {
    disabledRules, dismissed: dismissedHints,
    onToggleRule: (rule: LintRule) => setDisabledRules((rules) => { const next = new Set(rules); if (!next.delete(rule)) next.add(rule); return next; }),
    onDismiss: (key: string) => setDismissedHints((keys) => new Set(keys).add(key)),
  };
  const [highlight, setHighlight] = useState<{ cells: { qubit: number; step: number }[]; version: number } | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [now, setNow] = useState(() => new Date());
  const text = messages[language];
  const bump = () => setVersion((value) => value + 1);
  // Empty text means "no observable"; errors are shown live and only skip the ⟨H⟩ part of Run.
  const parsedObservable = observableText.trim() ? parseObservable(observableText, numQubits) : null;
  const observableError = parsedObservable && 'code' in parsedObservable ? parsedObservable : null;
  const validObservable = parsedObservable && !('code' in parsedObservable) ? parsedObservable : null;
  const shotBudget = shotBudgets(executionSpec, validObservable);

  const stopWork = () => {
    traceJob.current?.cancel();
    countsJob.current?.cancel();
    transferJob.current?.cancel();
    transferRevision.current++;
    setIsRunning(false);
    setIsTransferring(false);
  };
  const cancelWork = () => {
    revision.current++;
    stopWork();
    setPending(false);
    setError(text.errors.CANCELLED);
  };
  const syncModel = () => {
    stopWork();
    setLive(null);
    setNumQubits(modelRef.current.numQubits);
    setExecutionSpec(modelRef.current.toSpec());
    setColumns(modelRef.current.columns);
    setCondition((value) => value && Number(value.split(':')[0]) >= modelRef.current.numQubits ? '' : value);
    revision.current++;
    setPending(true);
    setLiveError(null);
    setGuided(false);
    setSampled(null);
    setObservableOutcome(null);
    bump();
  };
  const mutate = (change: (model: CircuitModel) => boolean | void, keepGuide = false) => {
    const previous = modelRef.current.snapshot();
    try {
      if (change(modelRef.current) === false) return false;
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'INPUT_LIMIT_EXCEEDED' ? text.errors.INPUT_LIMIT_EXCEEDED : cause instanceof Error ? cause.message : String(cause));
      return false;
    }
    setUndoStack((history) => [...history.slice(-49), previous]);
    setRedoStack([]);
    syncModel();
    if (keepGuide) setGuided(true);
    return true;
  };
  const loadSpec = (spec: CircuitSpec) => {
    modelRef.current = CircuitModel.fromSpec(spec);
    setUndoStack([]);
    setRedoStack([]);
    syncModel();
  };

  useEffect(() => {
    // Structurally invalid shared-circuit fragments are ignored safely.
    const shared = specFromHash();
    if (shared === 'unsupported') setError(messages[initialLanguage()].errors.UNSUPPORTED_SPEC_VERSION);
    else if (shared) loadSpec(shared);
  }, []);

  useEffect(() => { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); }, [language]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const requestId = revision.current;
    const timer = window.setTimeout(async () => {
      if (requestId !== revision.current) return;
      const spec = modelRef.current.toSpec();
      const columns = [...modelRef.current.serializedColumns];
      const job = startJob({ kind: 'trace', spec, seed });
      traceJob.current = job;
      const result = await job.result;
      if (requestId !== revision.current) return;
      setPending(false);
      if (!result.ok) {
        setLiveError(result.error.code);
        setLive(null);
        return;
      }
      setLiveError(null);
      setLive({ frames: result.frames, columns, qubits: spec.numQubits, revision: requestId });
      setFrameIndex(result.frames.length - 1);
    }, 150);
    return () => { window.clearTimeout(timer); traceJob.current?.cancel(); };
  }, [version, seed]);

  useEffect(() => {
    // Each edit lints its own snapshot; cleanup drops results that arrive after the next edit.
    let current = true;
    const spec = modelRef.current.toSpec();
    const columns = [...modelRef.current.serializedColumns];
    const disabled = [...disabledRules];
    // Imported levels map 1:1 to editor levels, so source-only facts (barriers) stay valid until an edit.
    const source = importedQasm.current?.spec === JSON.stringify(spec) ? importedQasm.current.source : null;
    const job: Job<LintResult | QasmLintResult> = source === null
      ? startJob({ kind: 'lint', spec, disabledRules: disabled })
      : startJob({ kind: 'lintQasm', source, disabledRules: disabled });
    void job.result.then((result) => { if (current) setLint(result.ok ? { diagnostics: result.diagnostics, columns, version, spec } : null); });
    return () => { current = false; job.cancel(); };
  }, [version, disabledRules]);

  useEffect(() => () => {
    countsJob.current?.cancel();
    transferJob.current?.cancel();
  }, []);

  const rerun = () => {
    stopWork();
    revision.current++;
    setPending(true);
    setSeed((previous) => (previous + 0x6d2b79f5) | 0);
  };

  const place = (qubit: number, step: number, selected = tool) => {
    if (!selected) return;
    try {
      if (selected === 'QFT') {
        mutate((model) => model.insertForwardQft(qubit, step, qftWidth));
        return;
      }
      const placement = placementFor(selected, theta, phi, lambda, matrixText);
      if (placement && condition && ['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ', 'PHASE', 'U3'].includes(placement.kind)) {
        const [bitIndex, expected] = condition.split(':').map(Number);
        if (bitIndex < numQubits) Object.assign(placement, { condition: { bitIndex, expected } });
      }
      mutate((model) => placement ? model.place(qubit, step, placement) : model.removeGate(qubit, step));
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'INPUT_LIMIT_EXCEEDED' ? text.errors.INPUT_LIMIT_EXCEEDED : cause instanceof Error ? cause.message : String(cause));
    }
  };
  const move = (fromQubit: number, fromStep: number, toQubit: number, toStep: number) => {
    if (fromQubit === toQubit && fromStep === toStep) return;
    if (!mutate((model) => model.moveGate(fromQubit, fromStep, toQubit, toStep))) {
      setError('Choose an empty wire position before moving a gate.');
    }
  };
  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((history) => [...history, modelRef.current.snapshot()]);
    setUndoStack((history) => history.slice(0, -1));
    modelRef.current.restore(previous);
    syncModel();
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((history) => [...history, modelRef.current.snapshot()]);
    setRedoStack((history) => history.slice(0, -1));
    modelRef.current.restore(next);
    syncModel();
  };
  const onSelectPreset = (preset: Preset) => {
    const model = new CircuitModel(preset.qubits);
    preset.load(model);
    if (preset.id === 'teleportation') setGuideAngles({ theta: Math.PI / 3, phi: Math.PI / 4 });
    modelRef.current = model;
    setUndoStack([]);
    setRedoStack([]);
    syncModel();
    setGuided(preset.id === 'teleportation');
  };
  const onRun = async () => {
    if (isRunning) return;
    const requestId = revision.current;
    setError(null);
    setSampled(null);
    setObservableOutcome(null);
    setIsRunning(true);
    const job = startJob({ kind: 'counts', spec: modelRef.current.toSpec(), shots, observable: validObservable });
    countsJob.current = job;
    const result = await job.result;
    if (requestId !== revision.current || countsJob.current !== job) return;
    setIsRunning(false);
    if (!result.ok) { setError(text.errors[result.error.code]); return; }
    setSampled(result.sample);
    if (result.exact) {
      setObservableOutcome({
        exact: result.exact.ok ? result.exact : result.exact.error.code,
        sampled: result.estimate === null ? 'NEEDS_TWO_SHOTS' : result.estimate.ok ? result.estimate : result.estimate.error.code,
      });
    }
  };
  const download = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportQasmTo = async (deliver: (source: string) => void) => {
    transferJob.current?.cancel();
    const id = ++transferRevision.current;
    setIsTransferring(true);
    setError(null);
    const job = startJob({ kind: 'exportQasm', spec: modelRef.current.toSpec() });
    transferJob.current = job;
    const result = await job.result;
    if (id !== transferRevision.current) return;
    setIsTransferring(false);
    if (!result.ok) { setError(text.errors[result.error.code], result.error.detail); return; }
    deliver(result.source);
  };
  const saveQasm = () => exportQasmTo((source) => download(source, 'jqapi-circuit.qasm', 'text/plain'));
  const save = () => download(JSON.stringify(modelRef.current.toSpec(), null, 2), 'jqapi-circuit.json', 'application/json');
  /** Loads a file, or QASM text from the source editor. */
  const loadFile = async (file: File | string, qasm = false) => {
    transferJob.current?.cancel();
    const id = ++transferRevision.current;
    setIsTransferring(true);
    setError(null);
    try {
      if ((typeof file === 'string' ? file.length : file.size) > BROWSER_BUDGET.maxInputChars) throw new Error(text.errors.INPUT_LIMIT_EXCEEDED);
      const source = typeof file === 'string' ? file : await file.text();
      if (id !== transferRevision.current) return;
      let spec: CircuitSpec;
      if (qasm) {
        setQasmText(source);
        const job = startJob({ kind: 'importQasm', source });
        transferJob.current = job;
        const result = await job.result;
        if (id !== transferRevision.current) return;
        if (!result.ok) { setError(text.errors[result.error.code], result.error.detail); return; }
        try { spec = editableQasmSpec(result.spec); }
        catch { throw new Error(text.qasmUnsupported); }
      } else {
        const parsed: unknown = JSON.parse(source);
        if (isUnsupportedCircuitSpec(parsed)) throw new Error(text.errors.UNSUPPORTED_SPEC_VERSION);
        if (!isCircuitSpec(parsed)) throw new Error(text.errors.INVALID_CIRCUIT_SPEC);
        spec = parsed;
      }
      loadSpec(spec);
      importedQasm.current = qasm ? { source, spec: JSON.stringify(modelRef.current.toSpec()) } : null;
    } catch (cause) {
      if (id === transferRevision.current) setError(cause instanceof Error ? cause.message : text.errors.INVALID_CIRCUIT_SPEC);
    } finally {
      if (id === transferRevision.current) setIsTransferring(false);
    }
  };

  return (
    <div className="app">
      <header className="header"><div className="brand"><img src="/bloch-sphere.svg" alt={text.logo} className="brand-logo" /><div className="brand-text"><h1>{text.appName}</h1><p>{text.appSubtitle}</p></div></div><div className="header-badges"><span className="badge active">{text.wasmEngine}</span><span className="badge">{text.qubitCount(numQubits)}</span><label className="language-selector">{text.language}<select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(text.languages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label></div></header>
      <div className="editor-layout">
        <aside className="sidebar">
          <div className="circuit-settings"><QubitSelector messages={text} value={numQubits} onChange={(value) => mutate((model) => model.setNumQubits(value))} /><div className="editor-actions"><button type="button" onClick={() => mutate((model) => model.setColumns(model.columns - 1))} disabled={columns <= 1}>− step</button><span>{columns} steps</span><button type="button" onClick={() => mutate((model) => model.setColumns(model.columns + 1))}>+ step</button></div></div>
          <GatePalette condition={condition} numQubits={numQubits} onChangeCondition={setCondition} messages={text} tool={tool} onSelect={setTool} theta={theta} phi={phi} lambda={lambda} matrixText={matrixText} qftWidth={qftWidth} onChangeTheta={setTheta} onChangePhi={setPhi} onChangeLambda={setLambda} onChangeMatrixText={setMatrixText} onChangeQftWidth={(value) => setQftWidth(Math.max(1, Math.trunc(value) || 1))} />
          <PresetSelector messages={text} onSelectPreset={onSelectPreset} />
        </aside>
        <main className="workspace">
          {error && <div className="error" role="alert"><div><span>⚠️ {error.message}</span>{error.detail && <details><summary>{text.technicalDetails}</summary><p lang="en">{error.detail}</p></details>}</div><button type="button" onClick={() => setError(null)}>{text.dismiss}</button></div>}
          <CircuitCanvas highlights={highlight?.version === version ? highlight.cells : undefined} activeColumn={!pending && frame && live ? live.columns[frame.level] : undefined} messages={text} model={modelRef.current} onDropCell={place} onMoveCell={move} onRemoveGate={(qubit, step) => mutate((model) => model.removeGate(qubit, step))} version={version} zoom={zoom} onZoom={setZoom} isRunning={isRunning} />
          <div className="circuit-actions" role="toolbar" aria-label={text.circuitActions}>
            <label className="shots-input">{text.shots}<input type="number" aria-describedby="shot-budget" aria-invalid={shots > shotBudget.counts} min="1" max={BROWSER_BUDGET.maxShots} step="1" value={shots} onChange={(event) => setShots(Math.max(1, Math.min(BROWSER_BUDGET.maxShots, Math.trunc(Number(event.target.value) || 1))))} disabled={isRunning} /></label>
            <button className={`run${isRunning ? ' running' : ''}`} type="button" onClick={onRun} disabled={isRunning}>▶ {text.runSimulation}</button>
            {(isRunning || pending || isTransferring) && <button type="button" onClick={cancelWork}>{text.cancel}</button>}
            <button type="button" onClick={undo} disabled={!undoStack.length}>{text.undo}</button>
            <button type="button" onClick={redo} disabled={!redoStack.length}>{text.redo}</button>
            <button type="button" onClick={save}>{text.saveJson}</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>{text.loadJson}</button>
            <button type="button" onClick={saveQasm} disabled={isTransferring}>{text.saveQasm}</button>
            <button type="button" onClick={() => qasmInputRef.current?.click()} disabled={isTransferring}>{text.loadQasm}</button>
            <input ref={qasmInputRef} type="file" accept=".qasm,text/plain" aria-label={text.loadQasm} hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file, true); event.currentTarget.value = ''; }} />
            <button type="button" className="clear-circuit" onClick={() => mutate((model) => model.reset())}>{text.clearCircuit}</button>
            <input ref={fileInputRef} type="file" aria-label={text.loadJson} accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) loadFile(file); event.currentTarget.value = ''; }} />
          </div>
          <div id="shot-budget" className="shot-budget" role="status">
            <p>{text.shotBudgetHint(shotBudget.counts)}</p>
            {shotBudget.observable !== null && <p>{text.observableShotBudgetHint(shotBudget.observable)}</p>}
            {shots > shotBudget.counts ? <p className="budget-warning">{text.countsBudgetExceeded}</p>
              : shotBudget.observable !== null && shots >= 2 && shots > shotBudget.observable && <p className="budget-warning">{text.observableBudgetExceeded}</p>}
          </div>
          {lint?.version === version && <LintPanel title={text.lint.title} messages={text} names={Array.from({ length: numQubits }, (_, q) => `q${q}`)} diagnostics={lint.diagnostics} {...lintControls} spec={lint.spec}
            onShow={(d) => setHighlight({ version, cells: d.levels.flatMap((level) => d.qubits.map((qubit) => ({ qubit, step: lint.columns[level] }))) })} />}
          <QasmEditor messages={text} value={qasmText} onChange={setQasmText} busy={isTransferring} onApply={() => void loadFile(qasmText, true)} onFromCircuit={() => void exportQasmTo(setQasmText)} {...lintControls} />
          <details className="resource-policy"><summary>{text.resourceLimits}</summary><p>{text.resourcePolicy(BROWSER_BUDGET)}</p><p>{text.qasmCapabilities}</p></details>
          <section className="live-state" aria-label={text.live.title} aria-busy={pending}>
            <div className="live-toolbar"><h2>{text.live.title}</h2><button type="button" onClick={rerun} disabled={pending}>{text.live.rerun}</button><span>{text.live.seed}: {seed}</span></div>
            {pending && <p role="status">{text.live.pending}</p>}
            {liveError && <p role="alert">{text.errors[liveError]}</p>}
            {live && <fieldset disabled={pending}><Timeline key={live.revision} frames={live.frames} index={frameIndex} onChange={setFrameIndex} numQubits={live.qubits} messages={text} /></fieldset>}
            {guided && <TeleportationGuide theta={guideAngles.theta} phi={guideAngles.phi} frame={!pending ? frame : undefined} messages={text} onAngles={(theta, phi) => {
              if (mutate((model) => model.place(0, 0, { kind: 'U3', theta, phi, lambda: 0 }), true)) setGuideAngles({ theta, phi });
            }} />}
            <ResultsPanel messages={text} probs={probs} amplitudes={amplitudes} sampled={sampled} numQubits={live?.qubits ?? numQubits} />
          </section>
          <ObservablePanel messages={text} numQubits={numQubits} text={observableText} onChangeText={(value) => { setObservableText(value); setObservableOutcome(null); }} parseError={observableError} outcome={observableOutcome} disabled={isRunning} />
        </main>
      </div>
      <footer className="footer"><time dateTime={now.toISOString()}>{text.systemTime}: {now.toLocaleTimeString(language === 'it' ? 'it-IT' : 'en-GB')}</time></footer>
    </div>
  );
}
