import { blochFromAngles, fidelityPure, reducedBloch } from '../model/results';
import type { TraceFrame } from '../wasm/types';
import type { Messages } from '../i18n';

export function TeleportationGuide({ theta, phi, onAngles, frame, messages }: { theta: number; phi: number; onAngles: (theta: number, phi: number) => void; frame?: TraceFrame; messages: Messages }) {
  const input = blochFromAngles(theta, phi);
  const bob = frame ? reducedBloch(frame.amplitudes, 3, 2) : null;
  const vector = (v: typeof input) => `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
  return <section className="teleportation-guide" aria-label={messages.live.guide}>
    <h3>{messages.live.guide}</h3>
    <div className="guide-angles"><label>θ<input type="number" step="0.05" value={theta} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) onAngles(value, phi); }} /></label><label>φ<input type="number" step="0.05" value={phi} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) onAngles(theta, value); }} /></label></div>
    <ol>{messages.live.guideSteps.map((step, i) => <li key={step} aria-current={frame?.level === i ? 'step' : undefined}>{step}</li>)}</ol>
    <p>{messages.live.input}: {vector(input)}</p>
    {bob && <><p>{messages.live.bob}: {vector(bob)}</p><p>{messages.live.fidelity}: <output data-testid="teleportation-fidelity">{(fidelityPure(input, bob) * 100).toFixed(6)}%</output></p></>}
    <p data-testid="classical-outcomes">c0 = {frame && frame.level >= 5 ? frame.classicalRecords[0] : '—'}, c1 = {frame && frame.level >= 6 ? frame.classicalRecords[1] : '—'}</p>
    <p>{messages.live.communication}</p>
  </section>;
}
