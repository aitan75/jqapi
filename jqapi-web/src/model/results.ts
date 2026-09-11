import type { Amplitude } from '../wasm/types';

/** Outcome probability of each basis state: |amplitude|² = re² + im². */
export function probabilities(amps: Amplitude[]): number[] {
  return amps.map((a) => a.re * a.re + a.im * a.im);
}
/** Big-endian computational-basis label, e.g. index 1 of 2 qubits → "|01⟩". */
export function basisLabel(index: number, numQubits: number): string {
  return '|' + index.toString(2).padStart(numQubits, '0') + '⟩';
}

/** Formats a complex amplitude into a clean string representation, e.g. "0.707 + 0.000i". */
export function formatAmplitude(amp: Amplitude): string {
  const reStr = (Math.abs(amp.re) < 1e-6 ? 0 : amp.re).toFixed(3);
  const imAbs = Math.abs(Math.abs(amp.im) < 1e-6 ? 0 : amp.im).toFixed(3);
  const sign = amp.im < -1e-6 ? '-' : '+';
  return `${reStr} ${sign} ${imAbs}i`;
}
