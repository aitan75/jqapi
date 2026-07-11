# Java Quantum API [![Build](https://github.com/aitan75/jqapi/actions/workflows/build.yml/badge.svg)](https://github.com/aitan75/jqapi/actions/workflows/build.yml) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aitan75_jqapi&metric=coverage)](https://sonarcloud.io/summary/new_code?id=aitan75_jqapi)

_**jqapi**_ is a Java Api library to test quantum computing concepts. At the moment you can simulate your quantum circuit with a local simulator.

## Documentation

- **User Manual** — start here: [overview & first program](docs/manual/README.md), [core concepts](docs/manual/concepts.md), [worked examples](docs/manual/examples.md)
- **API Reference** — [index](docs/api/README.md): [quantum](docs/api/quantum.md), [gates](docs/api/gates.md), [simulator](docs/api/simulator.md), [math](docs/api/math.md), [visualization](docs/api/visualization.md)
- **Wiki** — [project wiki](https://github.com/aitan75/jqapi/wiki) for a guided overview, architecture notes, CI/quality explainer, and FAQ

***

## Requirements

- Java 21+
- Maven 3.9+

## Build

```bash
mvn clean package
```

The build produces `target/jqapi-1.0.0.jar`.

## Test coverage

`mvn verify` runs the test suite instrumented with [JaCoCo](https://www.jacoco.org/jacoco/), producing:

- `target/site/jacoco/index.html` — human-readable line/branch coverage report
- `target/site/jacoco/jacoco.xml` — machine-readable report, ingested by SonarCloud

CI runs `mvn -B verify` before the SonarCloud scan (`.github/workflows/build.yml`), so every build on `main` and every pull request updates the coverage badge above and the [SonarCloud dashboard](https://sonarcloud.io/summary/new_code?id=aitan75_jqapi). There is currently no enforced coverage threshold — coverage is tracked and visible, not gating.

## Getting Started

```java
        final int COUNT = 10000;
        Circuit circuit = new Circuit(1);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Hadamard(0));
        circuit.addLevel(level);
        int cntZero = 0;
        int cntOne = 0;
        Qubit qubitZero=new QubitZero();
        for (int j = 0; j < COUNT; j++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            if (qreg.getResult()[0].equals(qubitZero)) {
                cntZero++;
            } else {
                cntOne++;
            }
        }
        System.out.println("Executed " + COUNT + " times hadamard gate on single qubit: " + cntZero + " of them were 0 and " + cntOne + " were 1.");
```

## Simulator notes

The local simulator applies each gate directly to the state vector, so the full 2^n x 2^n operator of a circuit level is never built. This allows simulating circuits with many qubits (e.g. a 20-qubit GHZ circuit runs in a few seconds) and gates can act on arbitrary, non adjacent qubits:

```
Circuit circuit = new Circuit(3);
CircuitLevel level = new CircuitLevel();
level.addGate(new ControlledNot(0, 2)); // control on qubit 0, target on qubit 2
circuit.addLevel(level);
```

Conventions: qubit 0 is the most significant bit of the state index; in multi-qubit gates the first declared qubit is the most significant one (e.g. the control in `ControlledNot(control, target)`).

## Visualizing a circuit

Any `Circuit` can be drawn as a deterministic ASCII diagram — useful in the
terminal, in tests, and in bug reports. Build a circuit as usual and hand it to
`AsciiCircuitRenderer`:

```java
Circuit circuit = new Circuit(2);
CircuitLevel level1 = new CircuitLevel();
CircuitLevel level2 = new CircuitLevel();
level1.addGate(new Hadamard(0));
level2.addGate(new ControlledNot(0, 1));
circuit.addLevel(level1, level2);

AsciiCircuitRenderer renderer = new AsciiCircuitRenderer();
System.out.println(renderer.draw(circuit)); // or renderer.print(circuit);
```

```
q0: ─[H]──●─
          │
q1: ──────⊕─
```

Single-qubit gates are boxed (`[H]`), controls are `●`, CNOT targets `⊕`, Swap
targets `×`, and non-adjacent wires are crossed with `┼`. A pure-ASCII fallback
(`● → *`, `⊕ → (+)`, `× → X`) is available via `new AsciiCircuitRenderer(true)`
for terminals without Unicode.

Under the hood the renderer works on `CircuitSpec`, a lossless, serializable
description of a circuit. `CircuitSpecs.toCircuit(spec)` builds a runnable
`Circuit` from a spec and `CircuitSpecs.toSpec(circuit)` reflects one back — the
foundation for the upcoming save/load and graphical editor. See the
[visualization reference](docs/api/visualization.md) for details.

## Size limits

State vectors grow as 2^n, so registers, circuits and searches are bounded by `JQAPIConfig` to protect against resource exhaustion:

- defaults: `maxQubits` = 24, `maxSearchQubits` = 12; both hard-capped at 30 (`ABSOLUTE_MAX_QUBITS`, where `1 << n` would overflow `int`)
- override at JVM startup with `-Djqapi.max.qubits=N` / `-Djqapi.max.search.qubits=N` (read once at class initialization; invalid or out-of-range values fall back to the defaults, and later `System.setProperty` calls have no effect)
- per-instance: build a config with `JQAPIConfig.of(maxQubits, maxSearchQubits)` and pass it to `new Circuit(size, config)`, `QuantumRegister.forSimulation(size, config)` or `Algorithm.search(list, filter, config)`
- exceeding a limit throws the unchecked `JQApiLimitException`

### Measured ceilings (benchmark)

The defaults are conservative theoretical values; the real ceiling depends on the machine. Values measured with `MemoryLimitBenchmark` on a MacBook Pro (Apple M2, 8 cores, 24 GB RAM), macOS/aarch64, OpenJDK 25, default JVM max heap 6144 MB:

| Metric | Measured |
|--------|----------|
| Max register qubits completed | **26** (2^26 amplitudes; n=27 → `OutOfMemoryError`) |
| 3-level circuit at the default (24 qubits) | ~20 s |
| Max search qubits completed | **14** (list of 16384, ~146 s — over the 120 s/step budget) |
| Search at the default (12 qubits) | list of 4096 in ~5.4 s |

Search memory is dominated by the dense 2^n x 2^n Grover oracle, not by the state vector (tracked in [#15](https://github.com/aitan75/jqapi/issues/15)). The benchmark is excluded from `mvn test` on purpose; re-run it on your machine with:

```bash
mvn test-compile
mvn -q exec:java -Dexec.classpathScope=test -Dexec.mainClass=org.aitan.jqapi.benchmark.MemoryLimitBenchmark
```

## Supported gates

Identity, Pauli X/Y/Z, Pauli S, Pauli T, Hadamard, parametric rotations
Rx/Ry/Rz, phase shift P, universal U3, Swap, Controlled-NOT, Controlled-Y,
Controlled-Z, Controlled-Swap, Toffoli, generic multi-controlled Cᵐ(U), Oracle,
Measurement, Reset.

## Supported algorithms & examples

Bell state, quantum teleportation, Deutsch-Jozsa, Grover search, function
search, random bit generation. See the tests under
`src/test/java/org/aitan/jqapi/test/` for runnable examples.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

### Opening issues

We accept issues that are **properly documented**: state the issue type and use the matching **title prefix** and **label**.

| Type | Title prefix | Label | Use for |
|------|--------------|-------|---------|
| Feature | `[FEATURE] - ` | `enhancement` | New functionality or capability |
| Bug | `[BUG] - ` | `bug` | Defects and robustness/edge-case fixes |
| Security | `[SECURITY] - ` | `security` | Security hardening / DevSecOps |

A good issue includes: a short **Summary**, the **Motivation** (or the findings/steps to reproduce), a **Proposed solution**, **Acceptance criteria** (checklist), and **References** to affected code (`file:line`). See the open issues for ready-to-follow templates:

- Feature — [#2 initial size-limit configuration](https://github.com/aitan75/jqapi/issues/2)
- Bug — [#3 harden input handling](https://github.com/aitan75/jqapi/issues/3)
- Security — [#4 non-blocking CI/supply-chain hardening](https://github.com/aitan75/jqapi/issues/4)

## License
[MIT](LICENSE)
