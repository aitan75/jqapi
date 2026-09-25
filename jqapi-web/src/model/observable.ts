import type { Observable } from '../wasm/types';

/** Same bound as the engine's PauliSumJson.MAX_TERMS. */
export const MAX_TERMS = 1024;

export type ObservableParseErrorCode = 'EMPTY' | 'BAD_LINE' | 'BAD_LABEL' | 'WRONG_LENGTH' | 'BAD_COEFF' | 'TOO_MANY_TERMS';

/** 1-based line of the first error; 0 when the text has no terms at all. */
export interface ObservableParseError {
  code: ObservableParseErrorCode;
  line: number;
}

// Decimal or scientific notation only: rejects hex, NaN, Infinity and empty strings that Number() accepts.
const COEFF = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/**
 * Parses one term per line, `[coeff] LABEL`, e.g. `0.5 ZZ` or `XI` (coeff 1).
 * Label character 0 acts on q0 (MSB); letters are case-insensitive.
 */
export function parseObservable(text: string, numQubits: number): Observable | ObservableParseError {
  const terms: Observable['terms'] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = index + 1;
    const tokens = lines[index].trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    if (tokens.length > 2) return { code: 'BAD_LINE', line };
    const coeff = tokens.length === 2 ? (COEFF.test(tokens[0]) ? Number(tokens[0]) : Number.NaN) : 1;
    if (!Number.isFinite(coeff)) return { code: 'BAD_COEFF', line };
    const pauli = tokens[tokens.length - 1].toUpperCase();
    if (!/^[IXYZ]+$/.test(pauli)) return { code: 'BAD_LABEL', line };
    if (pauli.length !== numQubits) return { code: 'WRONG_LENGTH', line };
    if (terms.length === MAX_TERMS) return { code: 'TOO_MANY_TERMS', line };
    terms.push({ coeff, pauli });
  }
  return terms.length === 0 ? { code: 'EMPTY', line: 0 } : { numQubits, terms };
}

/** Four decimals, with `± se` only when the standard error is positive. */
export function formatExpectation(value: number, standardError = 0): string {
  const fixed = (x: number) => (Math.abs(x) < 5e-5 ? 0 : x).toFixed(4);
  return standardError > 0 ? `${fixed(value)} ± ${fixed(standardError)}` : fixed(value);
}
