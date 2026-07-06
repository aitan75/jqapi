# Java Quantum API [![Build](https://github.com/aitan75/jqapi/actions/workflows/build.yml/badge.svg)](https://github.com/aitan75/jqapi/actions/workflows/build.yml)

_**jqapi**_ is a Java Api library to test quantum computing concepts. At the moment you can simulate your quantum circuit with a local simulator.

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

## License
[MIT](LICENSE)
