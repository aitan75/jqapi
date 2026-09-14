import { describe, it, expect } from 'vitest';
import { amplitudeMagnitude, basisLabel, blochVector, formatAmplitude, phaseRadians, probabilities } from './results';

describe('results', () => {
  it('computes probabilities as re^2 + im^2', () => {
    const inv = 1 / Math.sqrt(2);
    const p = probabilities([
      { re: inv, im: 0 },
      { re: 0, im: 0 },
      { re: 0, im: 0 },
      { re: inv, im: 0 },
    ]);
    expect(p[0]).toBeCloseTo(0.5, 9);
    expect(p[1]).toBeCloseTo(0, 9);
    expect(p[2]).toBeCloseTo(0, 9);
    expect(p[3]).toBeCloseTo(0.5, 9);
  });

  it('labels basis states big-endian', () => {
    expect(basisLabel(1, 2)).toBe('|01⟩');
    expect(basisLabel(2, 2)).toBe('|10⟩');
  });

  it('formats complete complex amplitudes with sign and i', () => {
    expect(formatAmplitude({ re: 0.7071, im: 0 })).toBe('0.7071 + 0i');
    expect(formatAmplitude({ re: 0, im: -0.5 })).toBe('0 - 0.5i');
  });

  it('derives magnitude, phase, and the one-qubit Bloch vector', () => {
    expect(amplitudeMagnitude({ re: 3, im: 4 })).toBe(5);
    expect(phaseRadians({ re: 0, im: 1 })).toBeCloseTo(Math.PI / 2, 9);
    expect(phaseRadians({ re: 0, im: 0 })).toBeNull();
    const vector = blochVector([{ re: Math.SQRT1_2, im: 0 }, { re: 0, im: Math.SQRT1_2 }]);
    expect(vector?.x).toBeCloseTo(0, 9);
    expect(vector?.y).toBeCloseTo(1, 9);
    expect(vector?.z).toBeCloseTo(0, 9);
    expect(blochVector([{ re: 1, im: 0 }])).toBeNull();
  });
});
