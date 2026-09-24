import type { CircuitSpec, RunResult, SampleResult } from './types';
// Vendored TeaVM (Phase 2b) ES module exposing run(specJson) -> resultJson.
import { run as wasmRun, sample as wasmSample } from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
const SUPPORTED_SPEC_VERSION = 2;

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
