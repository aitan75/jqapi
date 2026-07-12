import { basisLabel } from '../model/results';

/** One labelled probability bar per basis state; hidden until the first run. */
export function ResultsPanel({ probs, numQubits }: { probs: number[] | null; numQubits: number }) {
  if (!probs) return null;
  return (
    <div className="results">
      <h2>Outcome probabilities</h2>
      {probs.map((p, i) => (
        <div className="bar-row" key={i}>
          <span className="bar-label">{basisLabel(i, numQubits)}</span>
          <span className="bar">
            <span className="bar-fill" style={{ width: `${(p * 100).toFixed(1)}%` }} />
          </span>
          <span className="bar-val">{(p * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
