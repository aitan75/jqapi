import type { CircuitModel } from './circuit';

export interface Preset {
  id: string;
  name: string;
  badge: string;
  qubits: number;
  description: string;
  load: (model: CircuitModel) => void;
}

export const PRESETS: Preset[] = [
  {
    id: 'bell-phi-plus',
    name: 'Bell State |Φ⁺⟩',
    badge: '2 Qubits',
    qubits: 2,
    description: 'Fundamental quantum entanglement: generates the state (|00⟩ + |11⟩)/√2 using a Hadamard gate and CNOT.',
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'CNOT', role: 'control' });
      model.place(1, 1, { kind: 'CNOT', role: 'target' });
    },
  },
  {
    id: 'bell-psi-plus',
    name: 'Bell State |Ψ⁺⟩',
    badge: '2 Qubits',
    qubits: 2,
    description: 'Odd-parity Bell state: generates the state (|01⟩ + |10⟩)/√2 with an initial X gate on q1.',
    load: (model) => {
      model.place(1, 0, { kind: 'X' });
      model.place(0, 1, { kind: 'H' });
      model.place(0, 2, { kind: 'CNOT', role: 'control' });
      model.place(1, 2, { kind: 'CNOT', role: 'target' });
    },
  },
  {
    id: 'ghz-state',
    name: 'GHZ State |GHZ⟩',
    badge: '3 Qubits',
    qubits: 3,
    description: 'Three-qubit Greenberger-Horne-Zeilinger entanglement: generates the state (|000⟩ + |111⟩)/√2.',
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
    name: 'Uniform Superposition',
    badge: '3 Qubits',
    qubits: 3,
    description: 'Parallel Hadamard gates create a uniform superposition with a 12.5% probability for each of the eight states.',
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(1, 0, { kind: 'H' });
      model.place(2, 0, { kind: 'H' });
    },
  },
  {
    id: 'interference-hzh',
    name: 'Quantum Interference (H-Z-H)',
    badge: '1 Qubit',
    qubits: 1,
    description: 'Constructive and destructive interference: demonstrates how the Z phase gate reverses the result back to the pure |1⟩ state.',
    load: (model) => {
      model.place(0, 0, { kind: 'H' });
      model.place(0, 1, { kind: 'Z' });
      model.place(0, 2, { kind: 'H' });
    },
  },
  {
    id: 'superdense-coding',
    name: 'Superdense Coding (Messaggio 11)',
    badge: '2 Qubits',
    qubits: 2,
    description: 'Superdense coding protocol: transmits two classical bits (11) by sending a single entangled qubit, then decodes them with Bob.',
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
    name: 'Deutsch Algorithm (Oracle f(x)=x)',
    badge: '2 Qubits',
    qubits: 2,
    description: 'Quantum speedup demonstration: determines with one query whether a Boolean function is constant or balanced.',
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
