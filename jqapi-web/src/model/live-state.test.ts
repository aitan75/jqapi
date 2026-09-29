import { describe, expect, it } from 'vitest';
import { CircuitModel, isCircuitSpec, isUnsupportedCircuitSpec } from './circuit';
import { PRESETS } from './presets';
import { blochFromAngles, fidelityPure, outcomeProbability, probabilities, reducedBloch } from './results';
import { trace } from '../wasm/bridge';
import type { Amplitude } from '../wasm/types';

const teleportation = () => {
  const model = new CircuitModel(3);
  PRESETS.find((preset) => preset.id === 'teleportation')!.load(model);
  return model;
};

describe('reduced states', () => {
  it.each([
    [0, 0, 0, 0, 1], [Math.PI, 0, 0, 0, -1],
    [Math.PI / 2, 0, 1, 0, 0], [Math.PI / 2, Math.PI, -1, 0, 0],
    [Math.PI / 2, Math.PI / 2, 0, 1, 0], [Math.PI / 2, -Math.PI / 2, 0, -1, 0],
  ])('recovers the axis state theta=%s phi=%s', (theta, phi, x, y, z) => {
    const amps = [{ re: Math.cos(theta / 2), im: 0 }, { re: Math.sin(theta / 2) * Math.cos(phi), im: Math.sin(theta / 2) * Math.sin(phi) }];
    const r = reducedBloch(amps, 1, 0);
    expect(r.x).toBeCloseTo(x, 12); expect(r.y).toBeCloseTo(y, 12); expect(r.z).toBeCloseTo(z, 12);
    expect(fidelityPure(blochFromAngles(theta, phi), r)).toBeCloseTo(1, 12);
  });

  it('reduces a Bell pair to the maximally mixed state', () => {
    const amps = [{ re: Math.SQRT1_2, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: Math.SQRT1_2, im: 0 }];
    for (const q of [0, 1]) {
      expect(reducedBloch(amps, 2, q)).toEqual({ x: 0, y: 0, z: 0 });
      expect(outcomeProbability(amps, 2, q, 0) + outcomeProbability(amps, 2, q, 1)).toBeCloseTo(1, 12);
    }
  });

  it('uses q0 as MSB and validates dimensions', () => {
    const amps: Amplitude[] = Array.from({ length: 4 }, (_, i) => ({ re: i === 2 ? 1 : 0, im: 0 }));
    expect(reducedBloch(amps, 2, 0).z).toBe(-1);
    expect(reducedBloch(amps, 2, 1).z).toBe(1);
    expect(() => reducedBloch(amps, 1, 0)).toThrow();
    expect(() => reducedBloch(amps, 2, 2)).toThrow();
  });
});

describe('implicit classical editor model', () => {
  it('round-trips the teleportation circuit without dropping conditions or records', () => {
    const spec = teleportation().toSpec();
    expect(spec.version).toBe(2);
    expect(spec.numClassicalBits).toBe(3);
    expect(isCircuitSpec(spec)).toBe(true);
    expect(CircuitModel.fromSpec(spec).toSpec()).toEqual(spec);
    expect(spec.levels[5].gates[0].classicalTarget).toBe(0);
    expect(spec.levels[6].gates[0].classicalTarget).toBe(1);
  });

  it('preserves an imported classical register even without conditional gates', () => {
    const spec = teleportation().toSpec();
    spec.levels = spec.levels.slice(0, 7);
    expect(CircuitModel.fromSpec(spec).toSpec()).toEqual(spec);
    const model = CircuitModel.fromSpec(spec);
    const snapshot = model.snapshot();
    model.restore(snapshot);
    expect(model.toSpec()).toEqual(spec);
  });

  it('keeps ordinary circuits in v1 and maps compressed levels to visible columns', () => {
    const model = new CircuitModel(2);
    model.place(0, 3, { kind: 'H' });
    const spec = model.toSpec();
    expect(spec).toEqual({ version: 1, numQubits: 2, levels: [{ gates: [{ kind: 'H', targets: [0], controls: [], params: {} }] }] });
    expect(model.serializedColumns).toEqual([3]);
    expect(CircuitModel.fromSpec(spec).toSpec()).toEqual(spec);
  });

  it('rejects non-implicit metadata, malformed conditions and same-level read/write', () => {
    const spec = teleportation().toSpec();
    expect(isUnsupportedCircuitSpec({ ...spec, numClassicalBits: 2 })).toBe(true);
    const remapped = structuredClone(spec); remapped.levels[5].gates[0].classicalTarget = 2;
    expect(isUnsupportedCircuitSpec(remapped)).toBe(true);
    const malformed = structuredClone(spec); malformed.levels[7].gates[0].condition!.bitIndex = 3;
    expect(isCircuitSpec(malformed)).toBe(false);
    const unsupported = structuredClone(spec); unsupported.levels[2].gates[0].condition = { bitIndex: 0, expected: 1 };
    expect(isUnsupportedCircuitSpec(unsupported)).toBe(true);
    const measuredCondition = structuredClone(spec); measuredCondition.levels[5].gates[0].condition = { bitIndex: 1, expected: 1 };
    expect(isCircuitSpec(measuredCondition)).toBe(false);
    const dependency = structuredClone(spec); dependency.levels[6].gates.push(dependency.levels[7].gates[0]);
    expect(isCircuitSpec(dependency)).toBe(false);
  });
});

describe('real compiled trajectory', () => {
  it.each([[0, 0], [Math.PI / 3, Math.PI / 4], [1.7, -0.8]])('teleports theta=%s phi=%s through all four branches', (theta, phi) => {
    const model = teleportation();
    model.place(0, 0, { kind: 'U3', theta, phi, lambda: 0 });
    const spec = model.toSpec();
    const branches = new Set<string>();
    for (let i = 0; i < 64; i++) {
      const result = trace(spec, i * 7919);
      if (!result.ok) throw new Error(result.error.code);
      expect(result.frames).toHaveLength(10);
      const final = result.frames.at(-1)!;
      branches.add(final.classicalRecords.slice(0, 2).join(''));
      expect(fidelityPure(blochFromAngles(theta, phi), reducedBloch(final.amplitudes, 3, 2))).toBeGreaterThan(1 - 1e-9);
      for (const frame of result.frames) expect(probabilities(frame.amplitudes).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      for (const index of [6, 7]) {
        const q = index - 6, post = result.frames[index], pre = result.frames[index - 1];
        expect(outcomeProbability(pre.amplitudes, 3, q, post.classicalRecords[q])).toBeCloseTo(0.5, 12);
        expect(outcomeProbability(post.amplitudes, 3, q, post.classicalRecords[q])).toBeCloseTo(1, 12);
      }
      expect(final.applied).toBe(final.classicalRecords[0] === 1);
      expect(result.frames[8].applied).toBe(final.classicalRecords[1] === 1);
    }
    expect(branches).toEqual(new Set(['00', '01', '10', '11']));
    expect(trace(spec, 123)).toEqual(trace(spec, 123));
  });

  it('reports stable errors and checks the snapshot budget', () => {
    expect(trace({ version: 1, numQubits: 21, levels: [] }, 0)).toEqual({ ok: false, error: { code: 'INPUT_LIMIT_EXCEEDED' } });
    expect(trace({ version: 99, numQubits: 1, levels: [] }, 0)).toEqual({ ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } });
  });
});
