import type { Amplitude } from '../wasm/types';

/** Outcome probability of each basis state: |amplitude|² = re² + im². */
export function probabilities(amps: Amplitude[]): number[] {
  return amps.map((a) => a.re * a.re + a.im * a.im);
}

/** Big-endian computational-basis label, e.g. index 1 of 2 qubits → "|01⟩". */
export function basisLabel(index: number, numQubits: number): string {
  return '|' + index.toString(2).padStart(numQubits, '0') + '⟩';
}
