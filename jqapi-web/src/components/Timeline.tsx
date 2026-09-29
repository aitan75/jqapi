import { useEffect, useState } from 'react';
import { outcomeProbability } from '../model/results';
import type { TraceFrame } from '../wasm/types';
import type { Messages } from '../i18n';

export function Timeline({ frames, index, onChange, numQubits, messages }: { frames: TraceFrame[]; index: number; onChange: (index: number) => void; numQubits: number; messages: Messages }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || index >= frames.length - 1) return;
    const timer = window.setTimeout(() => onChange(index + 1), 700);
    return () => window.clearTimeout(timer);
  }, [playing, index, frames, onChange]);
  const frame = frames[index];
  const next = frames[index + 1];
  const navigate = (value: number) => { setPlaying(false); onChange(value); };
  const measurement = frame.gate?.kind === 'MEASUREMENT' ? frame.gate : null;
  const q = measurement?.targets[0] ?? 0;
  const outcome = measurement ? (measurement.classicalTarget === undefined ? (outcomeProbability(frame.amplitudes, numQubits, q, 1) > 0.5 ? 1 : 0) : frame.classicalRecords[measurement.classicalTarget]) : 0;
  const probability = measurement && index > 0 ? outcomeProbability(frames[index - 1].amplitudes, numQubits, q, outcome) : 0;
  return <section className="timeline" aria-label={messages.live.timeline}>
    <h3>{messages.live.timeline}</h3>
    <div className="timeline-controls">
      <button onClick={() => navigate(0)} disabled={index === 0}>{messages.live.reset}</button>
      <button onClick={() => navigate(index - 1)} disabled={index === 0}>{messages.live.previous}</button>
      <button onClick={() => { if (index === frames.length - 1) { onChange(0); setPlaying(true); } else setPlaying(!playing); }} disabled={frames.length < 2}>{playing && index < frames.length - 1 ? messages.live.pause : messages.live.play}</button>
      <button onClick={() => navigate(index + 1)} disabled={index === frames.length - 1}>{messages.live.next}</button>
      <input type="range" aria-label={messages.live.timeline} min="0" max={frames.length - 1} value={index} onChange={(event) => navigate(Number(event.target.value))} />
      <output>{index} / {frames.length - 1}</output>
    </div>
    <div className="frame-description" aria-live="polite">
      <p>{frame.gate ? `${frame.gate.kind} · q${frame.gate.targets.join(', q')}` : messages.live.initial}{!frame.applied && ` · ${messages.live.skipped}`}</p>
      {measurement && <p data-testid="measurement-outcome">{messages.live.post}: q{q} · {messages.live.outcome} {outcome}, p = {probability.toFixed(4)}</p>}
      {next?.gate?.kind === 'MEASUREMENT' && <p>{messages.live.pre}: q{next.gate.targets.join(', q')}</p>}
    </div>
  </section>;
}
