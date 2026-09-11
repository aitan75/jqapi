import { basisLabel, formatAmplitude } from '../model/results';
import type { Amplitude } from '../wasm/types';
import type { Messages } from '../i18n';

interface ResultsPanelProps {
  probs: number[] | null;
  amplitudes?: Amplitude[] | null;
  numQubits: number;
  messages: Messages;
}

/**
 * Rich outcome probabilities & complex state vector visualization.
 */
export function ResultsPanel({ probs, amplitudes, numQubits, messages }: ResultsPanelProps) {
  if (!probs || probs.length === 0) {
    return (
      <div className="results">
        <div className="results-header">
          <h2>{messages.stateAmplitudesAndProbabilities}</h2>
        </div>
        <div className="results-empty">
          <span>{messages.runToSeeResults}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="results">
      <div className="results-header">
        <h2>
          <span className="live-dot" />
          {messages.stateVectorAndOutcomeProbabilities}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {messages.basisStates(probs.length, numQubits)}
        </span>
      </div>

      <div className="results-grid">
        {probs.map((p, i) => {
          const pct = (p * 100).toFixed(1);
          const amp = amplitudes && amplitudes[i] ? formatAmplitude(amplitudes[i]) : null;
          return (
            <div className="bar-row" key={i} title={messages.stateProbability(basisLabel(i, numQubits), pct)}>
              <span className="bar-label">{basisLabel(i, numQubits)}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="bar-val">{pct}%</span>
              {amp && <span className="bar-amplitude" title={messages.complexAmplitude}>{amp}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
