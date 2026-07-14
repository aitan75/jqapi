import type { CircuitSpec, RunResult } from './types';
// Vendored TeaVM (Phase 2b) ES module exposing run(specJson) -> resultJson.
import { run as wasmRun } from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
export function run(spec: CircuitSpec): RunResult {
  const out = wasmRun(JSON.stringify(spec));
  return JSON.parse(out) as RunResult;
}
