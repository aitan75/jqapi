import { useEffect, useRef, useState } from 'react';
import { CircuitModel, PAULI_X_MATRIX, type EditorState, type Placement } from './model/circuit';
import { probabilities } from './model/results';
import { run } from './wasm/bridge';
import type { Amplitude, CircuitSpec, ComplexMatrix } from './wasm/types';
import type { Preset } from './model/presets';
import { GatePalette, type Tool } from './components/GatePalette';
import { QubitSelector } from './components/QubitSelector';
import { PresetSelector } from './components/PresetSelector';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ResultsPanel } from './components/ResultsPanel';
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
  return { kind: tool };
}

function specFromHash(): CircuitSpec | null {
  const value = new URLSearchParams(location.hash.slice(1)).get('circuit');
  return value ? JSON.parse(atob(value)) as CircuitSpec : null;
}

export default function App() {
  const modelRef = useRef(new CircuitModel(2));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<Tool | null>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [phi, setPhi] = useState(0);
  const [lambda, setLambda] = useState(0);
  const [matrixText, setMatrixText] = useState(DEFAULT_MATRIX);
  const [version, setVersion] = useState(0);
  const [numQubits, setNumQubits] = useState(2);
  const [columns, setColumns] = useState(modelRef.current.columns);
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [amplitudes, setAmplitudes] = useState<Amplitude[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [now, setNow] = useState(() => new Date());
  const text = messages[language];
  const bump = () => setVersion((value) => value + 1);

  const syncModel = () => {
    setNumQubits(modelRef.current.numQubits);
    setColumns(modelRef.current.columns);
    setProbs(null);
    setAmplitudes(null);
    bump();
  };
  const mutate = (change: (model: CircuitModel) => void) => {
    setUndoStack((history) => [...history.slice(-49), modelRef.current.snapshot()]);
    setRedoStack([]);
    change(modelRef.current);
    syncModel();
  };
  const loadSpec = (spec: CircuitSpec) => {
    modelRef.current = CircuitModel.fromSpec(spec);
    setUndoStack([]);
    setRedoStack([]);
    syncModel();
  };

  useEffect(() => {
    try {
      const shared = specFromHash();
      if (shared) loadSpec(shared);
    } catch {
      setError('The shared circuit URL is invalid.');
    }
  }, []);

  useEffect(() => { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); }, [language]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const place = (qubit: number, step: number, selected = tool) => {
    if (!selected) return;
    try {
      const placement = placementFor(selected, theta, phi, lambda, matrixText);
      mutate((model) => placement ? model.place(qubit, step, placement) : model.clear(qubit, step));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const move = (fromQubit: number, fromStep: number, toQubit: number, toStep: number) => {
    if (fromQubit === toQubit && fromStep === toStep) return;
    const placement = modelRef.current.cellAt(fromQubit, fromStep);
    if (!placement) return;
    if (modelRef.current.cellAt(toQubit, toStep)) {
      setError('Choose an empty wire position before moving a gate.');
      return;
    }
    mutate((model) => {
      model.clear(fromQubit, fromStep);
      model.place(toQubit, toStep, placement);
    });
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
    modelRef.current = model;
    setUndoStack([]);
    setRedoStack([]);
    syncModel();
  };
  const onRun = () => {
    try {
      setError(null);
      const result = run(modelRef.current.toSpec());
      if (!result.ok) {
        setError(text.errors[result.error.code]);
        return;
      }
      setAmplitudes(result.amplitudes);
      setProbs(probabilities(result.amplitudes));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  const save = () => {
    const spec = modelRef.current.toSpec();
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jqapi-circuit.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        loadSpec(JSON.parse(String(reader.result)) as CircuitSpec);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load circuit JSON.');
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="app">
      <header className="header"><div className="brand"><img src="/favicon.svg" alt={text.logo} className="brand-logo" /><div className="brand-text"><h1>{text.appName}</h1><p>{text.appSubtitle}</p></div></div><div className="header-badges"><span className="badge active">{text.wasmEngine}</span><span className="badge">{text.qubitCount(numQubits)}</span><label className="language-selector">{text.language}<select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(text.languages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label></div></header>
      <div className="editor-layout">
        <aside className="sidebar">
          <div className="circuit-settings"><QubitSelector messages={text} value={numQubits} onChange={(value) => mutate((model) => model.setNumQubits(value))} /><div className="editor-actions"><button type="button" onClick={() => mutate((model) => model.setColumns(model.columns - 1))} disabled={columns <= 1}>− step</button><span>{columns} steps</span><button type="button" onClick={() => mutate((model) => model.setColumns(model.columns + 1))}>+ step</button></div></div>
          <GatePalette messages={text} tool={tool} onSelect={setTool} theta={theta} phi={phi} lambda={lambda} matrixText={matrixText} onChangeTheta={setTheta} onChangePhi={setPhi} onChangeLambda={setLambda} onChangeMatrixText={setMatrixText} />
          <PresetSelector messages={text} onSelectPreset={onSelectPreset} />
        </aside>
        <main className="workspace">
          {error && <div className="error" role="alert" onClick={() => setError(null)}><span>⚠️ {error}</span><span>✕ Dismiss</span></div>}
          <CircuitCanvas messages={text} model={modelRef.current} onCellClick={place} onDropCell={place} onMoveCell={move} onRemoveCell={(qubit, step) => mutate((model) => model.clear(qubit, step))} version={version} zoom={zoom} onZoom={setZoom} />
          <div className="circuit-actions" role="toolbar" aria-label={text.circuitActions}>
            <button className="run" type="button" onClick={onRun}>▶ {text.runSimulation}</button>
            <button type="button" onClick={undo} disabled={!undoStack.length}>{text.undo}</button>
            <button type="button" onClick={redo} disabled={!redoStack.length}>{text.redo}</button>
            <button type="button" onClick={save}>{text.saveJson}</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>{text.loadJson}</button>
            <button type="button" className="clear-circuit" onClick={() => mutate((model) => model.reset())}>{text.clearCircuit}</button>
            <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) loadFile(file); event.currentTarget.value = ''; }} />
          </div>
          <ResultsPanel messages={text} probs={probs} amplitudes={amplitudes} numQubits={numQubits} />
        </main>
      </div>
      <footer className="footer"><time dateTime={now.toISOString()}>{text.systemTime}: {now.toLocaleTimeString(language === 'it' ? 'it-IT' : 'en-GB')}</time></footer>
    </div>
  );
}
