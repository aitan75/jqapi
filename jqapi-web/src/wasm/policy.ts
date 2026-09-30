/** Must match JqapiBridge.capabilities(); checked against the rebuilt TeaVM module. */
export const BROWSER_BUDGET = {
  maxQubits: 8,
  maxLevels: 256,
  maxGates: 1024,
  maxMatrixCells: 4096,
  maxInputChars: 1_000_000,
  maxResultBytes: 8 * 1024 * 1024,
  maxTraceAmplitudes: 65_536,
  maxObservableTerms: 64,
  maxWork: 20_000_000,
  maxElapsedMs: 5000,
  maxShots: 10_000,
} as const;
