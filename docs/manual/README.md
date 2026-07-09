# jqapi User Manual

**jqapi** (Java Quantum API) is a Java library for experimenting with
quantum-computing concepts. You build a quantum circuit out of gates and run it
on a bundled local state-vector simulator — no quantum hardware or cloud account
required.

This manual is task-oriented and assumes you know Java but **not** quantum
computing. It builds up the concepts progressively and ends with complete,
runnable examples taken from the library's own test suite.

## Manual contents

1. [What jqapi is](#what-jqapi-is)
2. [Requirements](#requirements)
3. [Installation & build](#installation--build)
4. [Your first program: a quantum coin flip](#your-first-program-a-quantum-coin-flip)
5. [Core concepts](concepts.md) — qubits, gates, circuits, levels, registers, the simulator, measurement
6. [Worked examples](examples.md) — Bell state, two-coin flip, quantum teleportation, Deutsch–Jozsa, Grover search
7. [Reference](#reference)

For the class-by-class API, see the [API Reference](../api/README.md).

---

## What jqapi is

At its heart jqapi lets you:

1. Declare a **circuit** over a fixed number of **qubits**.
2. Add **gates** (Hadamard, Pauli, CNOT, Toffoli, custom oracles, ...),
   organized into **levels** that run left to right.
3. **Simulate** the circuit with `LocalSimulator`, which evolves the quantum
   state vector.
4. **Measure** the resulting **quantum register** to obtain classical bits.

The simulator applies each gate directly to the amplitude vector, so it never
builds the full `2^n x 2^n` operator of a circuit level. This keeps memory at
`O(2^n)` and lets gates act on arbitrary, non-adjacent qubits (e.g. a CNOT
between qubit 0 and qubit 2). Circuits with 16+ qubits are practical.

The library also ships a few ready-made algorithms in the
[`Algorithm`](../api/README.md#orgaitanjqapi--algorithms) class
(`randomBit`, Grover `search`).

---

## Requirements

- **Java 21+**
- **Maven 3.9+**

jqapi has no third-party runtime dependencies — it relies only on the Java 21
standard library. (JUnit is used for tests only.)

---

## Installation & build

Clone and build the library with Maven:

```bash
mvn clean package
```

The build produces `target/jqapi-1.0.0.jar`.

To use jqapi from another Maven project, install it to your local repository:

```bash
mvn clean install
```

then add the dependency:

```xml
<dependency>
    <groupId>org.aitan</groupId>
    <artifactId>jqapi</artifactId>
    <version>1.0.0</version>
</dependency>
```

> The `groupId`/`artifactId` above reflect the project coordinates
> (`org.aitan:jqapi:1.0.0`). jqapi is not published to Maven Central, so build
> and install it locally first.

---

## Your first program: a quantum coin flip

The simplest interesting circuit is a single Hadamard gate on one qubit. Starting
from `|0>`, Hadamard produces an equal superposition; measuring it yields `0` or
`1` with 50/50 probability — a fair quantum coin.

```java
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;

public class CoinFlip {
    public static void main(String[] args) {
        final int COUNT = 10_000;

        // 1. Build a 1-qubit circuit with a single Hadamard gate.
        Circuit circuit = new Circuit(1);
        CircuitLevel level = new CircuitLevel();
        level.addGate(new Hadamard(0));
        circuit.addLevel(level);

        // 2. Run it many times and tally the outcomes.
        int zeros = 0, ones = 0;
        Qubit zeroState = new QubitZero();
        for (int i = 0; i < COUNT; i++) {
            QuantumSimulator simulator = new LocalSimulator(circuit); // starts at |0>
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            if (qreg.getResult()[0].equals(zeroState)) {
                zeros++;
            } else {
                ones++;
            }
        }
        System.out.printf("Hadamard on |0> over %d runs: %d zeros, %d ones%n",
                COUNT, zeros, ones);
    }
}
```

You should see roughly `5000 zeros, 5000 ones`. The measurement is genuinely
random on each run (the register uses `SecureRandom` internally), so a fresh
simulator is created for every shot.

The identical logic is available as a one-liner:

```java
int bit = org.aitan.jqapi.Algorithm.randomBit(); // 0 or 1
```

Next, read the [core concepts](concepts.md), then work through the
[examples](examples.md).

---

## Reference

- [API Reference index](../api/README.md)
- [Quantum core](../api/quantum.md) — `Qubit`, `QuantumRegister`, `Circuit`, `CircuitLevel`
- [Gates](../api/gates.md)
- [Simulator](../api/simulator.md)
- [Math](../api/math.md)
- [Build integrity](build-integrity.md) — how the build verifies Maven artifact checksums

Runnable, verified examples live in the test suite under
`src/test/java/org/aitan/jqapi/test/`.
