import type { EngineErrorCode } from './wasm/types';
import type { ObservableParseErrorCode } from './model/observable';

export const LANGUAGE_STORAGE_KEY = 'jqapi-language';
export type Language = 'en' | 'it';
export type GateTool =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'PHASE' | 'U3'
  | 'QFT'
  | 'CNOT-control' | 'CNOT-target' | 'CZ-control' | 'CZ-target' | 'CY-control' | 'CY-target'
  | 'SWAP' | 'CSWAP-control' | 'CSWAP-swap' | 'TOFFOLI-control' | 'TOFFOLI-target'
  | 'MCX-control' | 'MCX-target' | 'MEASUREMENT' | 'RESET' | 'ORACLE' | 'GENERIC' | 'erase';
export type PresetId = 'bell-phi-plus' | 'bell-psi-plus' | 'ghz-state' | 'superposition-3q' | 'interference-hzh' | 'superdense-coding' | 'deutsch-algorithm';

export type Messages = {
  language: string;
  languages: Record<Language, string>;
  appName: string;
  logo: string;
  appSubtitle: string;
  wasmEngine: string;
  qubitCount: (count: number) => string;
  qubits: string;
  gates: string;
  algorithms: string;
  groups: Record<'single' | 'two' | 'three' | 'multi' | 'other', string>;
  circuitActions: string;
  runSimulation: string;
  shots: string;
  observedOutcomes: (shots: number) => string;
  count: string;
  undo: string;
  redo: string;
  saveJson: string;
  loadJson: string;
  clearCircuit: string;
  systemTime: string;
  gatePalette: string;
  gate: string;
  rotationAngle: string;
  radians: string;
  presetCircuits: string;
  clearCircuitTitle: string;
  presetDescription: string;
  canvasHint: string;
  stateAmplitudesAndProbabilities: string;
  runToSeeResults: string;
  stateVectorAndOutcomeProbabilities: string;
  basisStates: (count: number, qubits: number) => string;
  stateProbability: (state: string, percentage: string) => string;
  complexAmplitude: string;
  observable: string;
  observableHelp: string;
  exactExpectation: string;
  sampledExpectation: string;
  totalShots: string;
  coefficient: string;
  pauliString: string;
  exactValue: string;
  sampledMean: string;
  shotsUsed: string;
  sampledNeedsTwoShots: string;
  /** (line, numQubits) → message for the first invalid observable line. */
  observableErrors: Record<ObservableParseErrorCode, (line: number, numQubits: number) => string>;
  errors: Record<EngineErrorCode, string>;
  presets: Record<PresetId, { name: string; description: string }>;
  tools: Record<GateTool, string>;
};

const sharedTools = {
  H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)', RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', U3: 'U3', SWAP: 'SWAP',
} as const;

export const messages: Record<Language, Messages> = {
  en: {
    language: 'Language', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'jqapi logo', appSubtitle: 'Quantum Circuit Simulator', wasmEngine: '● WASM Engine', qubitCount: (count) => `${count} Qubits`, qubits: 'Qubits:',
    gates: 'Gates', algorithms: 'Algorithms', groups: { single: 'Single qubit', two: 'Two qubits', three: 'Three qubits', multi: 'Multi-qubit', other: 'Other' }, circuitActions: 'Circuit actions', runSimulation: 'Run simulation', shots: 'Shots', observedOutcomes: (shots) => `Observed outcomes (${shots} shots)`, count: 'Count', undo: 'Undo', redo: 'Redo', saveJson: 'Save JSON', loadJson: 'Load JSON', clearCircuit: 'Clear circuit', systemTime: 'System time',
    gatePalette: 'Quantum gates palette', gate: 'gate', rotationAngle: 'Rotation angle (θ):', radians: 'rad', presetCircuits: 'Preset circuits', clearCircuitTitle: 'Clear all gates from the circuit', presetDescription: 'Choose a quantum state or a well-known algorithm to load and run instantly.', canvasHint: 'Click to place, drag gates to move, and drag the background to pan.', stateAmplitudesAndProbabilities: 'State Amplitudes & Probabilities', runToSeeResults: 'Click Run to execute the circuit on the local WASM engine.', stateVectorAndOutcomeProbabilities: 'State Vector & Outcome Probabilities', basisStates: (count, qubits) => `${count} basis states (2^${qubits})`, stateProbability: (state, percentage) => `State ${state}: ${percentage}%`, complexAmplitude: 'Complex amplitude (re + im·i)',
    observable: 'Observable ⟨H⟩', observableHelp: 'One term per line: an optional coefficient and one Pauli letter (I, X, Y, Z) per qubit, q0 first — e.g. "0.5 ZZ". Leave empty to skip.', exactExpectation: 'Exact ⟨H⟩', sampledExpectation: 'Sampled ⟨H⟩ ± SE', totalShots: 'Total shots', coefficient: 'Coefficient', pauliString: 'Pauli string', exactValue: 'Exact', sampledMean: 'Sampled mean', shotsUsed: 'Shots', sampledNeedsTwoShots: 'The sampled estimate needs at least 2 shots.',
    observableErrors: { EMPTY: () => 'Enter at least one Pauli term.', BAD_LINE: (line) => `Line ${line}: use "coefficient LABEL" or "LABEL".`, BAD_LABEL: (line) => `Line ${line}: labels may contain only I, X, Y and Z.`, WRONG_LENGTH: (line, qubits) => `Line ${line}: the label must have ${qubits} letters, one per qubit.`, BAD_COEFF: (line) => `Line ${line}: the coefficient must be a finite number.`, TOO_MANY_TERMS: (line) => `Line ${line}: at most 1024 terms are supported.` },
    errors: { INPUT_LIMIT_EXCEEDED: 'The circuit exceeds the supported simulation limits.', INVALID_CIRCUIT_SPEC: 'The circuit contains an invalid gate or configuration.', INVALID_OBSERVABLE: 'The observable is invalid or does not match the number of qubits.', INVALID_SHOT_COUNT: 'Choose a whole number of shots from 1 to 10,000.', NON_UNITARY_CIRCUIT: 'The exact value is not available for circuits with measurement, reset or classical conditions.', SIMULATION_FAILED: 'The circuit could not be simulated. Please try again.', UNSUPPORTED_SPEC_VERSION: 'This editor cannot load this circuit format or its classical operations.' },
    presets: {
      'bell-phi-plus': { name: 'Bell State |Φ⁺⟩', description: 'Fundamental quantum entanglement using a Hadamard gate and CNOT.' }, 'bell-psi-plus': { name: 'Bell State |Ψ⁺⟩', description: 'Odd-parity Bell state with an initial X gate on q1.' }, 'ghz-state': { name: 'GHZ State |GHZ⟩', description: 'Three-qubit Greenberger-Horne-Zeilinger entanglement.' }, 'superposition-3q': { name: 'Uniform Superposition', description: 'Parallel Hadamard gates create equal probabilities for eight states.' }, 'interference-hzh': { name: 'H-Z-H Interference', description: 'Constructive and destructive interference through a phase gate.' }, 'superdense-coding': { name: 'Superdense Coding', description: 'Transmits two classical bits with an entangled qubit.' }, 'deutsch-algorithm': { name: 'Deutsch Algorithm', description: 'Determines whether a Boolean function is constant or balanced.' },
    },
    tools: { ...sharedTools, QFT: 'QFT', PHASE: 'Phase (θ)', MEASUREMENT: 'Measure', RESET: 'Reset', ORACLE: 'Oracle matrix', GENERIC: 'Generic matrix', 'CNOT-control': 'CNOT control', 'CNOT-target': 'CNOT target', 'CZ-control': 'CZ control', 'CZ-target': 'CZ target', 'CY-control': 'CY control', 'CY-target': 'CY target', 'CSWAP-control': 'CSWAP control', 'CSWAP-swap': 'CSWAP swap', 'TOFFOLI-control': 'Toffoli control', 'TOFFOLI-target': 'Toffoli target', 'MCX-control': 'MC-X control', 'MCX-target': 'MC-X target', erase: 'Erase' },
  },
  it: {
    language: 'Lingua', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'logo jqapi', appSubtitle: 'Simulatore di circuiti quantistici', wasmEngine: '● Motore WASM', qubitCount: (count) => `${count} qubit`, qubits: 'Qubit:',
    gates: 'Porte', algorithms: 'Algoritmi', groups: { single: 'Un qubit', two: 'Due qubit', three: 'Tre qubit', multi: 'Multi-qubit', other: 'Altro' }, circuitActions: 'Azioni circuito', runSimulation: 'Esegui simulazione', shots: 'Ripetizioni', observedOutcomes: (shots) => `Esiti osservati (${shots} ripetizioni)`, count: 'Conteggio', undo: 'Annulla', redo: 'Ripristina', saveJson: 'Salva JSON', loadJson: 'Carica JSON', clearCircuit: 'Svuota circuito', systemTime: 'Ora di sistema',
    gatePalette: 'Palette delle porte quantistiche', gate: 'porta', rotationAngle: 'Angolo di rotazione (θ):', radians: 'rad', presetCircuits: 'Circuiti predefiniti', clearCircuitTitle: 'Rimuovi tutte le porte dal circuito', presetDescription: 'Scegli uno stato quantistico o un algoritmo noto da caricare ed eseguire subito.', canvasHint: 'Fai clic per inserire, trascina le porte per spostarle e lo sfondo per panoramica.', stateAmplitudesAndProbabilities: 'Ampiezze di stato e probabilità', runToSeeResults: 'Fai clic su Esegui per simulare il circuito con il motore WASM locale.', stateVectorAndOutcomeProbabilities: 'Vettore di stato e probabilità degli esiti', basisStates: (count, qubits) => `${count} stati base (2^${qubits})`, stateProbability: (state, percentage) => `Stato ${state}: ${percentage}%`, complexAmplitude: 'Ampiezza complessa (re + im·i)',
    observable: 'Osservabile ⟨H⟩', observableHelp: 'Un termine per riga: un coefficiente facoltativo e una lettera di Pauli (I, X, Y, Z) per qubit, prima q0 — es. "0.5 ZZ". Lascia vuoto per non calcolarlo.', exactExpectation: '⟨H⟩ esatto', sampledExpectation: '⟨H⟩ campionato ± SE', totalShots: 'Ripetizioni totali', coefficient: 'Coefficiente', pauliString: 'Stringa di Pauli', exactValue: 'Esatto', sampledMean: 'Media campionata', shotsUsed: 'Ripetizioni', sampledNeedsTwoShots: 'La stima campionata richiede almeno 2 ripetizioni.',
    observableErrors: { EMPTY: () => 'Inserisci almeno un termine di Pauli.', BAD_LINE: (line) => `Riga ${line}: usa "coefficiente ETICHETTA" oppure "ETICHETTA".`, BAD_LABEL: (line) => `Riga ${line}: le etichette possono contenere solo I, X, Y e Z.`, WRONG_LENGTH: (line, qubits) => `Riga ${line}: l'etichetta deve avere ${qubits} lettere, una per qubit.`, BAD_COEFF: (line) => `Riga ${line}: il coefficiente deve essere un numero finito.`, TOO_MANY_TERMS: (line) => `Riga ${line}: sono supportati al massimo 1024 termini.` },
    errors: { INPUT_LIMIT_EXCEEDED: 'Il circuito supera i limiti supportati dalla simulazione.', INVALID_CIRCUIT_SPEC: 'Il circuito contiene una porta o una configurazione non valida.', INVALID_OBSERVABLE: "L'osservabile non è valido o non corrisponde al numero di qubit.", INVALID_SHOT_COUNT: 'Scegli un numero intero di ripetizioni da 1 a 10.000.', NON_UNITARY_CIRCUIT: 'Il valore esatto non è disponibile per circuiti con misure, reset o condizioni classiche.', SIMULATION_FAILED: 'Non è stato possibile simulare il circuito. Riprova.', UNSUPPORTED_SPEC_VERSION: 'Questo editor non supporta il formato del circuito o le sue operazioni classiche.' },
    presets: {
      'bell-phi-plus': { name: 'Stato di Bell |Φ⁺⟩', description: 'Entanglement quantistico fondamentale con Hadamard e CNOT.' }, 'bell-psi-plus': { name: 'Stato di Bell |Ψ⁺⟩', description: 'Stato di Bell a parità dispari con una porta X iniziale su q1.' }, 'ghz-state': { name: 'Stato GHZ |GHZ⟩', description: 'Entanglement Greenberger-Horne-Zeilinger a tre qubit.' }, 'superposition-3q': { name: 'Sovrapposizione uniforme', description: 'Porte Hadamard parallele danno probabilità uguali per otto stati.' }, 'interference-hzh': { name: 'Interferenza H-Z-H', description: 'Interferenza costruttiva e distruttiva attraverso una porta di fase.' }, 'superdense-coding': { name: 'Codifica superdensa', description: 'Trasmette due bit classici con un qubit entangled.' }, 'deutsch-algorithm': { name: 'Algoritmo di Deutsch', description: 'Determina se una funzione booleana è costante o bilanciata.' },
    },
    tools: { ...sharedTools, QFT: 'QFT', PHASE: 'Fase (θ)', MEASUREMENT: 'Misura', RESET: 'Reimposta', ORACLE: 'Matrice oracolo', GENERIC: 'Matrice generica', 'CNOT-control': 'CNOT controllo', 'CNOT-target': 'CNOT bersaglio', 'CZ-control': 'CZ controllo', 'CZ-target': 'CZ bersaglio', 'CY-control': 'CY controllo', 'CY-target': 'CY bersaglio', 'CSWAP-control': 'CSWAP controllo', 'CSWAP-swap': 'CSWAP scambio', 'TOFFOLI-control': 'Toffoli controllo', 'TOFFOLI-target': 'Toffoli bersaglio', 'MCX-control': 'MC-X controllo', 'MCX-target': 'MC-X bersaglio', erase: 'Cancella' },
  },
};

export function initialLanguage(): Language {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'it' ? stored : typeof navigator !== 'undefined' && navigator.language.startsWith('it') ? 'it' : 'en';
}
