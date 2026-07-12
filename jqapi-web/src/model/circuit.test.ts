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
});
