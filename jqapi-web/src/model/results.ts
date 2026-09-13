import type { Amplitude } from '../wasm/types';

/** Outcome probability of each basis state: |amplitude|² = re² + im². */
export function probabilities(amps: Amplitude[]): number[] {
  return amps.map((a) => a.re * a.re + a.im * a.im);
}

export function amplitudeMagnitude(amp: Amplitude): number {
  return Math.hypot(amp.re, amp.im);
}

export function phaseRadians(amp: Amplitude): number | null {
  return amplitudeMagnitude(amp) < 1e-12 ? null : Math.atan2(amp.im, amp.re);
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

/** Bloch vector for a normalized one-qubit state α|0⟩ + β|1⟩. */
export function blochVector(amplitudes: Amplitude[]): BlochVector | null {
  if (amplitudes.length !== 2) return null;
  const [alpha, beta] = amplitudes;
  return {
    x: 2 * (alpha.re * beta.re + alpha.im * beta.im),
    y: 2 * (alpha.re * beta.im - alpha.im * beta.re),
    z: probabilities([alpha])[0] - probabilities([beta])[0],
  };
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
