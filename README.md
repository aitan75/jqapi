# Java Quantum API

_**jqapi**_ is a Java Api to test quantum computing concepts. At the moment you can simulate your quantum circuit with a local simulator.

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
        Qubit qubitZero=new Qubit();
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

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## License
Not available yet
