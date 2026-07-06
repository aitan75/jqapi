# jqapi — Prima release GitHub v1.0.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare jqapi a una prima release pubblica ufficiale su GitHub (tag `v1.0.0` + GitHub Release con jar), sistemando test, pulizia repo e documentazione essenziale.

**Architecture:** Libreria Java 21 / Maven a singolo modulo. Il lavoro è per lo più refactor di test (nessuna modifica alla logica di produzione), pulizia di file/branch obsoleti, documentazione (README + Javadoc), e taglio della release. Le sezioni sono sequenziali: test verdi e repo pulito precedono il tag.

**Tech Stack:** Java 21 (temurin), Maven 3.9, JUnit Jupiter 5.10.2, commons-math3 3.6.1, GitHub Actions (CI già presente), GitHub CLI (`gh`) per la Release.

## Global Constraints

- Java: `maven.compiler.release=21` (invariato).
- Build tool: Maven; comando di test canonico `mvn test`, di package `mvn package`.
- Test framework: JUnit Jupiter 5 (`org.junit.jupiter.api.*`).
- **Il refactor dei test NON deve modificare alcun file sotto `src/main/`** né la logica delle asserzioni: solo struttura (annotazioni, rimozione aggregatori, rinomina).
- Branch di lavoro: `release/v1.0.0` (già creato e checkoutato).
- Licenza: MIT (invariata).
- Convenzione bit: qubit 0 = most significant bit dello state index; nei gate multi-qubit il primo qubit dichiarato è il più significativo (es. il control in `ControlledNot(control, target)`).

---

### Task 1: Refactor della test suite (approccio A — split meccanico)

Ogni classe di test ha oggi un unico metodo `@Test` "aggregatore" che invoca a catena N metodi `private void testXxx()`. Questo task rende ogni metodo di test un `@Test` isolato e rimuove gli aggregatori. Nessuna modifica al corpo dei test né a `src/main`.

**Files:**
- Modify: `src/test/java/org/aitan/jqapi/test/JavaQuantumAPITest.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumAlgorithmTest.java`
- Modify: `src/test/java/org/aitan/jqapi/test/QuantumMeasurementTest.java`
- Modify: `src/test/java/org/aitan/jqapi/test/LinearAlgebraTest.java`
- Modify: `src/test/java/org/aitan/jqapi/test/StateVectorSimulatorTest.java`

**Interfaces:**
- Consumes: nulla (parte da main).
- Produces: 29 metodi `@Test` isolati; nessun aggregatore. Nessun simbolo pubblico nuovo consumato da task successivi.

**Trasformazione (identica per ogni classe):**
1. Il metodo aggregatore `@Test public void <aggregatore>()` che si limita a chiamare gli altri metodi va **eliminato** (annotazione inclusa).
2. Ogni metodo `private void testXxx()` che è un vero test diventa `@Test public void testXxx()` (cambia `private` → `public` e si aggiunge `@Test` sulla riga sopra).
3. I metodi **helper** (non test) restano `private` e senza `@Test`.
4. Il corpo dei metodi resta invariato (incluse le `System.out.println` esistenti: fuori scope rimuoverle).

Mappa esatta per classe (aggregatore da rimuovere → test da promuovere):

- **JavaQuantumAPITest** — rimuovere `testQubit()`. Promuovere a `@Test`: `testQubitProbabilities`, `testTwoQubitTensor`, `testThreeQubitProbabilities`, `testSwapGate`, `testCoinLaunch`, `testToffoliGate`, `testControlledSwapGate`, `testCircuitSimulator`, `testCNotControlQubitZero`, `testCNotControlQubitOne`, `testBellState`, `testQuantumTeleportation`, `testOracle` (13).
- **QuantumAlgorithmTest** — rimuovere `testAlgorithm()`. Promuovere: `testRandomBit`, `testDeutschJoszaAlgorithm`, `testFunctionSearchAlgorithm`, `testGroverSearchAlgorithm` (4).
- **QuantumMeasurementTest** — rimuovere `testMeasurement()`. Promuovere: `testPartialMeasurementRenormalizationNonUniform`, `testPartialMeasurementPreservesPhase`, `testEntangledStateFactorizationRejected`, `testSeparableStateFactorizationStillWorks` (4).
- **LinearAlgebraTest** — rimuovere `testLinearAlgebra()`. Promuovere: `testIdentityMatrix`, `testKroneckerProduct` (2).
- **StateVectorSimulatorTest** — rimuovere `testStateVectorSimulator()`. Promuovere: `testCNotOnNonAdjacentQubits`, `testCNotWithControlAfterTarget`, `testSwapOnNonAdjacentQubits`, `testToffoliWithNonAdjacentControls`, `testGhzStateOnTenQubits`, `testSixteenQubitCircuit` (6). **`assertBasisState(...)` è un helper: lasciarlo `private`, NON aggiungere `@Test`.**

Totale atteso dopo il refactor: **29 `@Test`**.

- [ ] **Step 1: Baseline — verificare lo stato attuale dei test**

Run:
```bash
mvn -q clean test 2>&1 | grep -E "Tests run:|BUILD"
```
Expected: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0` e `BUILD SUCCESS`. (5 = numero attuale di aggregatori.)

- [ ] **Step 2: Trasformare `JavaQuantumAPITest`**

Rimuovere il metodo aggregatore (righe ~57–74):
```java
    @Test
    public void testQubit() {
        testQubitProbabilities();
        testTwoQubitTensor();
        testThreeQubitProbabilities();
        testSwapGate();
        testCoinLaunch();
        testToffoliGate();
        testControlledSwapGate();
        testCircuitSimulator();
        testCNotControlQubitZero();
        testCNotControlQubitOne();

        testBellState();
        testQuantumTeleportation();
        testOracle();

    }
```
Poi, per ciascuno dei 13 metodi elencati sopra, cambiare la firma da:
```java
    private void testTwoQubitTensor() {
```
a:
```java
    @Test
    public void testTwoQubitTensor() {
```
(idem per gli altri 12). Il `@Test` è già importato (`import org.junit.jupiter.api.Test;`).

- [ ] **Step 3: Trasformare `QuantumAlgorithmTest`**

Rimuovere `@Test public void testAlgorithm()` (il metodo aggregatore che chiama gli altri) e promuovere i 4 metodi (`testRandomBit`, `testDeutschJoszaAlgorithm`, `testFunctionSearchAlgorithm`, `testGroverSearchAlgorithm`) da `private void` a `@Test public void` come nello Step 2.

- [ ] **Step 4: Trasformare `QuantumMeasurementTest`**

Rimuovere `@Test public void testMeasurement()` e promuovere i 4 metodi (`testPartialMeasurementRenormalizationNonUniform`, `testPartialMeasurementPreservesPhase`, `testEntangledStateFactorizationRejected`, `testSeparableStateFactorizationStillWorks`).

- [ ] **Step 5: Trasformare `LinearAlgebraTest`**

Rimuovere `@Test public void testLinearAlgebra()` e promuovere i 2 metodi (`testIdentityMatrix`, `testKroneckerProduct`).

- [ ] **Step 6: Trasformare `StateVectorSimulatorTest`**

Rimuovere `@Test public void testStateVectorSimulator()` e promuovere i 6 metodi (`testCNotOnNonAdjacentQubits`, `testCNotWithControlAfterTarget`, `testSwapOnNonAdjacentQubits`, `testToffoliWithNonAdjacentControls`, `testGhzStateOnTenQubits`, `testSixteenQubitCircuit`). **Lasciare `assertBasisState` privato e senza `@Test`.**

- [ ] **Step 7: Eseguire i test e verificare il nuovo conteggio**

Run:
```bash
mvn -q clean test 2>&1 | grep -E "Tests run:|BUILD"
```
Expected: la riga di riepilogo finale mostra `Tests run: 29, Failures: 0, Errors: 0, Skipped: 0` e `BUILD SUCCESS`.

- [ ] **Step 8: Ri-eseguire per confermare la stabilità dei test statistici**

Alcuni test sono probabilistici (`testCoinLaunch`, `testBellState`, `testRandomBit`, Hadamard). Rieseguire una seconda volta:
```bash
mvn -q clean test 2>&1 | grep -E "Tests run: 29|BUILD"
```
Expected: ancora 29 verdi, `BUILD SUCCESS`. Se un test statistico diventa flaky, NON allargare qui lo scope: annotarlo e segnalarlo (la stabilizzazione delle soglie è già stata fatta nel commit `6fc71cd`; una flakiness nuova indicherebbe una dipendenza dall'ordine ora emersa).

- [ ] **Step 9: Commit**

```bash
git add src/test/java/org/aitan/jqapi/test/
git commit -m "test: split aggregated tests into isolated @Test methods

Convert the single per-class aggregator @Test (which invoked the real
tests in sequence) into 29 independent @Test methods. No production code
or assertion logic changed. Restores real test isolation and correct CI
reporting (29 tests instead of 5)."
```

---

### Task 2: Pulizia repository

Rimuovere CI e file IDE obsoleti ed eliminare i branch già mergiati.

**Files:**
- Delete: `.circleci/config.yml`
- Delete (dal versionamento): `nbactions.xml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nulla.
- Produces: repo con unica CI (GitHub Actions) e senza file IDE versionati.

- [ ] **Step 1: Rimuovere la CircleCI legacy e il file NetBeans**

```bash
git rm .circleci/config.yml nbactions.xml
```
(La directory `.circleci` resterà vuota e verrà rimossa dal commit automaticamente.)

- [ ] **Step 2: Aggiungere `nbactions.xml` a `.gitignore`**

Aggiungere in coda a `.gitignore` la riga:
```
nbactions.xml
```

- [ ] **Step 3: Verificare che la build regga ancora**

Run:
```bash
mvn -q clean test 2>&1 | grep -E "Tests run: 29|BUILD"
```
Expected: `BUILD SUCCESS`, 29 test verdi.

- [ ] **Step 4: Commit**

```bash
git add .gitignore .circleci nbactions.xml
git commit -m "chore: drop legacy CircleCI config and NetBeans file

CI is provided by GitHub Actions (.github/workflows/build.yml, JDK 21).
The CircleCI config targeted a deprecated Java 14 image. Also stop
versioning the IDE-specific nbactions.xml."
```

- [ ] **Step 5: Eliminare i branch review già mergiati**

Verificare prima che siano contenuti in main (nessun output = già mergiati):
```bash
git log --oneline main..review/step1-2 ; git log --oneline main..review/step3
```
Expected: nessun output per entrambi. Poi eliminarli in locale (e in remoto se presenti):
```bash
git branch -d review/step1-2 review/step3
git push origin --delete review/step1-2 review/step3 2>/dev/null || true
```
Expected: `Deleted branch ...`. (Il push-delete può fallire silenziosamente se i branch non sono su origin: è accettabile.)

---

### Task 3: Aggiornare il README

Sostituire il badge CircleCI con GitHub Actions e completare le sezioni per una release.

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nulla.
- Produces: README senza riferimenti morti, con requisiti, build, elenco gate/algoritmi.

- [ ] **Step 1: Sostituire il badge nella prima riga**

Sostituire la riga 1 attuale:
```markdown
# Java Quantum API [![aitan75](https://circleci.com/gh/aitan75/jqapi.svg?style=svg)](https://app.circleci.com/pipelines/github/aitan75/jqapi)
```
con:
```markdown
# Java Quantum API [![Build](https://github.com/aitan75/jqapi/actions/workflows/build.yml/badge.svg)](https://github.com/aitan75/jqapi/actions/workflows/build.yml)
```

- [ ] **Step 2: Aggiungere una sezione "Requirements & Build" dopo l'intro**

Inserire dopo il primo paragrafo introduttivo (prima di `## Getting Started`):
```markdown
## Requirements

- Java 21+
- Maven 3.9+

## Build

```bash
mvn clean package
```

The build produces `target/jqapi-1.0.0.jar`.
```

- [ ] **Step 3: Aggiungere una sezione con gate e algoritmi supportati**

Inserire prima di `## Contributing`:
```markdown
## Supported gates

Identity, Pauli X/Y/Z, Pauli S, Pauli T, Hadamard, Swap, Controlled-NOT,
Controlled-Y, Controlled-Z, Controlled-Swap, Toffoli, Oracle, Measurement.

## Supported algorithms & examples

Bell state, quantum teleportation, Deutsch-Jozsa, Grover search, function
search, random bit generation. See the tests under
`src/test/java/org/aitan/jqapi/test/` for runnable examples.
```

- [ ] **Step 4: Verifica visiva**

Run:
```bash
sed -n '1,20p' README.md
```
Expected: la riga 1 contiene il badge `actions/workflows/build.yml/badge.svg`, nessun riferimento a `circleci`.

Run:
```bash
grep -c circleci README.md
```
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: refresh README for v1.0.0 release

Replace dead CircleCI badge with GitHub Actions, add Requirements/Build
sections and lists of supported gates and algorithms."
```

---

### Task 4: Javadoc di base sulle classi core dell'API

Aggiungere Javadoc di classe e sui metodi pubblici chiave delle classi centrali. Scope limitato: `Circuit`, `CircuitLevel`, `QuantumRegister`, `QuantumSimulator`, `LocalSimulator`, `Gate`, `Qubit`. Non è richiesto documentare ogni singola gate o metodo accessorio.

**Files:**
- Modify: `src/main/java/org/aitan/jqapi/quantum/Circuit.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/CircuitLevel.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/QuantumRegister.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/simulator/QuantumSimulator.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/simulator/LocalSimulator.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/gates/Gate.java`
- Modify: `src/main/java/org/aitan/jqapi/quantum/Qubit.java`

**Interfaces:**
- Consumes: nulla.
- Produces: nessuna modifica di firma; solo commenti Javadoc.

Regole: aggiungere Javadoc immediatamente sopra la dichiarazione di classe/interfaccia e sopra ogni costruttore/metodo `public`. Usare `@param`/`@return` dove applicabile. NON modificare firme o corpi.

- [ ] **Step 1: `Circuit`**

Javadoc di classe:
```java
/**
 * A quantum circuit: an ordered sequence of {@link CircuitLevel}s applied to a
 * register of {@code inputSize} qubits. Levels are executed left to right by a
 * {@link org.aitan.jqapi.quantum.simulator.QuantumSimulator}.
 */
```
Metodi:
```java
/** @param inputSize number of qubits the circuit operates on */
public Circuit(int inputSize)

/** @return the number of qubits the circuit operates on */
public int getInputSize()

/** @param inputSize the number of qubits the circuit operates on */
public void setInputSize(int inputSize)

/** @return the ordered list of levels composing this circuit */
public List<CircuitLevel> getLevels()

/** Appends one or more levels to the end of the circuit.
 *  @param levels the levels to append, in order */
public void addLevel(CircuitLevel... levels)
```

- [ ] **Step 2: `CircuitLevel`**

```java
/**
 * A single time-step of a {@link Circuit}: a set of gates applied in parallel
 * to distinct qubits. Add gates with {@link #addGate(org.aitan.jqapi.quantum.gates.Gate)}.
 */
```
```java
/** Adds a gate to this level.
 *  @param gate the gate to apply during this time-step */
public void addGate(Gate gate)

/** @return the gates applied during this level */
public List<Gate> getGates()

/** @param gates the gates applied during this level */
public void setGates(List<Gate> gates)
```

- [ ] **Step 3: `QuantumRegister`**

```java
/**
 * Holds the quantum state of {@code size} qubits as a {@code 2^size} complex
 * amplitude vector. Supports full and partial measurement. By convention qubit
 * 0 is the most significant bit of the state index.
 */
```
```java
/** Creates a register of the given size initialised to |0...0>.
 *  @param size number of qubits */
public QuantumRegister(int size)

/** Creates a register from explicit per-qubit initial states.
 *  @param size number of qubits
 *  @param qubits the initial state of each qubit */
public QuantumRegister(int size, Qubit[] qubits)

/** Creates a register from amplitude coefficients.
 *  @param size number of qubits
 *  @param alphas amplitude coefficients of the state vector */
public QuantumRegister(int size, double... alphas)

/** @return the number of qubits in the register */
public int getSize()

/** @return the full complex amplitude vector of the register state */
public ComplexVector getRegisterState()

/** @return the register state expressed as an array of qubits */
public Qubit[] getQubitRegisterState()

/** @param registerState the new complex amplitude vector */
public void setRegisterState(ComplexVector registerState)

/** Collapses the whole register to a basis state according to the current
 *  measurement probabilities. */
public void measure()

/** Measures only the qubits at the given indexes, renormalising the residual
 *  state.
 *  @param indexes the qubit indexes to measure */
public void measureQubitAtIndexes(List<Integer> indexes)

/** @return the input qubits the register was initialised with */
public Qubit[] getInput()

/** @return the measured result qubits, available after {@link #measure()} */
public Qubit[] getResult()
```

- [ ] **Step 4: `QuantumSimulator`**

```java
/**
 * Executes a {@link org.aitan.jqapi.quantum.Circuit} and exposes the resulting
 * {@link QuantumRegister}. Implemented by {@link LocalSimulator}.
 */
public interface QuantumSimulator {
    /** Runs the circuit, evolving the register state. */
    public void execute();
    /** @return the register holding the (post-execution) quantum state */
    public QuantumRegister getQuantumRegister();
}
```

- [ ] **Step 5: `LocalSimulator`**

```java
/**
 * In-memory {@link QuantumSimulator}. Applies each gate directly to the state
 * vector, so the full {@code 2^n x 2^n} level operator is never materialised;
 * this allows simulating circuits with many qubits and gates acting on
 * arbitrary, non-adjacent qubits.
 */
```
```java
/** @param circuit the circuit to simulate (register initialised to |0...0>) */
public LocalSimulator(Circuit circuit)

/** @param circuit the circuit to simulate
 *  @param qubits the initial per-qubit states */
public LocalSimulator(Circuit circuit, Qubit... qubits)

/** @param circuit the circuit to simulate
 *  @param alphas the initial amplitude coefficients */
public LocalSimulator(Circuit circuit, double... alphas)
```
(`execute()` e `getQuantumRegister()` ereditano il Javadoc dall'interfaccia: aggiungere `/** {@inheritDoc} */` sopra ciascuno.)

- [ ] **Step 6: `Gate`**

```java
/**
 * Base class for quantum gates. A gate exposes its unitary {@link ComplexMatrix}
 * and the qubit indexes it acts on. In multi-qubit gates the first declared
 * index is the most significant qubit.
 */
```
```java
/** @return the unitary matrix representing this gate */
public ComplexMatrix getMatrix()

/** @return the qubit indexes this gate acts on */
public List<Integer> getIndexes()

/** @return a human-readable gate type name */
public String getType()

/** @return the number of qubits this gate acts on */
public int getNumberQubits()

/** @return the dimension of the gate matrix */
public int getSize()
```

- [ ] **Step 7: `Qubit`**

```java
/**
 * Abstract single-qubit state. Concrete subclasses are {@code QubitZero},
 * {@code QubitOne} and {@code QubitSuperposition}.
 */
```
```java
/** @return the probability of measuring |0> */
public abstract double zeroProbability();

/** @return the probability of measuring |1> */
public abstract double oneProbability();

/** @return the two-component complex amplitude vector of this qubit */
public ComplexVector getValue()
```
(Lasciare invariati `toString`, `hashCode`, `equals`.)

- [ ] **Step 8: Verificare che il Javadoc compili senza errori**

Run:
```bash
mvn -q javadoc:javadoc 2>&1 | grep -iE "error|BUILD" | head
```
Expected: nessuna riga con `error`; se compare la riga `BUILD`, deve essere `BUILD SUCCESS`. (Warning su classi non documentate sono accettabili: lo scope è "di base".)

- [ ] **Step 9: Verificare che compili e i test passino**

Run:
```bash
mvn -q clean test 2>&1 | grep -E "Tests run: 29|BUILD"
```
Expected: `BUILD SUCCESS`, 29 test verdi.

- [ ] **Step 10: Commit**

```bash
git add src/main/java/org/aitan/jqapi/
git commit -m "docs: add Javadoc to core public API

Document Circuit, CircuitLevel, QuantumRegister, QuantumSimulator,
LocalSimulator, Gate and Qubit (class + key public methods). No signature
or behaviour changes."
```

---

### Task 5: Versioning, tag e GitHub Release

Portare la versione a `1.0.0`, taggare e pubblicare la Release con il jar.

**Files:**
- Modify: `pom.xml:6`

**Interfaces:**
- Consumes: repo con test verdi e pulito (Task 1–4).
- Produces: tag `v1.0.0` e GitHub Release pubblica con `jqapi-1.0.0.jar`.

- [ ] **Step 1: Rimuovere il suffisso SNAPSHOT dalla versione**

In `pom.xml` sostituire:
```xml
    <version>1.0.0-SNAPSHOT</version>
```
con:
```xml
    <version>1.0.0</version>
```

- [ ] **Step 2: Build del pacchetto finale**

Run:
```bash
mvn -q clean package 2>&1 | grep -E "Tests run: 29|BUILD"
ls -1 target/jqapi-1.0.0.jar
```
Expected: `BUILD SUCCESS`, 29 test verdi, e il file `target/jqapi-1.0.0.jar` esiste.

- [ ] **Step 3: Commit del bump di versione**

```bash
git add pom.xml
git commit -m "release: set version to 1.0.0"
```

- [ ] **Step 4: Merge del branch di release in main**

```bash
git checkout main
git merge --no-ff release/v1.0.0 -m "release: jqapi v1.0.0"
```
Expected: merge riuscito senza conflitti.

- [ ] **Step 5: Creare il tag annotato**

```bash
git tag -a v1.0.0 -m "jqapi 1.0.0 — first public release"
git push origin main
git push origin v1.0.0
```
Expected: `main` e il tag `v1.0.0` presenti su origin.

- [ ] **Step 6: Creare la GitHub Release con il jar allegato**

Prerequisito: `gh auth status` autenticato. Run:
```bash
gh release create v1.0.0 target/jqapi-1.0.0.jar \
  --title "jqapi 1.0.0" \
  --notes "First public release of jqapi, a Java library to simulate quantum computing.

Highlights:
- State-vector local simulator (gates applied directly to the state vector; supports many qubits and non-adjacent qubits)
- Gates: Identity, Pauli X/Y/Z/S/T, Hadamard, Swap, CNOT, CY, CZ, CSwap, Toffoli, Oracle, Measurement
- Algorithms & examples: Bell state, teleportation, Deutsch-Jozsa, Grover search, random bit

Requires Java 21. Build from source with \`mvn clean package\` or download the attached jar."
```
Expected: la Release `v1.0.0` è creata e `jqapi-1.0.0.jar` è tra gli asset.

- [ ] **Step 7: Verifica finale**

Run:
```bash
gh release view v1.0.0 --json tagName,assets --jq '{tag: .tagName, assets: [.assets[].name]}'
```
Expected: `{"tag":"v1.0.0","assets":["jqapi-1.0.0.jar"]}`.

---

## Self-Review (eseguita in fase di scrittura del piano)

**Spec coverage:**
- Sez. 1 (refactor test, approccio A) → Task 1. ✓
- Sez. 2 (pulizia: CircleCI, nbactions.xml, branch review) → Task 2. ✓
- Sez. 3 (README + Javadoc di base) → Task 3 (README) + Task 4 (Javadoc). ✓
- Sez. 4 (version bump, tag, GitHub Release con jar) → Task 5. ✓
- Ordine 1→2→3→4 rispettato dalla numerazione dei task. ✓
- Fuori scope (Maven Central, GPG, CHANGELOG, JaCoCo, nuove feature) → non presenti nel piano. ✓

**Placeholder scan:** nessun "TBD/TODO/handle edge cases"; ogni step ha comando o codice concreto. ✓

**Type/consistency:** il conteggio dei test (5 aggregatori → 29 `@Test`) è coerente tra Task 1 e le verifiche nei Task 2/4/5; i nomi dei metodi e delle classi combaciano con le firme reali estratte dal codice; `jqapi-1.0.0.jar` deriva da `artifactId=jqapi` + `version=1.0.0`. ✓

**Nota flakiness:** i test statistici (`testCoinLaunch`, `testBellState`, `testRandomBit`) sono già stati stabilizzati (commit `6fc71cd`); lo Step 8 del Task 1 li riesegue come guardia.
