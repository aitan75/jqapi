import { basisLabel, phaseRadians, probabilities } from '../model/results';
import type { Amplitude } from '../wasm/types';
import type { Messages } from '../i18n';

export function StateHeatmap({ amplitudes, numQubits, messages }: { amplitudes: Amplitude[]; numQubits: number; messages: Messages }) {
  const probs = probabilities(amplitudes);
  return <section className="state-heatmap" aria-label={messages.live.heatmap}>
    <h3>{messages.live.heatmap}</h3>
    <div className="heatmap-grid">{amplitudes.map((amp, i) => {
      const phase = phaseRadians(amp);
      const hue = phase === null ? 0 : (phase + Math.PI) / (2 * Math.PI) * 360;
      const label = `${basisLabel(i, numQubits)} · p = ${(probs[i] * 100).toFixed(2)}% · φ = ${phase === null ? '—' : phase.toFixed(3)}`;
      return <div key={i} className="heatmap-cell" tabIndex={0} title={label} aria-label={label} style={{ background: `hsl(${hue} ${phase === null ? 0 : 75}% ${8 + 42 * Math.sqrt(probs[i])}%)` }}><span>{basisLabel(i, numQubits)}</span><span>{(probs[i] * 100).toFixed(1)}%</span><span>φ {phase === null ? '—' : phase.toFixed(2)}</span></div>;
    })}</div>
    <p className="phase-legend">{messages.live.legend}</p><p>{messages.live.phaseNote}</p>
  </section>;
}
