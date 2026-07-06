package org.aitan.jqapi.quantum.simulator;

import org.aitan.jqapi.quantum.QuantumRegister;

/**
 * Executes a {@link org.aitan.jqapi.quantum.Circuit} and exposes the resulting
 * {@link QuantumRegister}. Implemented by {@link LocalSimulator}.
 *
 * @author Gaetano Ferrara
 */
public interface QuantumSimulator {

    /** Runs the circuit, evolving the register state. */
    public void execute();
    /** @return the register holding the (post-execution) quantum state */
    public QuantumRegister getQuantumRegister();
}
