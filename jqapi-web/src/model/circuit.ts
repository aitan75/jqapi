import type { CircuitSpec, ComplexMatrix, Gate } from '../wasm/types';

export const DEFAULT_COLUMNS = 8;
export const MAX_QUBITS = 8;

export const PAULI_X_MATRIX: ComplexMatrix = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
];

export type SingleQubitFixedKind = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'MEASUREMENT' | 'RESET';
export type RotationKind = 'RX' | 'RY' | 'RZ' | 'PHASE';
export type ControlledKind = 'CNOT' | 'CZ' | 'CY';
export type MatrixKind = 'ORACLE' | 'GENERIC';

export type Placement =
  | { kind: SingleQubitFixedKind }
  | { kind: RotationKind; theta: number }
  | { kind: 'U3'; theta: number; phi: number; lambda: number }
  | { kind: ControlledKind; role: 'control' | 'target' }
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
    if (gate.kind === 'TOFFOLI' || gate.kind === 'MULTI_CONTROLLED') return putControls(gate.kind);
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
      const swaps: number[] = [];

      for (let q = 0; q < this.numQubits; q++) {
        const cell = this.cells[q][step];
        if (!cell) continue;
        if (cell.kind === 'CNOT' || cell.kind === 'CZ' || cell.kind === 'CY' || cell.kind === 'TOFFOLI' || cell.kind === 'MULTI_CONTROLLED') {
          (cell.role === 'control' ? controls[cell.kind] : targets[cell.kind]).push(q);
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
      if (gates.length) levels.push({ gates });
    }
    return { version: 1, numQubits: this.numQubits, levels };
  }
}
