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
  return reducedBloch(amplitudes, 1, 0);
}
/** Big-endian computational-basis label, e.g. index 1 of 2 qubits → "|01⟩". */
export function basisLabel(index: number, numQubits: number): string {
  return '|' + index.toString(2).padStart(numQubits, '0') + '⟩';
}

/** Formats the simulator's complete complex-amplitude values without display rounding. */
export function formatAmplitude(amp: Amplitude): string {
  return `${amp.re} ${amp.im < 0 ? '-' : '+'} ${Math.abs(amp.im)}i`;
}

/** Partial trace of all other qubits, with q0 the most significant bit. */
export function reducedBloch(amps: Amplitude[], n: number, q: number): BlochVector {
  if (!Number.isInteger(n) || n < 1 || n > 30 || amps.length !== 2 ** n || !Number.isInteger(q) || q < 0 || q >= n) throw new Error('Invalid state dimensions or qubit.');
  const mask = 2 ** (n - 1 - q);
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < amps.length; i++) {
    if (i & mask) continue;
    const a = amps[i], b = amps[i | mask];
    x += 2 * (a.re * b.re + a.im * b.im);
    y += 2 * (a.re * b.im - a.im * b.re);
    z += a.re ** 2 + a.im ** 2 - b.re ** 2 - b.im ** 2;
  }
  return { x, y, z };
}

export function outcomeProbability(amps: Amplitude[], n: number, q: number, bit: number): number {
  if (bit !== 0 && bit !== 1) throw new Error('Measurement outcome must be 0 or 1.');
  const z = reducedBloch(amps, n, q).z;
  return Math.max(0, Math.min(1, (1 + (bit === 0 ? z : -z)) / 2));
}

export function blochFromAngles(theta: number, phi: number): BlochVector {
  return { x: Math.sin(theta) * Math.cos(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(theta) };
}

export function fidelityPure(input: BlochVector, output: BlochVector): number {
  return Math.max(0, Math.min(1, (1 + input.x * output.x + input.y * output.y + input.z * output.z) / 2));
}
