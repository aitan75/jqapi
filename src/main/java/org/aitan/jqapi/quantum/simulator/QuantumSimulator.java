package org.aitan.jqapi.quantum.simulator;

import org.aitan.jqapi.quantum.QuantumRegister;

/**
 *
 * @author Gaetano Ferrara
 */
public interface QuantumSimulator {

    public void execute();
    public QuantumRegister getQuantumRegister();
}
