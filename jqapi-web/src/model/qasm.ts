import { isCircuitSpec, isUnsupportedCircuitSpec } from './circuit';
import type { CircuitSpec } from '../wasm/types';

/** Adapt only the format version of circuits without classical data; never remap addresses. */
export function editableQasmSpec(spec: CircuitSpec): CircuitSpec {
  const editable: CircuitSpec = spec.version === 2 && (spec.numClassicalBits ?? 0) === 0
    ? { version: 1, numQubits: spec.numQubits, levels: spec.levels }
    : spec;
  if (isUnsupportedCircuitSpec(editable) || !isCircuitSpec(editable)) throw new Error('UNSUPPORTED_EDITOR_QASM');
  return editable;
}
