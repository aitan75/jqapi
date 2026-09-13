export const LANGUAGE_STORAGE_KEY = 'jqapi-language';
export type Language = 'en' | 'it';

export type Messages = {
  language: string;
  languages: Record<Language, string>;
  simulator: string;
  wasmEngine: string;
  qubits: (count: number) => string;
  systemTime: string;
  gates: string;
  algorithms: string;
  groups: Record<'single' | 'two' | 'three' | 'multi' | 'other', string>;
  clearCircuit: string;
  circuitActions: string;
  runSimulation: string;
  undo: string;
  redo: string;
  saveJson: string;
  loadJson: string;
  presets: Record<string, string>;
  tools: Record<string, string>;
};

export const messages: Record<Language, Messages> = {
  en: {
    language: 'Language', languages: { en: 'English', it: 'Italiano' }, simulator: 'Quantum Circuit Simulator', wasmEngine: 'WASM Engine', qubits: (count) => `${count} Qubits`, systemTime: 'System time', gates: 'Gates', algorithms: 'Algorithms',
    groups: { single: 'Single qubit', two: 'Two qubits', three: 'Three qubits', multi: 'Multi-qubit', other: 'Other' }, clearCircuit: 'Clear circuit',
    circuitActions: 'Circuit actions', runSimulation: 'Run simulation', undo: 'Undo', redo: 'Redo', saveJson: 'Save JSON', loadJson: 'Load JSON',
    presets: { 'bell-phi-plus': 'Bell State |Φ⁺⟩', 'bell-psi-plus': 'Bell State |Ψ⁺⟩', 'ghz-state': 'GHZ State |GHZ⟩', 'equal-superposition': 'Equal superposition', 'interference-hzh': 'H-Z-H interference', 'superdense-coding': 'Superdense coding', 'deutsch-algorithm': 'Deutsch algorithm' },
    tools: { H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)', RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', PHASE: 'Phase (θ)', U3: 'U3', MEASUREMENT: 'Measure', RESET: 'Reset', ORACLE: 'Oracle matrix', GENERIC: 'Generic matrix', 'CNOT-control': 'CNOT control', 'CNOT-target': 'CNOT target', 'CZ-control': 'CZ control', 'CZ-target': 'CZ target', 'CY-control': 'CY control', 'CY-target': 'CY target', SWAP: 'SWAP', 'CSWAP-control': 'CSWAP control', 'CSWAP-swap': 'CSWAP swap', 'TOFFOLI-control': 'Toffoli control', 'TOFFOLI-target': 'Toffoli target', 'MCX-control': 'MC-X control', 'MCX-target': 'MC-X target', erase: 'Erase' },
  },
  it: {
    language: 'Lingua', languages: { en: 'English', it: 'Italiano' }, simulator: 'Simulatore di circuiti quantistici', wasmEngine: 'Motore WASM', qubits: (count) => `${count} qubit`, systemTime: 'Ora di sistema', gates: 'Porte', algorithms: 'Algoritmi',
    groups: { single: 'Un qubit', two: 'Due qubit', three: 'Tre qubit', multi: 'Multi-qubit', other: 'Altro' }, clearCircuit: 'Svuota circuito',
    circuitActions: 'Azioni circuito', runSimulation: 'Esegui simulazione', undo: 'Annulla', redo: 'Ripristina', saveJson: 'Salva JSON', loadJson: 'Carica JSON',
    presets: { 'bell-phi-plus': 'Stato di Bell |Φ⁺⟩', 'bell-psi-plus': 'Stato di Bell |Ψ⁺⟩', 'ghz-state': 'Stato GHZ |GHZ⟩', 'equal-superposition': 'Sovrapposizione uniforme', 'interference-hzh': 'Interferenza H-Z-H', 'superdense-coding': 'Codifica superdensa', 'deutsch-algorithm': 'Algoritmo di Deutsch' },
    tools: { H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)', RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', PHASE: 'Fase (θ)', U3: 'U3', MEASUREMENT: 'Misura', RESET: 'Reimposta', ORACLE: 'Matrice oracolo', GENERIC: 'Matrice generica', 'CNOT-control': 'CNOT controllo', 'CNOT-target': 'CNOT bersaglio', 'CZ-control': 'CZ controllo', 'CZ-target': 'CZ bersaglio', 'CY-control': 'CY controllo', 'CY-target': 'CY bersaglio', SWAP: 'SWAP', 'CSWAP-control': 'CSWAP controllo', 'CSWAP-swap': 'CSWAP scambio', 'TOFFOLI-control': 'Toffoli controllo', 'TOFFOLI-target': 'Toffoli bersaglio', 'MCX-control': 'MC-X controllo', 'MCX-target': 'MC-X bersaglio', erase: 'Cancella' },
  },
};

export function initialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'it' ? stored : navigator.language.startsWith('it') ? 'it' : 'en';
}
