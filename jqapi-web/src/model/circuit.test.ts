import { describe, it, expect } from 'vitest';
import { CircuitModel, PAULI_X_MATRIX } from './circuit';

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

  it('serializes the remaining gate families and preserves cells while resizing', () => {
    const m = new CircuitModel(3, 2);
    m.place(0, 0, { kind: 'PHASE', theta: 0.25 });
    m.place(1, 0, { kind: 'U3', theta: 1, phi: 2, lambda: 3 });
    m.place(0, 1, { kind: 'CSWAP', role: 'control' });
    m.place(1, 1, { kind: 'CSWAP', role: 'swap' });
    m.place(2, 1, { kind: 'CSWAP', role: 'swap' });
    m.setColumns(3);
    m.setNumQubits(4);
    m.place(0, 2, { kind: 'MULTI_CONTROLLED', role: 'control' });
    m.place(1, 2, { kind: 'MULTI_CONTROLLED', role: 'control' });
    m.place(2, 2, { kind: 'MULTI_CONTROLLED', role: 'target' });
    m.place(3, 2, { kind: 'GENERIC', matrix: PAULI_X_MATRIX });

    expect(m.toSpec().levels).toEqual([
      { gates: [
        { kind: 'PHASE', targets: [0], controls: [], params: { theta: 0.25 } },
        { kind: 'U3', targets: [1], controls: [], params: { theta: 1, phi: 2, lambda: 3 } },
      ] },
      { gates: [{ kind: 'CSWAP', targets: [1, 2], controls: [0], params: {} }] },
      { gates: [
        { kind: 'GENERIC', targets: [3], controls: [], params: {}, matrix: PAULI_X_MATRIX },
        { kind: 'MULTI_CONTROLLED', targets: [2], controls: [0, 1], params: {}, matrix: PAULI_X_MATRIX },
      ] },
    ]);
  });

  it('round-trips a serializable circuit into editable cells', () => {
    const source = new CircuitModel(2, 3);
    source.place(0, 0, { kind: 'MEASUREMENT' });
    source.place(0, 1, { kind: 'CNOT', role: 'control' });
    source.place(1, 1, { kind: 'CNOT', role: 'target' });
    source.place(1, 2, { kind: 'ORACLE', matrix: PAULI_X_MATRIX });
    expect(CircuitModel.fromSpec(source.toSpec()).toSpec()).toEqual(source.toSpec());
  });
});
