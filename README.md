# Java Quantum API [![aitan75](https://circleci.com/gh/aitan75/jqapi.svg?style=svg)](https://app.circleci.com/pipelines/github/aitan75/jqapi)

_**jqapi**_ is a Java Api library to test quantum computing concepts. At the moment you can simulate your quantum circuit with a local simulator.

***

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

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## License
[MIT](LICENSE)
