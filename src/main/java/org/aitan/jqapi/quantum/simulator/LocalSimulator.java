/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum.simulator;

import java.util.ArrayList;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.utils.Constants;

/**
 *
 * @author Gaetano Ferrara
 */
public class LocalSimulator implements QuantumSimulator {

    private final Circuit circuit;
    private final QuantumRegister quantumRegister;

    public LocalSimulator(Circuit circuit) {
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize());
    }

    public LocalSimulator(Circuit circuit, Qubit... qubits) {

        if (circuit.getInputSize() != qubits.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), qubits);
    }

    public LocalSimulator(Circuit circuit, double... alphas) {

        if (circuit.getInputSize() != alphas.length) {
            throw new IllegalArgumentException("Number of input qubits are different from circuit size");
        }
        this.circuit = circuit;
        this.quantumRegister = new QuantumRegister(circuit.getInputSize(), alphas);
    }

    @Override
    public void execute() {

        circuit.getLevels().forEach(
                level -> {
                    List<ComplexMatrix> matrices = new ArrayList<>();
                    level.getGates().forEach(gate -> {
                        if (gate.getType().equals(Constants.MEASUREMENT)) {
                            quantumRegister.measureQubitAtIndexes(gate.getIndexes());
                        }
                        if (gate.getType().equals(Constants.PROBABILITIES)) {

                        }
                        ComplexMatrix matrix = gate.getMatrix();
                        if (gate.getNumberQubits() == 1) {
                            gate.getIndexes().forEach(index -> {
                                matrices.add(matrix);
                            });
                        } else {
                            matrices.add(matrix);
                        }

                    });
                    ComplexMatrix kroneckerProduct = ComplexMatrix.kroneckerProduct(matrices);
                    this.quantumRegister.setRegisterState(new ComplexVector(kroneckerProduct.operate(this.quantumRegister.getRegisterState()).toArray()));
                }
        );
    }

    @Override
    public QuantumRegister getQuantumRegister() {
        return this.quantumRegister;
    }

}
