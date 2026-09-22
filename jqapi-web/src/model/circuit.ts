import type { CircuitSpec, ComplexMatrix, Gate } from '../wasm/types';

export const DEFAULT_COLUMNS = 8;
export const MAX_QUBITS = 8;
/** CircuitSpec format version supported by the editor (mirrors `CircuitSpec.CURRENT_VERSION`). */
export const CURRENT_VERSION = 1;
/** Mirrors `CircuitSpecJson.MAX_GATES`: total gate placements accepted from untrusted input. */
export const MAX_GATES = 100_000;
/** Upper bound on levels accepted from untrusted input; bounds the editor grid before it is built. */
export const MAX_LEVELS = 100_000;

export const PAULI_X_MATRIX: ComplexMatrix = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
];

export function phaseMatrix(theta: number): ComplexMatrix {
  return [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: Math.cos(theta), im: Math.sin(theta) }],
  ];
}

export type SingleQubitFixedKind = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'MEASUREMENT' | 'RESET';
export type RotationKind = 'RX' | 'RY' | 'RZ' | 'PHASE';
export type ControlledKind = 'CNOT' | 'CZ' | 'CY';
export type MatrixKind = 'ORACLE' | 'GENERIC';

export type Placement =
  | { kind: SingleQubitFixedKind }
  | { kind: RotationKind; theta: number }
  | { kind: 'U3'; theta: number; phi: number; lambda: number }
  | { kind: ControlledKind; role: 'control' | 'target' }
  | { kind: 'CONTROLLED_PHASE'; role: 'control' | 'target'; theta: number }
  | { kind: 'SWAP'; role: 'swap' }
  | { kind: 'CSWAP'; role: 'control' | 'swap' }
  | { kind: 'TOFFOLI'; role: 'control' | 'target' }
  | { kind: 'MULTI_CONTROLLED'; role: 'control' | 'target' }
  | { kind: MatrixKind; matrix: ComplexMatrix };

export interface EditorState {
  numQubits: number;
  columns: number;
  cells: (Placement | null)[][];
}

/** Mutable grid, kept separate from React so serialization stays CircuitSpec-compatible. */
export class CircuitModel {
  numQubits: number;
  columns: number;
  private cells: (Placement | null)[][];

  constructor(numQubits: number, columns = DEFAULT_COLUMNS) {
    this.numQubits = numQubits;
    this.columns = columns;
    this.cells = CircuitModel.emptyGrid(numQubits, columns);
  }

  private static emptyGrid(qubits: number, columns: number): (Placement | null)[][] {
    return Array.from({ length: qubits }, () => Array<Placement | null>(columns).fill(null));
  }

  private resize(qubits: number, columns: number): void {
    const next = CircuitModel.emptyGrid(qubits, columns);
    for (let q = 0; q < Math.min(qubits, this.numQubits); q++) {
      for (let step = 0; step < Math.min(columns, this.columns); step++) next[q][step] = this.cells[q][step];
    }
    this.numQubits = qubits;
    this.columns = columns;
    this.cells = next;
  }

  setNumQubits(n: number): void {
    this.resize(n, this.columns);
  }

  setColumns(n: number): void {
    this.resize(this.numQubits, n);
  }

  /**
   * Inserts the exact forward QFT for a contiguous register beginning at
   * {@code firstQubit}. The selected qubit is the register's MSB, matching the
   * core Qft builder and the editor's qubit ordering.
   */
  insertForwardQft(firstQubit: number, step: number, qubitCount: number): void {
    if (!Number.isInteger(firstQubit) || firstQubit < 0 || firstQubit >= this.numQubits) throw new Error('Choose a valid QFT starting qubit.');
    if (!Number.isInteger(qubitCount) || qubitCount < 1 || firstQubit + qubitCount > this.numQubits) throw new Error('The QFT register must fit on the selected wire and following wires.');
    if (!Number.isInteger(step) || step < 0 || step > this.columns) throw new Error('Choose a valid QFT insertion step.');

    const levels: { qubit: number; placement: Placement }[][] = [];
    for (let targetOffset = 0; targetOffset < qubitCount; targetOffset++) {
      const target = firstQubit + targetOffset;
      levels.push([{ qubit: target, placement: { kind: 'H' } }]);
      for (let controlOffset = targetOffset + 1; controlOffset < qubitCount; controlOffset++) {
        const control = firstQubit + controlOffset;
        const theta = Math.PI / 2 ** (controlOffset - targetOffset);
        levels.push([
          { qubit: control, placement: { kind: 'CONTROLLED_PHASE', role: 'control', theta } },
          { qubit: target, placement: { kind: 'CONTROLLED_PHASE', role: 'target', theta } },
        ]);
      }
    }
    if (qubitCount > 1) {
      const swaps: { qubit: number; placement: Placement }[] = [];
      for (let low = 0, high = qubitCount - 1; low < high; low++, high--) {
        swaps.push({ qubit: firstQubit + low, placement: { kind: 'SWAP', role: 'swap' } });
        swaps.push({ qubit: firstQubit + high, placement: { kind: 'SWAP', role: 'swap' } });
      }
      levels.push(swaps);
    }

    this.cells.forEach((row) => row.splice(step, 0, ...Array<Placement | null>(levels.length).fill(null)));
    this.columns += levels.length;
    levels.forEach((level, offset) => level.forEach(({ qubit, placement }) => this.place(qubit, step + offset, placement)));
  }

  place(qubit: number, step: number, placement: Placement): void {
    this.cells[qubit][step] = placement;
  }

  clear(qubit: number, step: number): void {
    this.cells[qubit][step] = null;
  }

  reset(): void {
    this.cells = CircuitModel.emptyGrid(this.numQubits, this.columns);
  }

  cellAt(qubit: number, step: number): Placement | null {
    return this.cells[qubit][step];
  }

  private cellsForGate(qubit: number, step: number): { qubit: number; cell: Placement }[] {
    const source = this.cellAt(qubit, step);
    if (!source) return [];
    return 'role' in source
      ? this.cells.flatMap((row, sourceQubit) => {
        const cell = row[step];
        return cell && 'role' in cell && cell.kind === source.kind ? [{ qubit: sourceQubit, cell }] : [];
      })
      : [{ qubit, cell: source }];
  }

  /** Removes a gate as one unit, including every control and target. */
  removeGate(qubit: number, step: number): boolean {
    const cells = this.cellsForGate(qubit, step);
    if (!cells.length) return false;
    cells.forEach(({ qubit: sourceQubit }) => this.clear(sourceQubit, step));
    return true;
  }

  /** Moves a gate as one unit, preserving every control and target placement. */
  moveGate(fromQubit: number, fromStep: number, toQubit: number, toStep: number): boolean {
    const cells = this.cellsForGate(fromQubit, fromStep);
    if (!cells.length) return false;
    const qubitOffset = toQubit - fromQubit;
    const sources = new Set(cells.map(({ qubit }) => `${qubit}:${fromStep}`));

    if (cells.some(({ qubit }) => {
      const destinationQubit = qubit + qubitOffset;
      if (destinationQubit < 0 || destinationQubit >= this.numQubits) return true;
      const destination = this.cellAt(destinationQubit, toStep);
      return Boolean(destination && !sources.has(`${destinationQubit}:${toStep}`));
    })) return false;

    cells.forEach(({ qubit }) => this.clear(qubit, fromStep));
    cells.forEach(({ qubit, cell }) => this.place(qubit + qubitOffset, toStep, cell));
    return true;
  }

  snapshot(): EditorState {
    return structuredClone({ numQubits: this.numQubits, columns: this.columns, cells: this.cells });
  }

  restore(state: EditorState): void {
    this.numQubits = state.numQubits;
    this.columns = state.columns;
    this.cells = structuredClone(state.cells);
  }

  /** Rebuilds the editable subset of CircuitSpec used by this editor. */
  static fromSpec(spec: CircuitSpec): CircuitModel {
    if (!isCircuitSpec(spec)) throw new Error('Invalid CircuitSpec');
    const model = new CircuitModel(spec.numQubits, Math.max(DEFAULT_COLUMNS, spec.levels.length));
    spec.levels.forEach((level, step) => level.gates.forEach((gate) => model.placeGate(step, gate)));
    return model;
  }

  private placeGate(step: number, gate: Gate): void {
    const target = gate.targets[0];
    if (target === undefined) throw new Error(`${gate.kind} requires a target`);
    const putControls = (kind: 'CNOT' | 'CZ' | 'CY' | 'TOFFOLI' | 'MULTI_CONTROLLED') => {
      gate.controls.forEach((q) => this.place(q, step, { kind, role: 'control' }));
      this.place(target, step, { kind, role: 'target' });
    };
    if (gate.kind === 'CNOT' || gate.kind === 'CZ' || gate.kind === 'CY') return putControls(gate.kind);
    if (gate.kind === 'TOFFOLI') return putControls(gate.kind);
    if (gate.kind === 'MULTI_CONTROLLED') {
      const theta = controlledPhaseAngle(gate.matrix);
      if (gate.controls.length === 1 && theta !== null) {
        this.place(gate.controls[0], step, { kind: 'CONTROLLED_PHASE', role: 'control', theta });
        this.place(target, step, { kind: 'CONTROLLED_PHASE', role: 'target', theta });
        return;
      }
      return putControls(gate.kind);
    }
    if (gate.kind === 'SWAP') {
      gate.targets.forEach((q) => this.place(q, step, { kind: 'SWAP', role: 'swap' }));
      return;
    }
    if (gate.kind === 'CSWAP') {
      gate.controls.forEach((q) => this.place(q, step, { kind: 'CSWAP', role: 'control' }));
      gate.targets.forEach((q) => this.place(q, step, { kind: 'CSWAP', role: 'swap' }));
      return;
    }
    if (gate.kind === 'RX' || gate.kind === 'RY' || gate.kind === 'RZ' || gate.kind === 'PHASE') {
      this.place(target, step, { kind: gate.kind, theta: gate.params.theta });
      return;
    }
    if (gate.kind === 'U3') {
      this.place(target, step, { kind: 'U3', theta: gate.params.theta, phi: gate.params.phi, lambda: gate.params.lambda });
      return;
    }
    if (gate.kind === 'ORACLE' || gate.kind === 'GENERIC') {
      if (!gate.matrix) throw new Error(`${gate.kind} requires a matrix`);
      this.place(target, step, { kind: gate.kind, matrix: gate.matrix });
      return;
    }
    if (gate.targets.length !== 1) throw new Error(`${gate.kind} is not supported by the editor`);
    this.place(target, step, { kind: gate.kind as SingleQubitFixedKind });
  }

  /** Walk columns → levels (dropping empty columns), emitting gates in qubit order. */
  toSpec(): CircuitSpec {
    const levels: { gates: Gate[] }[] = [];
    for (let step = 0; step < this.columns; step++) {
      const gates: Gate[] = [];
      const controls: Record<string, number[]> = { CNOT: [], CZ: [], CY: [], TOFFOLI: [], MULTI_CONTROLLED: [], CSWAP: [] };
      const targets: Record<string, number[]> = { CNOT: [], CZ: [], CY: [], TOFFOLI: [], MULTI_CONTROLLED: [], CSWAP: [] };
      const phaseControls: { qubit: number; theta: number }[] = [];
      const phaseTargets: { qubit: number; theta: number }[] = [];
      const swaps: number[] = [];

      for (let q = 0; q < this.numQubits; q++) {
        const cell = this.cells[q][step];
        if (!cell) continue;
        if (cell.kind === 'CNOT' || cell.kind === 'CZ' || cell.kind === 'CY' || cell.kind === 'TOFFOLI' || cell.kind === 'MULTI_CONTROLLED') {
          (cell.role === 'control' ? controls[cell.kind] : targets[cell.kind]).push(q);
        } else if (cell.kind === 'CONTROLLED_PHASE') {
          (cell.role === 'control' ? phaseControls : phaseTargets).push({ qubit: q, theta: cell.theta });
        } else if (cell.kind === 'CSWAP') {
          (cell.role === 'control' ? controls.CSWAP : targets.CSWAP).push(q);
        } else if (cell.kind === 'SWAP') {
          swaps.push(q);
        } else if (cell.kind === 'RX' || cell.kind === 'RY' || cell.kind === 'RZ' || cell.kind === 'PHASE') {
          gates.push({ kind: cell.kind, targets: [q], controls: [], params: { theta: cell.theta } });
        } else if (cell.kind === 'U3') {
          gates.push({ kind: 'U3', targets: [q], controls: [], params: { theta: cell.theta, phi: cell.phi, lambda: cell.lambda } });
        } else if (cell.kind === 'ORACLE' || cell.kind === 'GENERIC') {
          gates.push({ kind: cell.kind, targets: [q], controls: [], params: {}, matrix: cell.matrix });
        } else {
          gates.push({ kind: cell.kind, targets: [q], controls: [], params: {} });
        }
      }

      for (const kind of ['CNOT', 'CZ', 'CY'] as const) {
        if (controls[kind].length && targets[kind].length) gates.push({ kind, targets: [targets[kind][0]], controls: [controls[kind][0]], params: {} });
      }
      if (swaps.length >= 2) gates.push({ kind: 'SWAP', targets: swaps.slice(0, 2), controls: [], params: {} });
      if (controls.CSWAP.length && targets.CSWAP.length >= 2) gates.push({ kind: 'CSWAP', targets: targets.CSWAP.slice(0, 2), controls: [controls.CSWAP[0]], params: {} });
      if (controls.TOFFOLI.length >= 2 && targets.TOFFOLI.length) gates.push({ kind: 'TOFFOLI', targets: [targets.TOFFOLI[0]], controls: controls.TOFFOLI.slice(0, 2), params: {} });
      if (controls.MULTI_CONTROLLED.length && targets.MULTI_CONTROLLED.length) gates.push({ kind: 'MULTI_CONTROLLED', targets: [targets.MULTI_CONTROLLED[0]], controls: controls.MULTI_CONTROLLED, params: {}, matrix: PAULI_X_MATRIX });
      if (phaseControls.length && phaseTargets.length) gates.push({ kind: 'MULTI_CONTROLLED', targets: [phaseTargets[0].qubit], controls: [phaseControls[0].qubit], params: {}, matrix: phaseMatrix(phaseTargets[0].theta) });
      if (gates.length) levels.push({ gates });
    }
    return { version: CURRENT_VERSION, numQubits: this.numQubits, levels };
  }
}

const SINGLE_QUBIT_KINDS = new Set(['H', 'X', 'Y', 'Z', 'S', 'T', 'MEASUREMENT', 'RESET']);
const ROTATION_KINDS = new Set(['RX', 'RY', 'RZ', 'PHASE']);
const CONTROLLED_KINDS = new Set(['CNOT', 'CZ', 'CY']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIndex(value: unknown, numQubits: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < numQubits;
}

function isIndexArray(value: unknown, numQubits: number): value is number[] {
  return Array.isArray(value) && value.every((index) => isIndex(index, numQubits));
}

function isComplexMatrix(value: unknown, dimension: number): boolean {
  if (!Array.isArray(value) || value.length !== dimension) return false;
  return value.every((row) => Array.isArray(row)
    && row.length === dimension
    && row.every((cell) => isRecord(cell) && isFiniteNumber(cell.re) && isFiniteNumber(cell.im)));
}

function controlledPhaseAngle(matrix: ComplexMatrix | undefined): number | null {
  if (!matrix || !isComplexMatrix(matrix, 2)) return null;
  const [[topLeft, topRight], [bottomLeft, bottomRight]] = matrix;
  const close = (value: number, expected: number) => Math.abs(value - expected) < 1e-12;
  if (!close(topLeft.re, 1) || !close(topLeft.im, 0) || !close(topRight.re, 0) || !close(topRight.im, 0) || !close(bottomLeft.re, 0) || !close(bottomLeft.im, 0)) return null;
  if (!close(bottomRight.re ** 2 + bottomRight.im ** 2, 1)) return null;
  return Math.atan2(bottomRight.im, bottomRight.re);
}

function hasUniqueIndexes(indexes: number[]): boolean {
  return new Set(indexes).size === indexes.length;
}

function areDisjoint(a: number[], b: number[]): boolean {
  const seen = new Set(a);
  return b.every((index) => !seen.has(index));
}

function isGate(value: unknown, numQubits: number): boolean {
  if (!isRecord(value)) return false;
  const { kind, targets, controls, params, matrix } = value;
  if (typeof kind !== 'string') return false;
  if (!isIndexArray(targets, numQubits) || !isIndexArray(controls, numQubits)) return false;
  if (!hasUniqueIndexes(targets) || !hasUniqueIndexes(controls) || !areDisjoint(targets, controls)) return false;
  if (!isRecord(params) || !Object.values(params).every(isFiniteNumber)) return false;

  if (CONTROLLED_KINDS.has(kind)) return targets.length === 1 && controls.length === 1;
  if (kind === 'SWAP') return targets.length === 2 && controls.length === 0;
  if (kind === 'CSWAP') return targets.length === 2 && controls.length === 1;
  if (kind === 'TOFFOLI') return targets.length === 1 && controls.length === 2;
  if (kind === 'MULTI_CONTROLLED') {
    return targets.length === 1 && controls.length >= 1 && isComplexMatrix(matrix, 2 ** targets.length);
  }
  if (ROTATION_KINDS.has(kind)) return targets.length === 1 && controls.length === 0 && isFiniteNumber(params.theta);
  if (kind === 'U3') {
    return targets.length === 1 && controls.length === 0
      && isFiniteNumber(params.theta) && isFiniteNumber(params.phi) && isFiniteNumber(params.lambda);
  }
  if (kind === 'ORACLE' || kind === 'GENERIC') {
    return targets.length === 1 && controls.length === 0 && isComplexMatrix(matrix, 2 ** targets.length);
  }
  if (SINGLE_QUBIT_KINDS.has(kind)) return targets.length === 1 && controls.length === 0;
  return false;
}

/**
 * Structural guard for untrusted `CircuitSpec` payloads (shared-circuit URL
 * fragments and loaded JSON files). Validates shape, qubit bounds, unique and
 * disjoint indexes, per-kind arity, `2^n × 2^n` matrices, and the level/gate
 * limits, so a malformed payload is rejected before it can build a
 * `CircuitModel` or reach the WASM bridge as a trusted spec.
 */
export function isCircuitSpec(value: unknown): value is CircuitSpec {
  if (!isRecord(value)) return false;
  const { version, numQubits, levels } = value;
  if (version !== CURRENT_VERSION || !Number.isInteger(numQubits)) return false;
  const qubits = numQubits as number;
  if (qubits < 1 || qubits > MAX_QUBITS) return false;
  if (!Array.isArray(levels) || levels.length > MAX_LEVELS) return false;
  let gateCount = 0;
  for (const level of levels) {
    if (!isRecord(level) || !Array.isArray(level.gates)) return false;
    gateCount += level.gates.length;
    if (gateCount > MAX_GATES) return false;
    if (!level.gates.every((gate) => isGate(gate, qubits))) return false;
  }
  return true;
}
