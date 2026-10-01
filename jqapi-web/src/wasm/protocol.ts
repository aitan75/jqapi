import type { CircuitSpec, Observable, TraceResult, QasmImportResult, QasmExportResult, LintResult, LintRule, QasmLintResult, SampleSuccess, ExpectationResult, SampledExpectationResult, RunFailure } from './types';

export interface Requests {
  trace: { spec: CircuitSpec; seed: number };
  counts: { spec: CircuitSpec; shots: number; observable: Observable | null };
  importQasm: { source: string };
  exportQasm: { spec: CircuitSpec };
  lint: { spec: CircuitSpec; disabledRules: LintRule[] };
  lintQasm: { source: string; disabledRules: LintRule[] };
}

export interface Responses {
  trace: TraceResult;
  counts: RunFailure | { ok: true; sample: SampleSuccess; exact: ExpectationResult | null; estimate: SampledExpectationResult | null };
  importQasm: QasmImportResult;
  exportQasm: QasmExportResult;
  lint: LintResult;
  lintQasm: QasmLintResult;
}

export type WorkerRequest = { [K in keyof Requests]: { kind: K } & Requests[K] }[keyof Requests];
