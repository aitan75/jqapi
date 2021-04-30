/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
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
