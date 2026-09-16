import { describe, it, expect } from 'vitest';
import { CircuitModel, isCircuitSpec, MAX_GATES, MAX_LEVELS, MAX_QUBITS, PAULI_X_MATRIX } from './circuit';

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

  it('moves every part of a multi-qubit gate together or not at all', () => {
    const m = new CircuitModel(3, 4);
    m.place(0, 1, { kind: 'CNOT', role: 'control' });
    m.place(1, 1, { kind: 'CNOT', role: 'target' });
    m.place(2, 2, { kind: 'H' });

    expect(m.moveGate(0, 1, 1, 2)).toBe(false);
    expect(m.cellAt(0, 1)).toEqual({ kind: 'CNOT', role: 'control' });
    expect(m.cellAt(1, 1)).toEqual({ kind: 'CNOT', role: 'target' });

    expect(m.moveGate(0, 1, 1, 3)).toBe(true);
    expect(m.cellAt(0, 1)).toBeNull();
    expect(m.cellAt(1, 1)).toBeNull();
    expect(m.cellAt(1, 3)).toEqual({ kind: 'CNOT', role: 'control' });
    expect(m.cellAt(2, 3)).toEqual({ kind: 'CNOT', role: 'target' });
  });

  it('removes every part of a multi-qubit gate together', () => {
    const m = new CircuitModel(2);
    m.place(0, 1, { kind: 'CNOT', role: 'control' });
    m.place(1, 1, { kind: 'CNOT', role: 'target' });

    expect(m.removeGate(1, 1)).toBe(true);
    expect(m.cellAt(0, 1)).toBeNull();
    expect(m.cellAt(1, 1)).toBeNull();
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

describe('isCircuitSpec', () => {
  const valid = {
    version: 1,
    numQubits: 2,
    levels: [
      { gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] },
      { gates: [{ kind: 'CNOT', targets: [1], controls: [0], params: {} }] },
    ],
  };

  it('accepts a structurally valid spec and editor output', () => {
    expect(isCircuitSpec(valid)).toBe(true);
    const model = new CircuitModel(2, 2);
    model.place(0, 0, { kind: 'RX', theta: 1 });
    model.place(0, 1, { kind: 'GENERIC', matrix: PAULI_X_MATRIX });
    expect(isCircuitSpec(model.toSpec())).toBe(true);
  });

  it('rejects non-objects and missing fields', () => {
    expect(isCircuitSpec(null)).toBe(false);
    expect(isCircuitSpec('spec')).toBe(false);
    expect(isCircuitSpec([])).toBe(false);
    expect(isCircuitSpec({ version: 1, numQubits: 2 })).toBe(false);
    expect(isCircuitSpec({ version: 1, numQubits: 2, levels: 'nope' })).toBe(false);
  });

  it('rejects out-of-range qubit counts and indexes', () => {
    expect(isCircuitSpec({ ...valid, numQubits: 0 })).toBe(false);
    expect(isCircuitSpec({ ...valid, numQubits: MAX_QUBITS + 1 })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'H', targets: [5], controls: [], params: {} }] }] })).toBe(false);
  });

  it('rejects unsupported format versions', () => {
    expect(isCircuitSpec({ ...valid, version: 2 })).toBe(false);
    expect(isCircuitSpec({ ...valid, version: '1' })).toBe(false);
  });

  it('rejects unknown kinds, missing or non-finite params', () => {
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'NOPE', targets: [0], controls: [], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'RX', targets: [0], controls: [], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'RX', targets: [0], controls: [], params: { theta: Infinity } }] }] })).toBe(false);
  });

  it('rejects wrong control/target arity', () => {
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'CNOT', targets: [1], controls: [], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'H', targets: [0, 1], controls: [], params: {} }] }] })).toBe(false);
  });

  it('rejects a missing or malformed matrix', () => {
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {}, matrix: [[{ re: 1 }]] }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {}, matrix: [[1, 0]] }] }] })).toBe(false);
  });

  it('rejects a matrix whose dimension does not match the target count', () => {
    // One target requires a 2x2 matrix; 1x1 and 3x3 are rejected.
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {}, matrix: [[{ re: 1, im: 0 }]] }] }] })).toBe(false);
    const threeByThree = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({ re: 0, im: 0 })));
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'GENERIC', targets: [0], controls: [], params: {}, matrix: threeByThree }] }] })).toBe(false);
  });

  it('rejects duplicate or overlapping indexes', () => {
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'SWAP', targets: [0, 0], controls: [], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'TOFFOLI', targets: [1], controls: [0, 0], params: {} }] }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: [{ gates: [{ kind: 'CNOT', targets: [0], controls: [0], params: {} }] }] })).toBe(false);
  });

  it('rejects unbounded level and gate counts', () => {
    const gate = { kind: 'H', targets: [0], controls: [], params: {} };
    expect(isCircuitSpec({ ...valid, levels: [{ gates: Array.from({ length: MAX_GATES + 1 }, () => gate) }] })).toBe(false);
    expect(isCircuitSpec({ ...valid, levels: Array.from({ length: MAX_LEVELS + 1 }, () => ({ gates: [] })) })).toBe(false);
  });
});
