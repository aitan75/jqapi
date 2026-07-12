import { describe, it, expect } from 'vitest';
import { run } from './bridge';
import type { CircuitSpec } from './types';

const bell: CircuitSpec = {
  version: 1,
  numQubits: 2,
  levels: [
    { gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] },
    { gates: [{ kind: 'CNOT', targets: [1], controls: [0], params: {} }] },
  ],
};

describe('wasm bridge', () => {
  it('runs a Bell circuit and returns 4 amplitudes with 1/√2 on |00> and |11>', () => {
    const { amplitudes } = run(bell);
    expect(amplitudes).toHaveLength(4);
    const inv = 1 / Math.sqrt(2);
    expect(amplitudes[0].re).toBeCloseTo(inv, 9);
    expect(amplitudes[3].re).toBeCloseTo(inv, 9);
    expect(amplitudes[1].re).toBeCloseTo(0, 9);
    expect(amplitudes[2].re).toBeCloseTo(0, 9);
  });
});
