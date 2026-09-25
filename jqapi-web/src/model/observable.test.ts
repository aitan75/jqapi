import { describe, it, expect } from 'vitest';
import { formatExpectation, MAX_TERMS, parseObservable } from './observable';

describe('parseObservable', () => {
  it('parses one term per line with an optional coefficient', () => {
    expect(parseObservable('0.5 ZZ\n-1.2e-1 xy\n\n  ZI  \n+3 II', 2)).toEqual({
      numQubits: 2,
      terms: [
        { coeff: 0.5, pauli: 'ZZ' },
        { coeff: -0.12, pauli: 'XY' },
        { coeff: 1, pauli: 'ZI' },
        { coeff: 3, pauli: 'II' },
      ],
    });
    expect(parseObservable('.5 Z\r\n2. X', 1)).toEqual({ numQubits: 1, terms: [{ coeff: 0.5, pauli: 'Z' }, { coeff: 2, pauli: 'X' }] });
  });

  it('reports the first invalid line with a stable code', () => {
    expect(parseObservable('', 2)).toEqual({ code: 'EMPTY', line: 0 });
    expect(parseObservable('  \n\t\n', 2)).toEqual({ code: 'EMPTY', line: 0 });
    expect(parseObservable('ZZ\n1 2 ZZ', 2)).toEqual({ code: 'BAD_LINE', line: 2 });
    expect(parseObservable('ZQ', 2)).toEqual({ code: 'BAD_LABEL', line: 1 });
    expect(parseObservable('ZZ\n\nZZZ', 2)).toEqual({ code: 'WRONG_LENGTH', line: 3 });
    for (const coeff of ['abc', '1e999', 'NaN', 'Infinity', '0x10', '1,5', '--1']) {
      expect(parseObservable(`${coeff} ZZ`, 2)).toEqual({ code: 'BAD_COEFF', line: 1 });
    }
    expect(parseObservable('Z\n'.repeat(MAX_TERMS + 1), 1)).toEqual({ code: 'TOO_MANY_TERMS', line: MAX_TERMS + 1 });
    expect(parseObservable('Z\n'.repeat(MAX_TERMS), 1)).not.toHaveProperty('code');
  });
});

describe('formatExpectation', () => {
  it('shows fixed decimals and the standard error only when it is positive', () => {
    expect(formatExpectation(0.25)).toBe('0.2500');
    expect(formatExpectation(-1)).toBe('-1.0000');
    expect(formatExpectation(1.23456, 0.01234)).toBe('1.2346 ± 0.0123');
    expect(formatExpectation(1, 0)).toBe('1.0000');
    expect(formatExpectation(-1e-17)).toBe('0.0000');
  });
});
