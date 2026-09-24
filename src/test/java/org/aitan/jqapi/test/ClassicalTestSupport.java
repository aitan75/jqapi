package org.aitan.jqapi.test;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.*;
import org.aitan.jqapi.quantum.gates.Gate;

final class ClassicalTestSupport {
    static Circuit circuit(int qubits, int bits, Gate... gates) {
        Circuit circuit = new Circuit(qubits, bits, JQAPIConfig.sequential(24));
        for (Gate gate : gates) append(circuit, gate);
        return circuit;
    }
    static void append(Circuit circuit, Gate... gates) {
        CircuitLevel level = new CircuitLevel();
        for (Gate gate : gates) level.addGate(gate);
        circuit.addLevel(level);
    }
}
