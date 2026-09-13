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

  it('runs expanded gates (Y, CY, S, T, RX, SWAP, TOFFOLI, RESET)', () => {
    // 1. PauliY on |0> -> i|1>
    const yResult = run({
      version: 1,
      numQubits: 1,
      levels: [{ gates: [{ kind: 'Y', targets: [0], controls: [], params: {} }] }],
    });
    expect(yResult.amplitudes[0].re).toBeCloseTo(0, 7);
    expect(yResult.amplitudes[1].im).toBeCloseTo(1, 7);

    // 2. Controlled-Y applies Y to the target when control is |1>.
    const cyResult = run({
      version: 1,
      numQubits: 2,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'CY', targets: [1], controls: [0], params: {} }] },
      ],
    });
    expect(cyResult.amplitudes[3].im).toBeCloseTo(1, 7);

    // 3. RX(pi) on |0> -> -i|1>
    const rxResult = run({
      version: 1,
      numQubits: 1,
      levels: [{ gates: [{ kind: 'RX', targets: [0], controls: [], params: { theta: Math.PI } }] }],
    });
    expect(rxResult.amplitudes[1].im).toBeCloseTo(-1, 7);

    // 3. SWAP on |10> -> |01>
    const swapResult = run({
      version: 1,
      numQubits: 2,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'SWAP', targets: [0, 1], controls: [], params: {} }] },
      ],
    });
    expect(swapResult.amplitudes[1].re).toBeCloseTo(1, 7); // index 1 is |01>

    // 4. TOFFOLI on |110> -> |111>
    const toffoliResult = run({
      version: 1,
      numQubits: 3,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'X', targets: [1], controls: [], params: {} }] },
        { gates: [{ kind: 'TOFFOLI', targets: [2], controls: [0, 1], params: {} }] },
      ],
    });
    expect(toffoliResult.amplitudes[7].re).toBeCloseTo(1, 7); // index 7 is |111>

    // 5. RESET on |1> -> |0>
    const resetResult = run({
      version: 1,
      numQubits: 1,
      levels: [
        { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'RESET', targets: [0], controls: [], params: {} }] },
      ],
    });
    expect(resetResult.amplitudes[0].re).toBeCloseTo(1, 7); // back to |0>
  });

  it('runs phase, U3, controlled swap, multi-control, measurement, and matrix gates', () => {
    const xMatrix = [[{ re: 0, im: 0 }, { re: 1, im: 0 }], [{ re: 1, im: 0 }, { re: 0, im: 0 }]];
    expect(run({ version: 1, numQubits: 1, levels: [{ gates: [{ kind: 'PHASE', targets: [0], controls: [], params: { theta: Math.PI } }] }] }).amplitudes[0].re).toBeCloseTo(1, 7);
    expect(run({ version: 1, numQubits: 1, levels: [{ gates: [{ kind: 'U3', targets: [0], controls: [], params: { theta: 0, phi: 0, lambda: 0 } }] }] }).amplitudes[0].re).toBeCloseTo(1, 7);
    expect(run({ version: 1, numQubits: 3, levels: [
      { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }, { kind: 'X', targets: [1], controls: [], params: {} }] },
      { gates: [{ kind: 'CSWAP', targets: [1, 2], controls: [0], params: {} }] },
    ] }).amplitudes[5].re).toBeCloseTo(1, 7);
    expect(run({ version: 1, numQubits: 3, levels: [
      { gates: [{ kind: 'X', targets: [0], controls: [], params: {} }, { kind: 'X', targets: [1], controls: [], params: {} }] },
      { gates: [{ kind: 'MULTI_CONTROLLED', targets: [2], controls: [0, 1], params: {}, matrix: xMatrix }] },
    ] }).amplitudes[7].re).toBeCloseTo(1, 7);
    expect(run({ version: 1, numQubits: 1, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {}, matrix: xMatrix }] }] }).amplitudes[1].re).toBeCloseTo(1, 7);
    expect(run({ version: 1, numQubits: 1, levels: [{ gates: [{ kind: 'MEASUREMENT', targets: [0], controls: [], params: {} }] }] }).amplitudes[0].re).toBeCloseTo(1, 7);
  });
});
