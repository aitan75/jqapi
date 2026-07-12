import type { CircuitSpec, RunResult } from './types';
// Vendored TeaVM (Phase 2b) CommonJS module exposing run(specJson) -> resultJson.
// Vite/esbuild provides the default-import interop for the CJS `exports`.
import jqapi from './jqapi.js';

/** Runs a circuit spec through the WASM simulator and returns its state-vector amplitudes. */
export function run(spec: CircuitSpec): RunResult {
  const out = jqapi.run(JSON.stringify(spec));
  return JSON.parse(out) as RunResult;
}
