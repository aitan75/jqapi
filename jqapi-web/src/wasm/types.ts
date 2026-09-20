export interface Gate {
  kind: string;
  targets: number[];
  controls: number[];
  params: Record<string, number>;
  matrix?: ComplexMatrix;
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
  levels: Level[];
}

export interface Amplitude {
  re: number;
  im: number;
}

export type EngineErrorCode = 'INPUT_LIMIT_EXCEEDED' | 'INVALID_CIRCUIT_SPEC' | 'INVALID_SHOT_COUNT' | 'SIMULATION_FAILED';

export interface RunSuccess {
  ok: true;
  amplitudes: Amplitude[];
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
}

export type SampleResult = SampleSuccess | RunFailure;
