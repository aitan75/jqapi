import { describe, it, expect } from 'vitest';
import { CircuitModel } from './circuit';

describe('CircuitModel.toSpec', () => {
  it('builds the Bell CircuitSpec from a drawn circuit', () => {
    const m = new CircuitModel(2);
    m.place(0, 0, { kind: 'H' });
    m.place(0, 1, { kind: 'CNOT', role: 'control' });
    m.place(1, 1, { kind: 'CNOT', role: 'target' });
    expect(m.toSpec()).toEqual({
      version: 1,
      numQubits: 2,
      levels: [
        { gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] },
        { gates: [{ kind: 'CNOT', targets: [1], controls: [0], params: {} }] },
      ],
    });
  });

  it('drops empty columns and ignores incomplete CNOTs', () => {
    const m = new CircuitModel(2);
    m.place(0, 3, { kind: 'X' });
    m.place(0, 5, { kind: 'CNOT', role: 'control' }); // no target → ignored
    expect(m.toSpec()).toEqual({
      version: 1,
      numQubits: 2,
      levels: [{ gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] }],
    });
  });

  it('builds spec for rotations, SWAP, controlled Y/Z, and Toffoli', () => {
    const m = new CircuitModel(3);
    m.place(0, 0, { kind: 'RX', theta: 1.57 });
    m.place(0, 1, { kind: 'SWAP', role: 'swap' });
    m.place(1, 1, { kind: 'SWAP', role: 'swap' });
    m.place(0, 2, { kind: 'CZ', role: 'control' });
    m.place(1, 2, { kind: 'CZ', role: 'target' });
    m.place(0, 3, { kind: 'TOFFOLI', role: 'control' });
    m.place(1, 3, { kind: 'TOFFOLI', role: 'control' });
    m.place(2, 3, { kind: 'TOFFOLI', role: 'target' });
    m.place(0, 4, { kind: 'CY', role: 'control' });
    m.place(1, 4, { kind: 'CY', role: 'target' });

    const spec = m.toSpec();
    expect(spec.levels).toEqual([
      { gates: [{ kind: 'RX', targets: [0], controls: [], params: { theta: 1.57 } }] },
      { gates: [{ kind: 'SWAP', targets: [0, 1], controls: [], params: {} }] },
      { gates: [{ kind: 'CZ', targets: [1], controls: [0], params: {} }] },
      { gates: [{ kind: 'TOFFOLI', targets: [2], controls: [0, 1], params: {} }] },
      { gates: [{ kind: 'CY', targets: [1], controls: [0], params: {} }] },
    ]);
  });
});
