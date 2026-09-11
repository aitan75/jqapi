import { describe, it, expect } from 'vitest';
import { PRESETS } from './presets';
import { CircuitModel } from './circuit';

describe('PRESETS', () => {
  it('defines valid presets with working load functions', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);

    for (const preset of PRESETS) {
      const model = new CircuitModel(preset.qubits);
      preset.load(model);
      const spec = model.toSpec();

      expect(spec.numQubits).toBe(preset.qubits);
      expect(spec.levels.length).toBeGreaterThan(0);
    }
  });
});
