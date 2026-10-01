import type { BROWSER_BUDGET } from './wasm/policy';
import type { EngineErrorCode, LintRule } from './wasm/types';
import type { ObservableParseErrorCode } from './model/observable';

export const LANGUAGE_STORAGE_KEY = 'jqapi-language';
export type Language = 'en' | 'it';
export type GateTool =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'PHASE' | 'U3'
  | 'QFT'
  | 'CNOT-control' | 'CNOT-target' | 'CZ-control' | 'CZ-target' | 'CY-control' | 'CY-target'
  | 'SWAP' | 'CSWAP-control' | 'CSWAP-swap' | 'TOFFOLI-control' | 'TOFFOLI-target'
  | 'MCX-control' | 'MCX-target' | 'MEASUREMENT' | 'RESET' | 'ORACLE' | 'GENERIC' | 'erase';
export type PresetId = 'bell-phi-plus' | 'bell-psi-plus' | 'ghz-state' | 'superposition-3q' | 'interference-hzh' | 'superdense-coding' | 'deutsch-algorithm' | 'teleportation';

export type LiveMessages = {
  title: string;
  pending: string;
  rerun: string;
  bloch: string;
  qubit: string;
  mixed: string;
  pure: string;
  purity: string;
  heatmap: string;
  legend: string;
  phaseNote: string;
  timeline: string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  reset: string;
  initial: string;
  pre: string;
  post: string;
  outcome: string;
  skipped: string;
  condition: string;
  unconditional: string;
  guide: string;
  input: string;
  bob: string;
  fidelity: string;
  communication: string;
  seed: string;
  guideSteps: string[];
};

export type Messages = {
  live: LiveMessages;
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
  saveQasm: string;
  loadQasm: string;
  cancel: string;
  resourceLimits: string;
  technicalDetails: string;
  dismiss: string;
  shotBudgetHint: (limit: number) => string;
  observableShotBudgetHint: (limit: number) => string;
  countsBudgetExceeded: string;
  observableBudgetExceeded: string;
  resourcePolicy: (budget: typeof BROWSER_BUDGET) => string;
  qasmCapabilities: string;
  qasmUnsupported: string;
  clearCircuit: string;
  /** Rule IDs stay stable across locales; texts get (qubit names, numQubits). */
  lint: {
    title: string; show: string; rulesLegend: string; goTo: (line: number, column: number) => string;
    severity: Record<'INFO' | 'WARNING', string>; ruleNames: Record<LintRule, string>;
    rules: Record<LintRule, (names: string[], numQubits: number) => string>;
  };
  qasmEditor: { title: string; source: string; fromCircuit: string; apply: string; hints: string; updating: string };
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

const wires = (names: string[]) => names.join(', ');
/** Ideal state-vector sizes with and without the unused qubits. */
const storage = (unused: number, numQubits: number) => [2 ** numQubits, 2 ** (numQubits - unused), 2 ** unused] as const;

const sharedTools = {
  H: 'H', X: 'X', Y: 'Y', Z: 'Z', S: 'S (π/2)', T: 'T (π/4)', RX: 'Rx(θ)', RY: 'Ry(θ)', RZ: 'Rz(θ)', U3: 'U3', SWAP: 'SWAP',
} as const;

export const messages: Record<Language, Messages> = {
  en: {
    technicalDetails: 'Technical details (English)', dismiss: 'Dismiss',
    shotBudgetHint: (limit) => `Counts work budget: up to ${limit.toLocaleString('en-GB')} shots for this circuit. Other resource and time limits still apply.`,
    observableShotBudgetHint: (limit) => `Sampled observable work budget: up to ${limit.toLocaleString('en-GB')} shots per term; uncertainty requires at least 2.`,
    countsBudgetExceeded: 'The selected shots exceed the counts work budget. Reduce shots before running.',
    observableBudgetExceeded: 'The sampled observable exceeds the work budget. Counts and the exact value can still be evaluated.',

    saveQasm: 'Export QASM', loadQasm: 'Import QASM', cancel: 'Cancel', resourceLimits: 'Capabilities and resource limits',
    resourcePolicy: (b) => `Up to ${b.maxQubits} qubits, ${b.maxShots.toLocaleString('en-GB')} shots, ${b.maxLevels} steps and ${b.maxGates} gates. Dense matrices: ${b.maxMatrixCells} complex cells in total. Up to ${b.maxObservableTerms} observable terms. Results: at most ${2 ** b.maxQubits} basis states, ${b.maxTraceAmplitudes} amplitudes across trace frames and ${b.maxResultBytes / 1024 / 1024} MiB per response. Input: ${b.maxInputChars} characters (file limit in bytes). Work limit: ${b.maxWork.toLocaleString('en-GB')} amplitude visits per engine call. Each worker job stops after ${b.maxElapsedMs / 1000} seconds, including startup; Cancel stops it immediately. Reduce steps, shots or observable terms if a budget is exceeded.`,
    qasmCapabilities: 'OpenQASM 2 subset: standard gates and rotations, measurement, reset and supported single-qubit conditions. q0 is the most significant bit. Classical imports require one bit per qubit and measure q[i] into c[i]. Custom gate definitions, arbitrary matrices and density/noise simulation are not supported by the QASM editor path. Unsupported imports preserve the current circuit; unsupported exports fail explicitly.',
    qasmUnsupported: 'This QASM circuit cannot be edited here. Use one classical bit per qubit, measure q[i] into c[i], and use conditions only on H, X, Y, Z, S, T, RX, RY, RZ, PHASE or U3. Remove unsupported gates or use the Java API. Your circuit was kept.',

    live: {"title": "Live state", "pending": "Updating state…", "rerun": "Re-run trajectory", "bloch": "Reduced Bloch sphere", "qubit": "Selected qubit", "mixed": "Mixed reduced state", "pure": "Pure state", "purity": "Purity", "heatmap": "Probability and phase", "legend": "Brightness: probability · hue: phase (−π to π)", "phaseNote": "Probability alone does not describe the state. Phase is undefined at zero amplitude.", "timeline": "Execution timeline", "previous": "Previous", "next": "Next", "play": "Play", "pause": "Pause", "reset": "Initial state", "initial": "Initial state", "pre": "Pre-measurement", "post": "Post-measurement", "outcome": "Outcome", "skipped": "Condition not met: skipped", "condition": "Classical condition", "unconditional": "Always", "guide": "Guided teleportation", "input": "Input state", "bob": "Bob’s state (q2)", "fidelity": "Fidelity with input", "communication": "Alice sends two classical bits to Bob. His X/Z corrections recover the input; this requires classical communication. Alice’s original qubit has collapsed, so no copy remains.", "seed": "Trajectory seed", "guideSteps": ["Prepare the input state on q0.", "Create a superposition on Alice’s q1.", "Entangle q1 with Bob’s q2.", "Couple the input q0 to q1.", "Rotate q0 into the measurement basis.", "Measure q0 and store c0.", "Measure q1 and store c1.", "Bob applies X when c1 = 1.", "Bob applies Z when c0 = 1."]},
    language: 'Language', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'jqapi logo', appSubtitle: 'Quantum Circuit Simulator', wasmEngine: '● WASM Engine', qubitCount: (count) => `${count} Qubits`, qubits: 'Qubits:',
    gates: 'Gates', algorithms: 'Algorithms', groups: { single: 'Single qubit', two: 'Two qubits', three: 'Three qubits', multi: 'Multi-qubit', other: 'Other' }, circuitActions: 'Circuit actions', runSimulation: 'Run simulation', shots: 'Shots', observedOutcomes: (shots) => `Observed outcomes (${shots} shots)`, count: 'Count', undo: 'Undo', redo: 'Redo', saveJson: 'Save JSON', loadJson: 'Load JSON', clearCircuit: 'Clear circuit', systemTime: 'System time',
    lint: {
      title: 'Circuit hints', show: 'Show in circuit', rulesLegend: 'Rules', goTo: (line, column) => `Go to line ${line}:${column}`,
      severity: { INFO: 'Note', WARNING: 'Warning' },
      ruleNames: { QED001: 'Redundant H pair', QED002: 'Use after measurement', QED003: 'Unused qubits' },
      rules: {
        QED001: (q) => `Two H gates on ${wires(q)} cancel out (H·H = I) with nothing on that qubit in between. If unintended, remove the H on ${wires(q)} at both positions, keeping any other qubit those gates act on; the identity holds for the ideal circuit, and removing gates can change noisy results.`,
        QED002: (q) => `${wires(q)} is measured before this quantum operation. Check whether collapsing its state here is intentional: measurement removes superposition and entanglement. Re-preparing a measured qubit is valid; Reset makes the intent explicit.`,
        QED003: (q, n) => { const [all, used, ratio] = storage(q.length, n); return `${wires(q)} ${q.length === 1 ? 'is' : 'are'} never used. The ideal state vector stores ${all} amplitudes versus ${used}: a ${ratio}× storage difference, not a guaranteed speedup. Removing qubits renumbers wires and changes the output bitstring width.`; },
      },
    },
    qasmEditor: { title: 'QASM source', source: 'OpenQASM 2 source', fromCircuit: 'Copy from circuit', apply: 'Apply to circuit', hints: 'QASM hints', updating: 'Checking the edited source…' },
    gatePalette: 'Quantum gates palette', gate: 'gate', rotationAngle: 'Rotation angle (θ):', radians: 'rad', presetCircuits: 'Preset circuits', clearCircuitTitle: 'Clear all gates from the circuit', presetDescription: 'Choose a quantum state or a well-known algorithm to load and run instantly.', canvasHint: 'Click to place, drag gates to move, and drag the background to pan.', stateAmplitudesAndProbabilities: 'State Amplitudes & Probabilities', runToSeeResults: 'The state updates automatically when you edit the circuit.', stateVectorAndOutcomeProbabilities: 'State Vector & Outcome Probabilities', basisStates: (count, qubits) => `${count} basis states (2^${qubits})`, stateProbability: (state, percentage) => `State ${state}: ${percentage}%`, complexAmplitude: 'Complex amplitude (re + im·i)',
    observable: 'Observable ⟨H⟩', observableHelp: 'One term per line: an optional coefficient and one Pauli letter (I, X, Y, Z) per qubit, q0 first — e.g. "0.5 ZZ". Leave empty to skip.', exactExpectation: 'Exact ⟨H⟩', sampledExpectation: 'Sampled ⟨H⟩ ± SE', totalShots: 'Total shots', coefficient: 'Coefficient', pauliString: 'Pauli string', exactValue: 'Exact', sampledMean: 'Sampled mean', shotsUsed: 'Shots', sampledNeedsTwoShots: 'The sampled estimate needs at least 2 shots.',
    observableErrors: { EMPTY: () => 'Enter at least one Pauli term.', BAD_LINE: (line) => `Line ${line}: use "coefficient LABEL" or "LABEL".`, BAD_LABEL: (line) => `Line ${line}: labels may contain only I, X, Y and Z.`, WRONG_LENGTH: (line, qubits) => `Line ${line}: the label must have ${qubits} letters, one per qubit.`, BAD_COEFF: (line) => `Line ${line}: the coefficient must be a finite number.`, TOO_MANY_TERMS: (line) => `Line ${line}: at most 64 terms are supported.` },
    errors: { INVALID_QASM: 'Unsupported or invalid OpenQASM. Open the technical details for the operation and source position; use the supported subset or the Java API.', CANCELLED: 'Operation cancelled. The circuit is still editable.', TIMEOUT: 'The execution time limit was reached. Reduce shots, steps or observable terms and try again.', INPUT_LIMIT_EXCEEDED: 'The circuit exceeds the supported simulation limits.', INVALID_CIRCUIT_SPEC: 'The circuit contains an invalid gate or configuration.', INVALID_OBSERVABLE: 'The observable is invalid or does not match the number of qubits.', INVALID_SHOT_COUNT: 'Choose a whole number of shots from 1 to 10,000.', NON_UNITARY_CIRCUIT: 'The exact value is not available for circuits with measurement, reset or classical conditions.', SIMULATION_FAILED: 'The circuit could not be simulated. Please try again.', UNSUPPORTED_SPEC_VERSION: 'This editor cannot load this circuit format or its classical operations.' },
    presets: {
      teleportation: { name: "Guided teleportation", description: "Transfer an arbitrary state using entanglement, measurement and classical corrections." },
      'bell-phi-plus': { name: 'Bell State |Φ⁺⟩', description: 'Fundamental quantum entanglement using a Hadamard gate and CNOT.' }, 'bell-psi-plus': { name: 'Bell State |Ψ⁺⟩', description: 'Odd-parity Bell state with an initial X gate on q1.' }, 'ghz-state': { name: 'GHZ State |GHZ⟩', description: 'Three-qubit Greenberger-Horne-Zeilinger entanglement.' }, 'superposition-3q': { name: 'Uniform Superposition', description: 'Parallel Hadamard gates create equal probabilities for eight states.' }, 'interference-hzh': { name: 'H-Z-H Interference', description: 'Constructive and destructive interference through a phase gate.' }, 'superdense-coding': { name: 'Superdense Coding', description: 'Transmits two classical bits with an entangled qubit.' }, 'deutsch-algorithm': { name: 'Deutsch Algorithm', description: 'Determines whether a Boolean function is constant or balanced.' },
    },
    tools: { ...sharedTools, QFT: 'QFT', PHASE: 'Phase (θ)', MEASUREMENT: 'Measure', RESET: 'Reset', ORACLE: 'Oracle matrix', GENERIC: 'Generic matrix', 'CNOT-control': 'CNOT control', 'CNOT-target': 'CNOT target', 'CZ-control': 'CZ control', 'CZ-target': 'CZ target', 'CY-control': 'CY control', 'CY-target': 'CY target', 'CSWAP-control': 'CSWAP control', 'CSWAP-swap': 'CSWAP swap', 'TOFFOLI-control': 'Toffoli control', 'TOFFOLI-target': 'Toffoli target', 'MCX-control': 'MC-X control', 'MCX-target': 'MC-X target', erase: 'Erase' },
  },
  it: {
    technicalDetails: 'Dettagli tecnici (in inglese)', dismiss: 'Chiudi',
    shotBudgetHint: (limit) => `Budget di lavoro per i conteggi: fino a ${limit.toLocaleString('it-IT')} ripetizioni per questo circuito. Restano validi gli altri limiti di risorse e tempo.`,
    observableShotBudgetHint: (limit) => `Budget di lavoro per l’osservabile campionato: fino a ${limit.toLocaleString('it-IT')} ripetizioni per termine; l’incertezza ne richiede almeno 2.`,
    countsBudgetExceeded: 'Le ripetizioni selezionate superano il budget dei conteggi. Riducile prima di eseguire.',
    observableBudgetExceeded: 'L’osservabile campionato supera il budget. I conteggi e il valore esatto possono ancora essere valutati.',

    saveQasm: 'Esporta QASM', loadQasm: 'Importa QASM', cancel: 'Annulla', resourceLimits: 'Funzionalità e limiti di risorse',
    resourcePolicy: (b) => `Fino a ${b.maxQubits} qubit, ${b.maxShots.toLocaleString('it-IT')} ripetizioni, ${b.maxLevels} passi e ${b.maxGates} porte. Matrici dense: ${b.maxMatrixCells} celle complesse totali. Fino a ${b.maxObservableTerms} termini osservabili. Risultati: massimo ${2 ** b.maxQubits} stati di base, ${b.maxTraceAmplitudes} ampiezze tra tutti i fotogrammi e ${b.maxResultBytes / 1024 / 1024} MiB per risposta. Input: ${b.maxInputChars} caratteri (limite file in byte). Lavoro: ${b.maxWork.toLocaleString('it-IT')} visite alle ampiezze per chiamata al motore. Ogni operazione termina dopo ${b.maxElapsedMs / 1000} secondi, avvio incluso; Annulla la interrompe subito. Riduci passi, ripetizioni o termini osservabili se superi un limite.`,
    qasmCapabilities: 'Sottoinsieme OpenQASM 2: porte standard e rotazioni, misura, reset e condizioni supportate su un singolo qubit. q0 è il bit più significativo. Gli import classici richiedono un bit per qubit e misure da q[i] a c[i]. Definizioni di porte personalizzate, matrici arbitrarie e simulazioni di densità/rumore non sono supportate dal percorso QASM dell’editor. Un import non supportato conserva il circuito corrente; un export non supportato viene rifiutato esplicitamente.',
    qasmUnsupported: 'Questo circuito QASM non è modificabile qui. Usa un bit classico per qubit, misura q[i] in c[i] e applica condizioni solo a H, X, Y, Z, S, T, RX, RY, RZ, PHASE o U3. Rimuovi le porte non supportate oppure usa l’API Java. Il circuito corrente è stato conservato.',

    live: {"title": "Stato live", "pending": "Aggiornamento dello stato…", "rerun": "Rigenera traiettoria", "bloch": "Sfera di Bloch ridotta", "qubit": "Qubit selezionato", "mixed": "Stato ridotto misto", "pure": "Stato puro", "purity": "Purezza", "heatmap": "Probabilità e fase", "legend": "Luminosità: probabilità · colore: fase (−π a π)", "phaseNote": "La sola probabilità non descrive lo stato. La fase non è definita per ampiezza nulla.", "timeline": "Sequenza di esecuzione", "previous": "Precedente", "next": "Successivo", "play": "Riproduci", "pause": "Pausa", "reset": "Stato iniziale", "initial": "Stato iniziale", "pre": "Prima della misura", "post": "Dopo la misura", "outcome": "Esito", "skipped": "Condizione non soddisfatta: saltata", "condition": "Condizione classica", "unconditional": "Sempre", "guide": "Teletrasporto guidato", "input": "Stato iniziale", "bob": "Stato di Bob (q2)", "fidelity": "Fedeltà rispetto allo stato iniziale", "communication": "Alice invia due bit classici a Bob. Le correzioni X/Z recuperano lo stato iniziale e richiedono comunicazione classica. Il qubit originale di Alice è collassato: non rimane una copia.", "seed": "Seed della traiettoria", "guideSteps": ["Prepara lo stato iniziale su q0.", "Crea una sovrapposizione sul qubit q1 di Alice.", "Entangle q1 con il qubit q2 di Bob.", "Collega q0 a q1.", "Ruota q0 nella base di misura.", "Misura q0 e memorizza c0.", "Misura q1 e memorizza c1.", "Bob applica X quando c1 = 1.", "Bob applica Z quando c0 = 1."]},
    language: 'Lingua', languages: { en: 'English', it: 'Italiano' }, appName: 'jqapi studio', logo: 'logo jqapi', appSubtitle: 'Simulatore di circuiti quantistici', wasmEngine: '● Motore WASM', qubitCount: (count) => `${count} qubit`, qubits: 'Qubit:',
    gates: 'Porte', algorithms: 'Algoritmi', groups: { single: 'Un qubit', two: 'Due qubit', three: 'Tre qubit', multi: 'Multi-qubit', other: 'Altro' }, circuitActions: 'Azioni circuito', runSimulation: 'Esegui simulazione', shots: 'Ripetizioni', observedOutcomes: (shots) => `Esiti osservati (${shots} ripetizioni)`, count: 'Conteggio', undo: 'Annulla', redo: 'Ripristina', saveJson: 'Salva JSON', loadJson: 'Carica JSON', clearCircuit: 'Svuota circuito', systemTime: 'Ora di sistema',
    lint: {
      title: 'Suggerimenti sul circuito', show: 'Mostra nel circuito', rulesLegend: 'Regole', goTo: (line, column) => `Vai alla riga ${line}:${column}`,
      severity: { INFO: 'Nota', WARNING: 'Avviso' },
      ruleNames: { QED001: 'Coppia H ridondante', QED002: 'Uso dopo la misura', QED003: 'Qubit inutilizzati' },
      rules: {
        QED001: (q) => `Due porte H su ${wires(q)} si annullano (H·H = I) senza altre operazioni su quel qubit in mezzo. Se non è voluto, rimuovi la H su ${wires(q)} in entrambe le posizioni, mantenendo gli altri qubit su cui agiscono quelle porte; l’identità vale per il circuito ideale e rimuovere porte può cambiare i risultati con rumore.`,
        QED002: (q) => `${wires(q)} viene misurato prima di questa operazione quantistica. Verifica che il collasso dello stato qui sia voluto: la misura elimina sovrapposizione ed entanglement. Ripreparare un qubit misurato è lecito; Reset rende esplicita l’intenzione.`,
        QED003: (q, n) => { const [all, used, ratio] = storage(q.length, n); return `${wires(q)} ${q.length === 1 ? 'non è mai usato' : 'non sono mai usati'}. Il vettore di stato ideale contiene ${all} ampiezze invece di ${used}: ${ratio}× di memoria in più, non un’accelerazione garantita. Rimuovere qubit rinumera i fili e cambia la lunghezza delle stringhe di bit in uscita.`; },
      },
    },
    qasmEditor: { title: 'Sorgente QASM', source: 'Sorgente OpenQASM 2', fromCircuit: 'Copia dal circuito', apply: 'Applica al circuito', hints: 'Suggerimenti QASM', updating: 'Verifica del sorgente modificato…' },
    gatePalette: 'Palette delle porte quantistiche', gate: 'porta', rotationAngle: 'Angolo di rotazione (θ):', radians: 'rad', presetCircuits: 'Circuiti predefiniti', clearCircuitTitle: 'Rimuovi tutte le porte dal circuito', presetDescription: 'Scegli uno stato quantistico o un algoritmo noto da caricare ed eseguire subito.', canvasHint: 'Fai clic per inserire, trascina le porte per spostarle e lo sfondo per panoramica.', stateAmplitudesAndProbabilities: 'Ampiezze di stato e probabilità', runToSeeResults: 'Lo stato si aggiorna automaticamente quando modifichi il circuito.', stateVectorAndOutcomeProbabilities: 'Vettore di stato e probabilità degli esiti', basisStates: (count, qubits) => `${count} stati base (2^${qubits})`, stateProbability: (state, percentage) => `Stato ${state}: ${percentage}%`, complexAmplitude: 'Ampiezza complessa (re + im·i)',
    observable: 'Osservabile ⟨H⟩', observableHelp: 'Un termine per riga: un coefficiente facoltativo e una lettera di Pauli (I, X, Y, Z) per qubit, prima q0 — es. "0.5 ZZ". Lascia vuoto per non calcolarlo.', exactExpectation: '⟨H⟩ esatto', sampledExpectation: '⟨H⟩ campionato ± SE', totalShots: 'Ripetizioni totali', coefficient: 'Coefficiente', pauliString: 'Stringa di Pauli', exactValue: 'Esatto', sampledMean: 'Media campionata', shotsUsed: 'Ripetizioni', sampledNeedsTwoShots: 'La stima campionata richiede almeno 2 ripetizioni.',
    observableErrors: { EMPTY: () => 'Inserisci almeno un termine di Pauli.', BAD_LINE: (line) => `Riga ${line}: usa "coefficiente ETICHETTA" oppure "ETICHETTA".`, BAD_LABEL: (line) => `Riga ${line}: le etichette possono contenere solo I, X, Y e Z.`, WRONG_LENGTH: (line, qubits) => `Riga ${line}: l'etichetta deve avere ${qubits} lettere, una per qubit.`, BAD_COEFF: (line) => `Riga ${line}: il coefficiente deve essere un numero finito.`, TOO_MANY_TERMS: (line) => `Riga ${line}: sono supportati al massimo 64 termini.` },
    errors: { INVALID_QASM: 'OpenQASM non valido o non supportato. Apri i dettagli tecnici per l’operazione e la posizione; usa il sottoinsieme supportato o l’API Java.', CANCELLED: 'Operazione annullata. Puoi continuare a modificare il circuito.', TIMEOUT: 'Raggiunto il limite di tempo. Riduci ripetizioni, passi o termini osservabili e riprova.', INPUT_LIMIT_EXCEEDED: 'Il circuito supera i limiti supportati dalla simulazione.', INVALID_CIRCUIT_SPEC: 'Il circuito contiene una porta o una configurazione non valida.', INVALID_OBSERVABLE: "L'osservabile non è valido o non corrisponde al numero di qubit.", INVALID_SHOT_COUNT: 'Scegli un numero intero di ripetizioni da 1 a 10.000.', NON_UNITARY_CIRCUIT: 'Il valore esatto non è disponibile per circuiti con misure, reset o condizioni classiche.', SIMULATION_FAILED: 'Non è stato possibile simulare il circuito. Riprova.', UNSUPPORTED_SPEC_VERSION: 'Questo editor non supporta il formato del circuito o le sue operazioni classiche.' },
    presets: {
      teleportation: { name: "Teletrasporto guidato", description: "Trasferisci uno stato con entanglement, misure e correzioni classiche." },
      'bell-phi-plus': { name: 'Stato di Bell |Φ⁺⟩', description: 'Entanglement quantistico fondamentale con Hadamard e CNOT.' }, 'bell-psi-plus': { name: 'Stato di Bell |Ψ⁺⟩', description: 'Stato di Bell a parità dispari con una porta X iniziale su q1.' }, 'ghz-state': { name: 'Stato GHZ |GHZ⟩', description: 'Entanglement Greenberger-Horne-Zeilinger a tre qubit.' }, 'superposition-3q': { name: 'Sovrapposizione uniforme', description: 'Porte Hadamard parallele danno probabilità uguali per otto stati.' }, 'interference-hzh': { name: 'Interferenza H-Z-H', description: 'Interferenza costruttiva e distruttiva attraverso una porta di fase.' }, 'superdense-coding': { name: 'Codifica superdensa', description: 'Trasmette due bit classici con un qubit entangled.' }, 'deutsch-algorithm': { name: 'Algoritmo di Deutsch', description: 'Determina se una funzione booleana è costante o bilanciata.' },
    },
    tools: { ...sharedTools, QFT: 'QFT', PHASE: 'Fase (θ)', MEASUREMENT: 'Misura', RESET: 'Reimposta', ORACLE: 'Matrice oracolo', GENERIC: 'Matrice generica', 'CNOT-control': 'CNOT controllo', 'CNOT-target': 'CNOT bersaglio', 'CZ-control': 'CZ controllo', 'CZ-target': 'CZ bersaglio', 'CY-control': 'CY controllo', 'CY-target': 'CY bersaglio', 'CSWAP-control': 'CSWAP controllo', 'CSWAP-swap': 'CSWAP scambio', 'TOFFOLI-control': 'Toffoli controllo', 'TOFFOLI-target': 'Toffoli bersaglio', 'MCX-control': 'MC-X controllo', 'MCX-target': 'MC-X bersaglio', erase: 'Cancella' },
  },
};

export function initialLanguage(): Language {
  const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'it' ? stored : typeof navigator !== 'undefined' && navigator.language.startsWith('it') ? 'it' : 'en';
}
