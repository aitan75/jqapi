import { describe, expect, it } from 'vitest';
import { importQasm, exportQasm, run, sample, trace, sampleExpectation } from '../wasm/bridge';
import { capabilities } from '../wasm/jqapi.js';
import { BROWSER_BUDGET } from '../wasm/policy';
import { CircuitModel } from './circuit';
import { editableQasmSpec } from './qasm';

const header = 'OPENQASM 2.0; include "qelib1.inc"; qreg q[3];';
function imported(source: string) {
  const result = importQasm(source);
  if (!result.ok) throw new Error(JSON.stringify(result));
  return editableQasmSpec(result.spec);
}

describe('QASM through the rebuilt TeaVM engine and editable canvas model', () => {
  it('shares browser limits with the compiled bridge', () => {
    expect(JSON.parse(capabilities())).toEqual(BROWSER_BUDGET);
  });
  it('preserves non-adjacent operands, parameters and source dependencies through editing and export', () => {
    const spec = imported(`${header} x q[0]; ry(pi/3) q[2]; cx q[0],q[2]; rz(pi/7) q[1];`);
    const model = CircuitModel.fromSpec(spec);
    expect(model.toSpec()).toEqual(spec);
    expect(run(model.toSpec())).toEqual(run(spec));
    model.place(1, 4, { kind: 'X' });
    const output = exportQasm(model.toSpec());
    if (!output.ok) throw new Error(JSON.stringify(output));
    expect(run(imported(output.source))).toEqual(run(model.toSpec()));
    const result = run(spec);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.amplitudes[4].re ** 2 + result.amplitudes[4].im ** 2).toBeCloseTo(0.25, 12);
    expect(result.amplitudes[5].re ** 2 + result.amplitudes[5].im ** 2).toBeCloseTo(0.75, 12);
  });
  it('retains measurement and condition dependencies and rejects unmappable classical addresses', () => {
    const source = `${header} creg a[1]; creg b[1]; creg c[1]; x q[0]; measure q[0] -> a[0]; reset q[0]; if(a==1) x q[2];`;
    const model = CircuitModel.fromSpec(imported(source));
    expect(sample(model.toSpec(), 8)).toEqual({ ok: true, shots: 8, counts: [0, 8, 0, 0, 0, 0, 0, 0], classicalCounts: [0, 0, 0, 0, 8, 0, 0, 0] });
    expect(() => imported(source.replace('-> a[0]', '-> b[0]'))).toThrow('UNSUPPORTED_EDITOR_QASM');
    expect(() => imported(`${header} creg a[1]; measure q[0] -> a[0];`)).toThrow('UNSUPPORTED_EDITOR_QASM');
  });
  it('fails explicitly for unsupported source and export operations', () => {
    expect(importQasm(`${header} gate custom a { x a; }`)).toMatchObject({ ok: false, error: { code: 'INVALID_QASM', detail: expect.any(String) } });
    const model = new CircuitModel(1);
    model.place(0, 0, { kind: 'GENERIC', matrix: [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 1, im: 0 }]] });
    expect(exportQasm(model.toSpec())).toMatchObject({ ok: false, error: { code: 'INVALID_QASM' } });
    expect(exportQasm({ ...model.toSpec(), version: 99 })).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } });
    expect(() => CircuitModel.fromSpec({ version: 1, numQubits: 2, levels: [{ gates: [{
      kind: 'MULTI_CONTROLLED', controls: [0], targets: [1], params: {},
      matrix: [[{ re: 0, im: 0 }, { re: 0, im: -1 }], [{ re: 0, im: 1 }, { re: 0, im: 0 }]],
    }] }] })).toThrow('Invalid CircuitSpec');
  });
  it('bounds trace output and observable sampling work before execution', () => {
    const spec = { version: 1, numQubits: 8, levels: Array.from({ length: 256 }, () => ({ gates: [{ kind: 'X', targets: [0], controls: [], params: {} }] })) };
    expect(trace(spec, 1)).toEqual({ ok: false, error: { code: 'INPUT_LIMIT_EXCEEDED' } });
    const empty = { ...spec, levels: [] };
    expect(sampleExpectation(empty, { numQubits: 8, terms: [{ coeff: 1, pauli: 'ZIIIIIII' }] }, 10_000)).toEqual({ ok: false, error: { code: 'INPUT_LIMIT_EXCEEDED' } });
  });
});
