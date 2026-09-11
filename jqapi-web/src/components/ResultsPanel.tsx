import { basisLabel, formatAmplitude } from '../model/results';
import type { Amplitude } from '../wasm/types';

interface ResultsPanelProps {
  probs: number[] | null;
  amplitudes?: Amplitude[] | null;
  numQubits: number;
}

/**
 * Rich outcome probabilities & complex state vector visualization.
 */
export function ResultsPanel({ probs, amplitudes, numQubits }: ResultsPanelProps) {
  if (!probs || probs.length === 0) {
    return (
      <div className="results">
        <div className="results-header">
          <h2>State Amplitudes & Probabilities</h2>
        </div>
        <div className="results-empty">
          <span>Click <strong>Run</strong> to execute the circuit on the local WASM engine.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="results">
      <div className="results-header">
        <h2>
          <span className="live-dot" />
          State Vector & Outcome Probabilities
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {probs.length} basis states (2^{numQubits})
        </span>
      </div>

      <div className="results-grid">
        {probs.map((p, i) => {
          const pct = (p * 100).toFixed(1);
          const amp = amplitudes && amplitudes[i] ? formatAmplitude(amplitudes[i]) : null;
          return (
            <div className="bar-row" key={i} title={`State ${basisLabel(i, numQubits)}: ${pct}%`}>
              <span className="bar-label">{basisLabel(i, numQubits)}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="bar-val">{pct}%</span>
              {amp && <span className="bar-amplitude" title="Complex amplitude (re + im·i)">{amp}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
