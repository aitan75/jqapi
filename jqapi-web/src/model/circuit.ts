import type { CircuitSpec, Gate } from '../wasm/types';

export const COLUMNS = 8;
export const MAX_QUBITS = 8;

export type SingleQubitFixedKind = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RESET';
export type RotationKind = 'RX' | 'RY' | 'RZ';
export type ControlledKind = 'CNOT' | 'CZ' | 'CY';

export type Placement =
  | { kind: SingleQubitFixedKind }
  | { kind: RotationKind; theta: number }
  | { kind: ControlledKind; role: 'control' | 'target' }
  | { kind: 'SWAP'; role: 'swap' }
  | { kind: 'TOFFOLI'; role: 'control' | 'target' };

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
    this.cells = CircuitModel.emptyGrid(n); // Resizing clears the grid
  }

  place(qubit: number, step: number, p: Placement): void {
    this.cells[qubit][step] = p;
  }

  clear(qubit: number, step: number): void {
    this.cells[qubit][step] = null;
  }

  /** Clears all placed gates on the current grid. */
  reset(): void {
    this.cells = CircuitModel.emptyGrid(this.numQubits);
  }

  cellAt(qubit: number, step: number): Placement | null {
    return this.cells[qubit][step];
  }

  /** Walk columns → levels (dropping empty ones), emitting gates in qubit order. */
  toSpec(): CircuitSpec {
    const levels: { gates: Gate[] }[] = [];
    for (let step = 0; step < COLUMNS; step++) {
      const gates: Gate[] = [];

      const cnotControls: number[] = [];
      const cnotTargets: number[] = [];
      const czControls: number[] = [];
      const czTargets: number[] = [];
      const cyControls: number[] = [];
      const cyTargets: number[] = [];
      const swapNodes: number[] = [];
      const toffoliControls: number[] = [];
      const toffoliTargets: number[] = [];

      for (let q = 0; q < this.numQubits; q++) {
        const c = this.cells[q][step];
        if (!c) continue;

        if (c.kind === 'CNOT') {
          if (c.role === 'control') cnotControls.push(q);
          else cnotTargets.push(q);
        } else if (c.kind === 'CZ') {
          if (c.role === 'control') czControls.push(q);
          else czTargets.push(q);
        } else if (c.kind === 'CY') {
          if (c.role === 'control') cyControls.push(q);
          else cyTargets.push(q);
        } else if (c.kind === 'SWAP') {
          swapNodes.push(q);
        } else if (c.kind === 'TOFFOLI') {
          if (c.role === 'control') toffoliControls.push(q);
          else toffoliTargets.push(q);
        } else if (c.kind === 'RX' || c.kind === 'RY' || c.kind === 'RZ') {
          gates.push({ kind: c.kind, targets: [q], controls: [], params: { theta: c.theta } });
        } else {
          gates.push({ kind: c.kind, targets: [q], controls: [], params: {} });
        }
      }

      // CNOT
      if (cnotControls.length > 0 && cnotTargets.length > 0 && cnotControls[0] !== cnotTargets[0]) {
        gates.push({ kind: 'CNOT', targets: [cnotTargets[0]], controls: [cnotControls[0]], params: {} });
      }
      // CZ
      if (czControls.length > 0 && czTargets.length > 0 && czControls[0] !== czTargets[0]) {
        gates.push({ kind: 'CZ', targets: [czTargets[0]], controls: [czControls[0]], params: {} });
      }
      // CY
      if (cyControls.length > 0 && cyTargets.length > 0 && cyControls[0] !== cyTargets[0]) {
        gates.push({ kind: 'CY', targets: [cyTargets[0]], controls: [cyControls[0]], params: {} });
      }
      // SWAP
      if (swapNodes.length >= 2 && swapNodes[0] !== swapNodes[1]) {
        gates.push({ kind: 'SWAP', targets: [swapNodes[0], swapNodes[1]], controls: [], params: {} });
      }
      // TOFFOLI
      if (toffoliControls.length >= 2 && toffoliTargets.length >= 1) {
        gates.push({
          kind: 'TOFFOLI',
          targets: [toffoliTargets[0]],
          controls: [toffoliControls[0], toffoliControls[1]],
          params: {},
        });
      }

      if (gates.length > 0) levels.push({ gates });
    }
    return { version: 1, numQubits: this.numQubits, levels };
  }
}
