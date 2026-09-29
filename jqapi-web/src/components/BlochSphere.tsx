import { useState } from 'react';
import { reducedBloch, type BlochVector } from '../model/results';
import type { Amplitude } from '../wasm/types';
import type { Messages } from '../i18n';

// Orthographic camera with all three axes visible; a unit sphere remains circular.
function project(v: BlochVector): [number, number] {
  return [85 * (v.x - v.y) / Math.sqrt(2), 85 * ((v.x + v.y) / Math.sqrt(6) - v.z * Math.sqrt(2 / 3))];
}

export function BlochSphere({ amplitudes, numQubits, messages }: { amplitudes: Amplitude[]; numQubits: number; messages: Messages }) {
  const [selected, setSelected] = useState(0);
  const q = Math.min(selected, numQubits - 1);
  const vector = reducedBloch(amplitudes, numQubits, q);
  const length = Math.hypot(vector.x, vector.y, vector.z);
  const [x, y] = project(vector);
  const axes = [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }];
  const equator = Array.from({ length: 65 }, (_, i) => project({ x: Math.cos(i * Math.PI / 32), y: Math.sin(i * Math.PI / 32), z: 0 }).join(',')).join(' ');
  return <section className="bloch-sphere" aria-label={messages.live.bloch}>
    <h3>{messages.live.bloch}</h3>
    <label>{messages.live.qubit} <select value={q} onChange={(event) => setSelected(Number(event.target.value))}>{Array.from({ length: numQubits }, (_, i) => <option key={i} value={i}>q{i}</option>)}</select></label>
    <svg viewBox="-115 -110 230 220" role="img" aria-label={`r = (${vector.x.toFixed(3)}, ${vector.y.toFixed(3)}, ${vector.z.toFixed(3)})`}>
      <circle r="85" fill="rgba(56,189,248,0.06)" stroke="#47718a" />
      <polyline points={equator} fill="none" stroke="#47718a" strokeDasharray="3 3" />
      {axes.map((axis, i) => { const [ax, ay] = project(axis); return <g key={i}><line x1={-ax} y1={-ay} x2={ax} y2={ay} stroke="#60859a" /><text x={ax * 1.2} y={ay * 1.2} fill="currentColor" fontSize="12">{['X', 'Y', 'Z'][i]}</text></g>; })}
      <line x1="0" y1="0" x2={x} y2={y} stroke="#00f0ff" strokeWidth="3" />
      <circle cx={x} cy={y} r="4" fill="#00f0ff" />
    </svg>
    <output>r = ({vector.x.toFixed(3)}, {vector.y.toFixed(3)}, {vector.z.toFixed(3)})</output>
    <p>{length < 1 - 1e-9 ? messages.live.mixed : messages.live.pure} · |r| = {length.toFixed(3)} · {messages.live.purity}: {((1 + length * length) / 2).toFixed(3)}</p>
  </section>;
}
