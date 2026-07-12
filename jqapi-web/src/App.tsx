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
  const [version, setVersion] = useState(0); // bump to force canvas re-render
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

  const onQubits = (n: number) => {
    setNumQubits(n);
    modelRef.current.setNumQubits(n);
    setProbs(null);
    bump();
  };

  const onRun = () => {
    try {
      setError(null);
      setProbs(probabilities(run(modelRef.current.toSpec()).amplitudes));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="app">
      <h1>jqapi — circuit editor (MVP)</h1>
      <div className="toolbar">
        <QubitSelector value={numQubits} onChange={onQubits} />
        <GatePalette tool={tool} onSelect={setTool} />
        <button className="run" onClick={onRun}>
          Run
        </button>
      </div>
      {error && (
        <div className="error" role="alert" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      <CircuitCanvas model={modelRef.current} onCellClick={onCellClick} version={version} />
      <ResultsPanel probs={probs} numQubits={numQubits} />
    </div>
  );
}
