import { amplitudeMagnitude, basisLabel, blochVector, formatAmplitude, phaseRadians } from '../model/results';
import type { Amplitude } from '../wasm/types';
import type { Messages } from '../i18n';

interface ResultsPanelProps {
  probs: number[] | null;
  amplitudes?: Amplitude[] | null;
  sampled?: { shots: number; counts: number[] } | null;
  numQubits: number;
  messages: Messages;
}

/**
 * Rich outcome probabilities & complex state vector visualization.
 */
export function ResultsPanel({ probs, amplitudes, sampled, numQubits, messages }: ResultsPanelProps) {
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

  const vector = numQubits === 1 && amplitudes ? blochVector(amplitudes) : null;

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
          const amplitude = amplitudes?.[i];
          const amp = amplitude ? formatAmplitude(amplitude) : null;
          const phase = amplitude ? phaseRadians(amplitude) : null;
          return (
            <div className="bar-row" key={i} tabIndex={0} title={messages.stateProbability(basisLabel(i, numQubits), pct)}>
              <span className="bar-label">{basisLabel(i, numQubits)}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="bar-val">{pct}%</span>
              {amp && <span className="bar-amplitude" title={messages.complexAmplitude}>{amp}</span>}
              {amplitude && <div className="amplitude-tooltip" role="tooltip" aria-label={messages.complexAmplitude}>
                <div><span>|cᵢ|</span><strong>{amplitudeMagnitude(amplitude).toFixed(3)}</strong></div>
                <div><span>θ</span><strong>{phase === null ? '—' : `${phase.toFixed(3)} ${messages.radians} · ${(phase * 180 / Math.PI).toFixed(1)}°`}</strong></div>
                {vector ? <div className="bloch-vector"><svg viewBox="-1 -1 2 2" aria-hidden="true"><circle cx="0" cy="0" r="0.9" /><line x1="0" y1="0" x2={vector.x} y2={-vector.y} /><circle cx={vector.x} cy={-vector.y} r="0.11" /></svg><span>r⃗ = ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}, {vector.z.toFixed(2)})</span></div> : <div className="bloch-vector unavailable">r⃗ = —</div>}
              </div>}
            </div>
          );
        })}
      </div>
      {sampled && <section className="sampled-results" aria-label={messages.observedOutcomes(sampled.shots)}>
        <h3>{messages.observedOutcomes(sampled.shots)}</h3>
        <div className="results-grid">
          {sampled.counts.map((count, i) => {
            const pct = (count / sampled.shots * 100).toFixed(1);
            return <div className="sample-row" key={i}>
              <span className="bar-label">{basisLabel(i, numQubits)}</span>
              <div className="bar-container"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
              <span className="bar-val">{pct}%</span>
              <span className="sample-count">{messages.count}: {count}</span>
            </div>;
          })}
        </div>
      </section>}
    </div>
  );
}
