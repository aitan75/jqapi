# jqapi — Prima release ufficiale GitHub (v1.0.0)

**Data:** 2026-07-06
**Obiettivo:** portare jqapi dal suo stato attuale di progetto personale a una prima
release pubblica ufficiale su GitHub (tag `v1.0.0` + GitHub Release), con un livello
di qualità "solido ma essenziale": sistemare i bloccanti reali senza spingersi al
grado production/Maven Central.

## Contesto e stato attuale

jqapi è una libreria Java 21 / Maven (~2.400 LOC) che simula concetti di quantum
computing tramite un simulatore state-vector locale. Licenza MIT, versione
`1.0.0-SNAPSHOT`.

Stato verificato:

- **Build e test verdi.** `mvn clean test` → `BUILD SUCCESS`, 5/5 classi verdi.
- **Architettura pulita:** `math` (ComplexVector/Matrix), `quantum` (Qubit, Circuit,
  CircuitLevel, QuantumRegister), `quantum.gates` (~17 gate), `quantum.simulator`.
- **Motore efficiente:** i gate sono applicati direttamente allo state vector (non si
  costruisce l'operatore 2^n×2^n); gestisce ~20 qubit e qubit non adiacenti.
- **Algoritmi implementati:** Grover, Deutsch-Jozsa, teleportation, Bell state, random bit.
- **Igiene di libreria:** nessun `System.out`/`printStackTrace` nel codice main, nessun
  TODO/FIXME pendente.
- **CI GitHub Actions già presente e corretta** (`.github/workflows/build.yml`: JDK 21
  temurin, `mvn verify`, SonarCloud condizionale su `SONAR_TOKEN`).

Problemi da chiudere per la release:

1. **Test mal strutturati.** 34 metodi di test reali ma solo **5 `@Test`**: ogni classe
   ha un unico `@Test` che invoca a catena gli altri metodi. Conseguenze: nessun
   isolamento, il primo assert rotto nasconde i successivi, report CI fuorviante (5 test
   invece di 34).
2. **Residui repo.** `.circleci/config.yml` obsoleto (immagine `circleci/openjdk:14`
   legacy, Java 14 mentre il pom richiede 21); `nbactions.xml` (file IDE NetBeans)
   versionato; branch `review/step1-2` e `review/step3` già mergiati in main (zero diff).
3. **Documentazione.** README con badge CircleCI morto; Javadoc quasi assente sui metodi
   pubblici (solo `@author` a livello classe).
4. **Versioning.** Ancora `-SNAPSHOT`, nessun tag/Release pubblica.

## Scope della release

Livello scelto: **solido ma essenziale**. Dentro lo scope solo i 4 blocchi sotto.

**Esplicitamente fuori scope** (rimandati a release successive): pubblicazione su Maven
Central o GitHub Packages, firma GPG, source/javadoc jar pubblicati, CHANGELOG formale,
coverage con soglia JaCoCo, riscrittura completa della test suite, nuove feature.

## Sezione 1 — Refactor test (approccio A: split meccanico)

Convertire i 34 metodi test-like nascosti in altrettanti `@Test` isolati, senza toccare
la logica di test né il codice di produzione.

- Aggiungere `@Test` a ciascun metodo di test reale nelle 5 classi: `JavaQuantumAPITest`,
  `QuantumAlgorithmTest`, `QuantumMeasurementTest`, `LinearAlgebraTest`,
  `StateVectorSimulatorTest`.
- Rimuovere i metodi "aggregatori" (l'unico `@Test` per classe che invocava gli altri a
  catena).
- Rinominare i metodi il cui nome non descrive già il caso (`testXxx`).
- Nessuna modifica alle asserzioni o al codice `src/main`.
- Applicare la parametrizzazione (`@ParameterizedTest`) **solo** dove è banale e riduce
  rumore (es. le funzioni Deutsch-Jozsa `f0..f3`); altrimenti lasciare `@Test` semplici.

**Criterio di completamento:** `mvn test` esegue ~34 test (non 5), tutti verdi; nessun
test dipende dall'ordine di esecuzione.

## Sezione 2 — Pulizia repository

- Rimuovere `.circleci/config.yml` (superato dalla CI GitHub Actions esistente).
- Rimuovere `nbactions.xml` dal versionamento e aggiungerlo a `.gitignore`.
- Eliminare i branch `review/step1-2` e `review/step3` (già mergiati, zero diff).

**Criterio di completamento:** unica CI = GitHub Actions verde su `main`; nessun file
IDE/CI obsoleto versionato; solo branch attivi nel repo.

## Sezione 3 — Documentazione

- **README:** sostituire il badge CircleCI con quello GitHub Actions; aggiungere
  requisiti (Java 21), istruzioni di build (`mvn package`), elenco dei gate e degli
  algoritmi supportati, mantenere le convenzioni già documentate (qubit 0 = MSB, ecc.).
- **Javadoc di base** (non esaustivo) sui tipi pubblici centrali dell'API: `Circuit`,
  `CircuitLevel`, `QuantumRegister`, `QuantumSimulator`/`LocalSimulator`, `Gate` + i gate
  principali, `Qubit`. Focus su cosa fa la classe e sui metodi pubblici chiave e loro
  parametri.

**Criterio di completamento:** README senza riferimenti morti e con quick start valido;
le classi API principali hanno Javadoc che spiega uso e parametri.

## Sezione 4 — Versioning, tag & GitHub Release

- `pom.xml`: `1.0.0-SNAPSHOT` → `1.0.0`.
- Tag annotato `v1.0.0` su `main`.
- GitHub Release `v1.0.0` con note (simulatore state-vector, gate supportati, algoritmi)
  e **jar allegato** (`target/jqapi-1.0.0.jar` prodotto da `mvn package`).

**Criterio di completamento:** esiste il tag `v1.0.0` e una GitHub Release pubblica con
il jar scaricabile.

## Ordine di esecuzione

1 → 2 → 3 → 4. Test verdi e pulizia repo devono precedere il tag e la Release.

## Rischi e note

- Il refactor test è a rischio molto basso (non tocca `src/main`), ma alcuni test sono
  statistici (Hadamard, Bell, coin launch): dopo lo split vanno rieseguiti per confermare
  che le soglie statistiche reggano test per test.
- L'eliminazione dei branch remoti `review/*` va coordinata se qualcuno li ha in locale;
  sono comunque già contenuti in `main`.
- La firma/pubblicazione su repository di artefatti resta fuori: chi consuma la libreria
  in questa fase la costruisce da sorgente o scarica il jar dalla Release.
