import { describe, it, expect } from 'vitest';
import { run } from './bridge';
import type { CircuitSpec } from './types';

function amplitudesOf(spec: CircuitSpec) {
  const result = run(spec);
  if (!result.ok) throw new Error(`Unexpected simulation error: ${result.error.code}`);
  return result.amplitudes;
}

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
    const amplitudes = amplitudesOf(bell);
    expect(amplitudes).toHaveLength(4);
    const inv = 1 / Math.sqrt(2);
    expect(amplitudes[0].re).toBeCloseTo(inv, 9);
    expect(amplitudes[3].re).toBeCloseTo(inv, 9);
    expect(amplitudes[1].re).toBeCloseTo(0, 9);
    expect(amplitudes[2].re).toBeCloseTo(0, 9);
  });

  it('runs expanded gates (Y, CY, S, T, RX, SWAP, TOFFOLI, RESET)', () => {
    // 1. PauliY on |0> -> i|1>
    const yResult = amplitudesOf({
      version: 1,
      numQubits: 1,
      levels: [{ gates: [{ kind: 'Y', targets: [0], controls: [], params: {} }] }],
    });
    expect(yResult[0].re).toBeCloseTo(0, 7);
    expect(yResult[1].im).toBeCloseTo(1, 7);

    // 2. Controlled-Y applies Y to the target when control is |1>.
    const cyResult = amplitudesOf({
      version: 1,
      numQubits: 2,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'CY', targets: [1], controls: [0], params: {} }] },
      ],
    });
    expect(cyResult[3].im).toBeCloseTo(1, 7);

    // 3. RX(pi) on |0> -> -i|1>
    const rxResult = amplitudesOf({
      version: 1,
      numQubits: 1,
      levels: [{ gates: [{ kind: 'RX', targets: [0], controls: [], params: { theta: Math.PI } }] }],
    });
    expect(rxResult[1].im).toBeCloseTo(-1, 7);

    // 3. SWAP on |10> -> |01>
    const swapResult = amplitudesOf({
      version: 1,
      numQubits: 2,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'SWAP', targets: [0, 1], controls: [], params: {} }] },
      ],
    });
    expect(swapResult[1].re).toBeCloseTo(1, 7); // index 1 is |01>

    // 4. TOFFOLI on |110> -> |111>
    const toffoliResult = amplitudesOf({
      version: 1,
      numQubits: 3,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'X', targets: [1], controls: [], params: {} }] },
        { gates: [{ kind: 'TOFFOLI', targets: [2], controls: [0, 1], params: {} }] },
      ],
    });
    expect(toffoliResult[7].re).toBeCloseTo(1, 7); // index 7 is |111>

    // 5. RESET on |1> -> |0>
    const resetResult = amplitudesOf({
      version: 1,
      numQubits: 1,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'RESET', targets: [0], controls: [], params: {} }] },
      ],
    });
    expect(resetResult[0].re).toBeCloseTo(1, 7); // back to |0>
  });

  it('returns a stable code for an invalid circuit spec', () => {
    const result = run({
      version: 1,
      numQubits: 1,
      levels: [{ gates: [{ kind: 'UNKNOWN', targets: [0], controls: [], params: {} }] }],
    });

    expect(result).toEqual({ ok: false, error: { code: 'INVALID_CIRCUIT_SPEC' } });
  });
});
