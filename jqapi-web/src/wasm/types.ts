export interface Gate {
  kind: string;
  targets: number[];
  controls: number[];
  params: Record<string, number>;
  matrix?: ComplexMatrix;
  classicalTarget?: number;
  condition?: { bitIndex: number; expected: 0 | 1 };
}

export interface ComplexCell {
  re: number;
  im: number;
}

export type ComplexMatrix = ComplexCell[][];

export interface Level {
  gates: Gate[];
}

export interface CircuitSpec {
  version: number;
  numQubits: number;
  numClassicalBits?: number;
  levels: Level[];
}

export interface Amplitude {
  re: number;
  im: number;
}

export type EngineErrorCode = 'INPUT_LIMIT_EXCEEDED' | 'INVALID_CIRCUIT_SPEC' | 'INVALID_OBSERVABLE' | 'INVALID_SHOT_COUNT' | 'NON_UNITARY_CIRCUIT' | 'SIMULATION_FAILED' | 'UNSUPPORTED_SPEC_VERSION';

export interface RunSuccess {
  ok: true;
  amplitudes: Amplitude[];
  /** Stored outcomes in classical-address order; present when the circuit declares classical bits. */
  classicalRecords?: number[];
}

export interface RunFailure {
  ok: false;
  error: { code: EngineErrorCode };
}

export type RunResult = RunSuccess | RunFailure;

export interface SampleSuccess {
  ok: true;
  shots: number;
  counts: number[];
  /** Histogram of all declared classical bits, c0 as MSB. */
  classicalCounts?: number[];
}

export type SampleResult = SampleSuccess | RunFailure;

/** One weighted Pauli string; label character 0 acts on q0 (MSB). */
export interface PauliTerm {
  coeff: number;
  pauli: string;
}

/** Hamiltonian H = Σ coeff · pauli, sent to the engine as an execution input. */
export interface Observable {
  numQubits: number;
  terms: PauliTerm[];
}

export interface ExpectationSuccess {
  ok: true;
  value: number;
  terms: (PauliTerm & { value: number })[];
}

export type ExpectationResult = ExpectationSuccess | RunFailure;

export interface SampledExpectationSuccess {
  ok: true;
  value: number;
  /** sqrt(Σ coeff² · variance), assuming independent terms. */
  standardError: number;
  totalShots: number;
  /** Identity terms are exact and use 0 shots. */
  terms: (PauliTerm & { shots: number; mean: number; variance: number })[];
}

export type SampledExpectationResult = SampledExpectationSuccess | RunFailure;
