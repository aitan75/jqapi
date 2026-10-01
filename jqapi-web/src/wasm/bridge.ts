import type { CircuitSpec, TraceResult, ExpectationResult, Observable, RunResult, SampledExpectationResult, SampleResult } from './types';
import type { QasmImportResult, QasmExportResult, LintResult, LintRule, QasmLintResult } from './types';
import { importQasm as wasmImportQasm, exportQasm as wasmExportQasm, lint as wasmLint, lintQasm as wasmLintQasm } from './jqapi.js';
// Vendored TeaVM (Phase 2b) ES module exposing run(specJson) -> resultJson.
import { trace as wasmTrace, expectation as wasmExpectation, run as wasmRun, sample as wasmSample, sampleExpectation as wasmSampleExpectation } from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
const SUPPORTED_SPEC_VERSION = 2;

export function importQasm(source: string): QasmImportResult {
  try { return JSON.parse(wasmImportQasm(source)) as QasmImportResult; }
  catch { return { ok: false, error: { code: 'SIMULATION_FAILED' } }; }
}

export function exportQasm(spec: CircuitSpec): QasmExportResult {
  try { return JSON.parse(wasmExportQasm(JSON.stringify(spec))) as QasmExportResult; }
  catch { return { ok: false, error: { code: 'SIMULATION_FAILED' } }; }
}

/** Educational diagnostics only: never simulates and never changes the circuit. Disabled rules are skipped before the cap. */
export function lint(spec: CircuitSpec, disabledRules: LintRule[] = []): LintResult {
  try { return JSON.parse(wasmLint(JSON.stringify(spec), disabledRules.join(','))) as LintResult; }
  catch { return { ok: false, error: { code: 'SIMULATION_FAILED' } }; }
}

/** Parses and lints QASM source; syntax errors come back as INVALID_QASM, never as diagnostics. */
export function lintQasm(source: string, disabledRules: LintRule[] = []): QasmLintResult {
  try { return JSON.parse(wasmLintQasm(source, disabledRules.join(','))) as QasmLintResult; }
  catch { return { ok: false, error: { code: 'SIMULATION_FAILED' } }; }
}

export function run(spec: CircuitSpec): RunResult {
  if (spec.version !== 1 && spec.version !== SUPPORTED_SPEC_VERSION) {
    return { ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } };
  }
  try {
    return JSON.parse(wasmRun(JSON.stringify(spec))) as RunResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}

/** Samples a circuit independently, up to the WASM engine's 10,000-shot limit. */
export function sample(spec: CircuitSpec, shots: number): SampleResult {
  if (spec.version !== 1 && spec.version !== SUPPORTED_SPEC_VERSION) {
    return { ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } };
  }
  if (!Number.isInteger(shots) || shots < 1 || shots > 10_000) {
    return { ok: false, error: { code: 'INVALID_SHOT_COUNT' } };
  }
  try {
    return JSON.parse(wasmSample(JSON.stringify(spec), shots)) as SampleResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}

/** Exact ⟨H⟩ of the final state; circuits with measurement/reset/conditions return NON_UNITARY_CIRCUIT. */
export function expectation(spec: CircuitSpec, observable: Observable): ExpectationResult {
  if (spec.version !== 1 && spec.version !== SUPPORTED_SPEC_VERSION) {
    return { ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } };
  }
  try {
    return JSON.parse(wasmExpectation(JSON.stringify(spec), JSON.stringify(observable))) as ExpectationResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}

/** Shot-based ⟨H⟩ with 2 to 10,000 shots per non-identity term. */
export function sampleExpectation(spec: CircuitSpec, observable: Observable, shots: number): SampledExpectationResult {
  if (spec.version !== 1 && spec.version !== SUPPORTED_SPEC_VERSION) {
    return { ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } };
  }
  if (!Number.isInteger(shots) || shots < 2 || shots > 10_000) {
    return { ok: false, error: { code: 'INVALID_SHOT_COUNT' } };
  }
  try {
    return JSON.parse(wasmSampleExpectation(JSON.stringify(spec), JSON.stringify(observable), shots)) as SampledExpectationResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}

/** One reproducible trajectory; changing the frame never runs the simulator again. */
export function trace(spec: CircuitSpec, seed: number): TraceResult {
  if (spec.version !== 1 && spec.version !== 2) return { ok: false, error: { code: 'UNSUPPORTED_SPEC_VERSION' } };
  try {
    return JSON.parse(wasmTrace(JSON.stringify(spec), seed)) as TraceResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}
