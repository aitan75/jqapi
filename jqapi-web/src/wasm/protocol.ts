import type { CircuitSpec, Observable, TraceResult, QasmImportResult, QasmExportResult, SampleSuccess, ExpectationResult, SampledExpectationResult, RunFailure } from './types';

export interface Requests {
  trace: { spec: CircuitSpec; seed: number };
  counts: { spec: CircuitSpec; shots: number; observable: Observable | null };
  importQasm: { source: string };
  exportQasm: { spec: CircuitSpec };
}

export interface Responses {
  trace: TraceResult;
  counts: RunFailure | { ok: true; sample: SampleSuccess; exact: ExpectationResult | null; estimate: SampledExpectationResult | null };
  importQasm: QasmImportResult;
  exportQasm: QasmExportResult;
}

export type WorkerRequest = { [K in keyof Requests]: { kind: K } & Requests[K] }[keyof Requests];
