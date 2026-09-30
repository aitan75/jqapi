import { expect, it } from 'vitest';
import { sample, sampleExpectation } from '../wasm/bridge';
import { shotBudgets } from './budget';
import type { CircuitSpec } from '../wasm/types';

it('predicts the counts admission boundary of the compiled bridge at eight qubits', () => {
  const spec: CircuitSpec = { version: 1, numQubits: 8, levels: [
    { gates: Array.from({ length: 8 }, (_, q) => ({ kind: 'H', targets: [q], controls: [], params: {} })) },
    { gates: [{ kind: 'CNOT', targets: [7], controls: [0], params: {} }] },
  ] };
  const budget = shotBudgets(spec, null);
  expect(budget.counts).toBe(7812);
  expect(sample(spec, budget.counts)).toMatchObject({ ok: true, shots: budget.counts });
  expect(sample(spec, budget.counts + 1)).toEqual({ ok: false, error: { code: 'INPUT_LIMIT_EXCEEDED' } });
}, 10_000);

it('predicts observable admission independently of counts and excludes identity terms', () => {
  const spec: CircuitSpec = { version: 1, numQubits: 8, levels: [] };
  const observable = { numQubits: 8, terms: [
    { coeff: 1, pauli: 'ZIIIIIII' }, { coeff: 1, pauli: 'IZIIIIII' }, { coeff: 1, pauli: 'IIIIIIII' },
  ] };
  const budget = shotBudgets(spec, observable);
  expect(budget.counts).toBe(10_000);
  expect(sampleExpectation(spec, observable, budget.observable!)).toMatchObject({ ok: true, value: 3, standardError: 0 });
  expect(sampleExpectation(spec, observable, budget.observable! + 1)).toEqual({ ok: false, error: { code: 'INPUT_LIMIT_EXCEEDED' } });
  const identity = { ...observable, terms: [observable.terms[2]] };
  expect(shotBudgets(spec, identity).observable).toBe(10_000);
  expect(sampleExpectation(spec, identity, 10_000)).toMatchObject({ ok: true, totalShots: 0 });
});
