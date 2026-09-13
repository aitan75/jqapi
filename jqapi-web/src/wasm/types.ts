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

export interface RunResult {
  amplitudes: Amplitude[];
}
