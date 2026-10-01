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

/** Text offsets [start, end) from a 1-based line/column to the end of that line, for selecting a diagnostic. */
export function lineSelection(source: string, line: number, column: number): [number, number] {
  const lines = source.split('\n');
  const index = Math.min(Math.max(line, 1), lines.length) - 1;
  const start = lines.slice(0, index).reduce((offset, text) => offset + text.length + 1, 0);
  return [start + Math.min(column - 1, lines[index].length), start + lines[index].replace(/\r$/, '').length];
}
