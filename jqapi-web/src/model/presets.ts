import type { CircuitModel } from './circuit';
import type { PresetId } from '../i18n';

export interface Preset {
  id: PresetId;
  qubits: number;
  load: (model: CircuitModel) => void;
}

export const PRESETS: Preset[] = [
  {
    id: 'bell-phi-plus',
    qubits: 2,
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'CNOT', role: 'control' });
      model.place(1, 1, { kind: 'CNOT', role: 'target' });
    },
  },
  {
    id: 'bell-psi-plus',
    qubits: 2,
    load: (model) => {
      model.place(1, 0, { kind: 'X' });
      model.place(0, 1, { kind: 'H' });
      model.place(0, 2, { kind: 'CNOT', role: 'control' });
      model.place(1, 2, { kind: 'CNOT', role: 'target' });
    },
  },
  {
    id: 'ghz-state',
    qubits: 3,
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'CNOT', role: 'control' });
      model.place(1, 1, { kind: 'CNOT', role: 'target' });
      model.place(0, 2, { kind: 'CNOT', role: 'control' });
      model.place(2, 2, { kind: 'CNOT', role: 'target' });
    },
  },
  {
    id: 'superposition-3q',
    qubits: 3,
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(1, 0, { kind: 'H' });
      model.place(2, 0, { kind: 'H' });
    },
  },
  {
    id: 'interference-hzh',
    qubits: 1,
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'Z' });
      model.place(0, 2, { kind: 'H' });
    },
  },
  {
    id: 'superdense-coding',
    qubits: 2,
    load: (model) => {
      // Bell pair
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'CNOT', role: 'control' });
      model.place(1, 1, { kind: 'CNOT', role: 'target' });
      // Alice encoding
      model.place(0, 2, { kind: 'Z' });
      model.place(0, 3, { kind: 'X' });
      // Bob decoding
      model.place(0, 4, { kind: 'CNOT', role: 'control' });
      model.place(1, 4, { kind: 'CNOT', role: 'target' });
      model.place(0, 5, { kind: 'H' });
    },
  },
  {
    id: 'deutsch-algorithm',
    qubits: 2,
    load: (model) => {
      model.place(1, 0, { kind: 'X' });
      model.place(0, 1, { kind: 'H' });
      model.place(1, 1, { kind: 'H' });
      model.place(0, 2, { kind: 'CNOT', role: 'control' });
      model.place(1, 2, { kind: 'CNOT', role: 'target' });
      model.place(0, 3, { kind: 'H' });
    },
  },
];
