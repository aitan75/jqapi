import type { CircuitSpec, RunResult } from './types';
// Vendored TeaVM (Phase 2b) ES module exposing run(specJson) -> resultJson.
import { run as wasmRun } from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
export function run(spec: CircuitSpec): RunResult {
  try {
    return JSON.parse(wasmRun(JSON.stringify(spec))) as RunResult;
  } catch {
    return { ok: false, error: { code: 'SIMULATION_FAILED' } };
  }
}
