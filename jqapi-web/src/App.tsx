import { useEffect, useRef, useState } from 'react';
import { CircuitModel } from './model/circuit';
import { probabilities } from './model/results';
import { run } from './wasm/bridge';
import type { Amplitude } from './wasm/types';
import type { Preset } from './model/presets';
import { GatePalette, type Tool } from './components/GatePalette';
import { QubitSelector } from './components/QubitSelector';
import { PresetSelector } from './components/PresetSelector';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ResultsPanel } from './components/ResultsPanel';
import { initialLanguage, LANGUAGE_STORAGE_KEY, messages, type Language } from './i18n';
import './App.css';

export default function App() {
  const modelRef = useRef(new CircuitModel(2));
  const [tool, setTool] = useState<Tool>('H');
  const [theta, setTheta] = useState<number>(Math.PI / 2);
  const [version, setVersion] = useState(0); // bump to force canvas re-render
  const [numQubits, setNumQubits] = useState(2);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [amplitudes, setAmplitudes] = useState<Amplitude[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = messages[language];
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const onCellClick = (q: number, s: number) => {
    const m = modelRef.current;
    if (tool === 'erase') {
      m.clear(q, s);
    } else if (tool === 'CNOT-control') {
      m.place(q, s, { kind: 'CNOT', role: 'control' });
    } else if (tool === 'CNOT-target') {
      m.place(q, s, { kind: 'CNOT', role: 'target' });
    } else if (tool === 'CZ-control') {
      m.place(q, s, { kind: 'CZ', role: 'control' });
    } else if (tool === 'CZ-target') {
      m.place(q, s, { kind: 'CZ', role: 'target' });
    } else if (tool === 'CY-control') {
      m.place(q, s, { kind: 'CY', role: 'control' });
    } else if (tool === 'CY-target') {
      m.place(q, s, { kind: 'CY', role: 'target' });
    } else if (tool === 'SWAP') {
      m.place(q, s, { kind: 'SWAP', role: 'swap' });
    } else if (tool === 'TOFFOLI-control') {
      m.place(q, s, { kind: 'TOFFOLI', role: 'control' });
    } else if (tool === 'TOFFOLI-target') {
      m.place(q, s, { kind: 'TOFFOLI', role: 'target' });
    } else if (tool === 'RX' || tool === 'RY' || tool === 'RZ') {
      m.place(q, s, { kind: tool, theta });
    } else {
      m.place(q, s, { kind: tool });
    }
    bump();
  };

  const onQubits = (n: number) => {
    setNumQubits(n);
    modelRef.current.setNumQubits(n);
    setProbs(null);
    setAmplitudes(null);
    bump();
  };

  const simulate = (model: CircuitModel) => {
    setError(null);
    const result = run(model.toSpec());
    if (!result.ok) {
      setProbs(null);
      setAmplitudes(null);
      setError(t.errors[result.error.code]);
      return;
    }
    setAmplitudes(result.amplitudes);
    setProbs(probabilities(result.amplitudes));
  };

  const onSelectPreset = (preset: Preset) => {
    setNumQubits(preset.qubits);
    const m = new CircuitModel(preset.qubits);
    preset.load(m);
    modelRef.current = m;
    setError(null);
    bump();

    simulate(m);
  };

  const onClearCircuit = () => {
    modelRef.current.reset();
    setProbs(null);
    setAmplitudes(null);
    setError(null);
    bump();
  };

  const onRun = () => {
    simulate(modelRef.current);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src="/favicon.svg" alt={t.logo} className="brand-logo" />
          <div className="brand-text">
            <h1>{t.appName}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>
        <div className="header-badges">
          <span className="badge active">{t.wasmEngine}</span>
          <span className="badge">{t.qubitCount(numQubits)}</span>
          <label className="language-selector">
            <span>{t.language}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              {Object.entries(t.languages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <PresetSelector onSelectPreset={onSelectPreset} onClearCircuit={onClearCircuit} messages={t} />

      <div className="toolbar">
        <div className="toolbar-left">
          <QubitSelector value={numQubits} onChange={onQubits} messages={t} />
          <GatePalette
            tool={tool}
            onSelect={setTool}
            theta={theta}
            onChangeTheta={setTheta}
            messages={t}
          />
        </div>
        <button className="run" onClick={onRun} title={t.runSimulation}>
          <span>▶</span> {t.runSimulation}
        </button>
      </div>

      {error && (
        <div className="error" role="alert" onClick={() => setError(null)} title={t.clickToDismiss}>
          <span>⚠️ {error}</span>
          <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>✕ {t.dismiss}</span>
        </div>
      )}

      <CircuitCanvas model={modelRef.current} onCellClick={onCellClick} version={version} messages={t} />
      <ResultsPanel probs={probs} amplitudes={amplitudes} numQubits={numQubits} messages={t} />
    </div>
  );
}
