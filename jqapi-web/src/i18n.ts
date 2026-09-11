export const LANGUAGE_STORAGE_KEY = 'jqapi-language';

export type Language = 'en' | 'it';

export type GateTool =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RX' | 'RY' | 'RZ'
  | 'CNOT-control' | 'CNOT-target' | 'CZ-control' | 'CZ-target'
  | 'CY-control' | 'CY-target' | 'SWAP' | 'TOFFOLI-control'
  | 'TOFFOLI-target' | 'RESET' | 'erase';

export type PresetId =
  | 'bell-phi-plus' | 'bell-psi-plus' | 'ghz-state' | 'superposition-3q'
  | 'interference-hzh' | 'superdense-coding' | 'deutsch-algorithm';

export interface Messages {
  language: string;
  languages: Record<Language, string>;
  appName: string;
  logo: string;
  appSubtitle: string;
  wasmEngine: string;
  qubitCount: (count: number) => string;
  runSimulation: string;
  clickToDismiss: string;
  dismiss: string;
  qubits: string;
  gatePalette: string;
  gate: string;
  rotationAngle: string;
  radians: string;
  presetCircuits: string;
  clearCircuit: string;
  clearCircuitTitle: string;
  presetDescription: string;
  canvasHint: string;
  stateAmplitudesAndProbabilities: string;
  runToSeeResults: string;
  stateVectorAndOutcomeProbabilities: string;
  basisStates: (count: number, qubits: number) => string;
  stateProbability: (state: string, percentage: string) => string;
  complexAmplitude: string;
  errors: Record<EngineErrorCode, string>;
  tools: Record<GateTool, string>;
  presets: Record<PresetId, { name: string; description: string }>;
}

export const messages: Record<Language, Messages> = {
  en: {
    language: 'Language', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'jqapi logo',
    appSubtitle: 'Quantum Circuit Simulator', wasmEngine: '● WASM Engine',
    qubitCount: (count) => `${count} Qubits`, runSimulation: 'Run Simulation',
    clickToDismiss: 'Click to dismiss', dismiss: 'Dismiss', qubits: 'Qubits:',
    gatePalette: 'Expanded Quantum Gates Palette', gate: 'gate', rotationAngle: 'Rotation Angle (θ):', radians: 'rad',
    presetCircuits: 'Preset Circuits', clearCircuit: 'Clear Circuit',
    clearCircuitTitle: 'Clear all gates from the circuit',
    presetDescription: 'Choose a quantum state or a well-known algorithm to load and run instantly.',
    canvasHint: 'Click any cell to place the selected gate or erase. Multi-qubit gates connect automatically when placed on the same step.',
    stateAmplitudesAndProbabilities: 'State Amplitudes & Probabilities',
    runToSeeResults: 'Click Run to execute the circuit on the local WASM engine.',
    stateVectorAndOutcomeProbabilities: 'State Vector & Outcome Probabilities',
    basisStates: (count, qubits) => `${count} basis states (2^${qubits})`,
    stateProbability: (state, percentage) => `State ${state}: ${percentage}%`,
    complexAmplitude: 'Complex amplitude (re + im·i)',
    errors: {
      INPUT_LIMIT_EXCEEDED: 'The circuit exceeds the supported simulation limits.',
      INVALID_CIRCUIT_SPEC: 'The circuit contains an invalid gate or configuration.',
      SIMULATION_FAILED: 'The circuit could not be simulated. Please try again.',
    },
    tools: {
      H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)',
      RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', 'CNOT-control': 'CNOT ctrl', 'CNOT-target': 'CNOT tgt',
      'CZ-control': 'CZ ctrl', 'CZ-target': 'CZ tgt', 'CY-control': 'CY ctrl', 'CY-target': 'CY tgt',
      SWAP: 'SWAP', 'TOFFOLI-control': 'Toffoli ctrl', 'TOFFOLI-target': 'Toffoli tgt', RESET: 'Reset', erase: 'Erase',
    },
    presets: {
      'bell-phi-plus': { name: 'Bell State |Φ⁺⟩', description: 'Fundamental quantum entanglement: generates the state (|00⟩ + |11⟩)/√2 using a Hadamard gate and CNOT.' },
      'bell-psi-plus': { name: 'Bell State |Ψ⁺⟩', description: 'Odd-parity Bell state: generates the state (|01⟩ + |10⟩)/√2 with an initial X gate on q1.' },
      'ghz-state': { name: 'GHZ State |GHZ⟩', description: 'Three-qubit Greenberger-Horne-Zeilinger entanglement: generates the state (|000⟩ + |111⟩)/√2.' },
      'superposition-3q': { name: 'Uniform Superposition', description: 'Parallel Hadamard gates create a uniform superposition with a 12.5% probability for each of the eight states.' },
      'interference-hzh': { name: 'Quantum Interference (H-Z-H)', description: 'Constructive and destructive interference: the Z phase gate returns the state to pure |1⟩.' },
      'superdense-coding': { name: 'Superdense Coding (Message 11)', description: 'Transmits two classical bits (11) by sending one entangled qubit, then decodes them with Bob.' },
      'deutsch-algorithm': { name: 'Deutsch Algorithm (Oracle f(x)=x)', description: 'Determines with one query whether a Boolean function is constant or balanced.' },
    },
  },
  it: {
    language: 'Lingua', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'logo jqapi',
    appSubtitle: 'Simulatore di circuiti quantistici', wasmEngine: '● Motore WASM',
    qubitCount: (count) => `${count} qubit`, runSimulation: 'Esegui simulazione',
    clickToDismiss: 'Fai clic per chiudere', dismiss: 'Chiudi', qubits: 'Qubit:',
    gatePalette: 'Palette estesa di porte quantistiche', gate: 'porta', rotationAngle: 'Angolo di rotazione (θ):', radians: 'rad',
    presetCircuits: 'Circuiti predefiniti', clearCircuit: 'Svuota circuito',
    clearCircuitTitle: 'Rimuovi tutte le porte dal circuito',
    presetDescription: 'Scegli uno stato quantistico o un algoritmo noto da caricare ed eseguire subito.',
    canvasHint: 'Fai clic su una cella per inserire la porta selezionata o cancellarla. Le porte multi-qubit si collegano automaticamente se inserite nello stesso passaggio.',
    stateAmplitudesAndProbabilities: 'Ampiezze di stato e probabilità',
    runToSeeResults: 'Fai clic su Esegui per simulare il circuito con il motore WASM locale.',
    stateVectorAndOutcomeProbabilities: 'Vettore di stato e probabilità degli esiti',
    basisStates: (count, qubits) => `${count} stati base (2^${qubits})`,
    stateProbability: (state, percentage) => `Stato ${state}: ${percentage}%`,
    complexAmplitude: 'Ampiezza complessa (re + im·i)',
    errors: {
      INPUT_LIMIT_EXCEEDED: 'Il circuito supera i limiti supportati dalla simulazione.',
      INVALID_CIRCUIT_SPEC: 'Il circuito contiene una porta o una configurazione non valida.',
      SIMULATION_FAILED: 'Non è stato possibile simulare il circuito. Riprova.',
    },
    tools: {
      H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)',
      RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', 'CNOT-control': 'CNOT controllo', 'CNOT-target': 'CNOT bersaglio',
      'CZ-control': 'CZ controllo', 'CZ-target': 'CZ bersaglio', 'CY-control': 'CY controllo', 'CY-target': 'CY bersaglio',
      SWAP: 'SWAP', 'TOFFOLI-control': 'Toffoli controllo', 'TOFFOLI-target': 'Toffoli bersaglio', RESET: 'Reimposta', erase: 'Cancella',
    },
    presets: {
      'bell-phi-plus': { name: 'Stato di Bell |Φ⁺⟩', description: 'Entanglement quantistico fondamentale: genera lo stato (|00⟩ + |11⟩)/√2 con una porta Hadamard e CNOT.' },
      'bell-psi-plus': { name: 'Stato di Bell |Ψ⁺⟩', description: 'Stato di Bell a parità dispari: genera lo stato (|01⟩ + |10⟩)/√2 con una porta X iniziale su q1.' },
      'ghz-state': { name: 'Stato GHZ |GHZ⟩', description: 'Entanglement Greenberger-Horne-Zeilinger a tre qubit: genera lo stato (|000⟩ + |111⟩)/√2.' },
      'superposition-3q': { name: 'Sovrapposizione uniforme', description: 'Porte Hadamard parallele creano una sovrapposizione uniforme con probabilità del 12,5% per ciascuno degli otto stati.' },
      'interference-hzh': { name: 'Interferenza quantistica (H-Z-H)', description: 'Interferenza costruttiva e distruttiva: la porta di fase Z riporta lo stato al puro |1⟩.' },
      'superdense-coding': { name: 'Codifica superdensa (messaggio 11)', description: 'Trasmette due bit classici (11) inviando un qubit entangled e poi li decodifica con Bob.' },
      'deutsch-algorithm': { name: 'Algoritmo di Deutsch (oracolo f(x)=x)', description: 'Determina con una sola interrogazione se una funzione booleana è costante o bilanciata.' },
    },
  },
};

export function initialLanguage(): Language {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'it') return stored;
  return typeof navigator !== 'undefined' && navigator.language.startsWith('it') ? 'it' : 'en';
}
import type { EngineErrorCode } from './wasm/types';
