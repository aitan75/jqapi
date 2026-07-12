import type { CircuitSpec, Gate } from '../wasm/types';

export const COLUMNS = 8;
export const MAX_QUBITS = 8;

export type Placement =
  | { kind: 'H' | 'X' | 'Z' }
  | { kind: 'CNOT'; role: 'control' | 'target' };

/** Grid model: cells[qubit][step] holds a placement or null. */
export class CircuitModel {
  numQubits: number;
  private cells: (Placement | null)[][];

  constructor(numQubits: number) {
    this.numQubits = numQubits;
    this.cells = CircuitModel.emptyGrid(numQubits);
  }

  private static emptyGrid(n: number): (Placement | null)[][] {
    return Array.from({ length: n }, () => Array<Placement | null>(COLUMNS).fill(null));
  }

  setNumQubits(n: number): void {
    this.numQubits = n;
    this.cells = CircuitModel.emptyGrid(n); // MVP: resizing clears the grid
  }

  place(qubit: number, step: number, p: Placement): void {
    this.cells[qubit][step] = p;
  }

  clear(qubit: number, step: number): void {
    this.cells[qubit][step] = null;
  }

  cellAt(qubit: number, step: number): Placement | null {
    return this.cells[qubit][step];
  }

  /** Walk columns → levels (dropping empty ones), emitting gates in qubit order. */
  toSpec(): CircuitSpec {
    const levels: { gates: Gate[] }[] = [];
    for (let step = 0; step < COLUMNS; step++) {
      const gates: Gate[] = [];
      let controlQubit = -1;
      let targetQubit = -1;
      for (let q = 0; q < this.numQubits; q++) {
        const c = this.cells[q][step];
        if (!c) continue;
        if (c.kind === 'CNOT') {
          if (c.role === 'control') controlQubit = q;
          else targetQubit = q;
        } else {
          gates.push({ kind: c.kind, targets: [q], controls: [], params: {} });
        }
      }
      if (controlQubit >= 0 && targetQubit >= 0 && controlQubit !== targetQubit) {
        gates.push({ kind: 'CNOT', targets: [targetQubit], controls: [controlQubit], params: {} });
      }
      if (gates.length > 0) levels.push({ gates });
    }
    return { version: 1, numQubits: this.numQubits, levels };
  }
}
