# Java Quantum API [![Build](https://github.com/aitan75/jqapi/actions/workflows/build.yml/badge.svg)](https://github.com/aitan75/jqapi/actions/workflows/build.yml)

_**jqapi**_ is a Java Api library to test quantum computing concepts. At the moment you can simulate your quantum circuit with a local simulator.

## Documentation

- **User Manual** — start here: [overview & first program](docs/manual/README.md), [core concepts](docs/manual/concepts.md), [worked examples](docs/manual/examples.md)
- **API Reference** — [index](docs/api/README.md): [quantum](docs/api/quantum.md), [gates](docs/api/gates.md), [simulator](docs/api/simulator.md), [math](docs/api/math.md)

***

## Requirements

- Java 21+
- Maven 3.9+

## Build

```bash
mvn clean package
```

The build produces `target/jqapi-1.0.0.jar`.

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

## Supported gates

Identity, Pauli X/Y/Z, Pauli S, Pauli T, Hadamard, Swap, Controlled-NOT,
Controlled-Y, Controlled-Z, Controlled-Swap, Toffoli, Oracle, Measurement.

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
