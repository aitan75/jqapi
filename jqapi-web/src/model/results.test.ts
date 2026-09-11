import { describe, it, expect } from 'vitest';
import { probabilities, basisLabel, formatAmplitude } from './results';

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

  it('formats complex amplitudes with sign and i', () => {
    expect(formatAmplitude({ re: 0.7071, im: 0 })).toBe('0.707 + 0.000i');
    expect(formatAmplitude({ re: 0, im: -0.5 })).toBe('0.000 - 0.500i');
  });
});
