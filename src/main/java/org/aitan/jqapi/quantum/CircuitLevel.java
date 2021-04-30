/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.aitan.jqapi.quantum.gates.Gate;

/**
 *
 * @author Gaetano Ferrara
 */
public class CircuitLevel {

    private List<Gate> gates;

    public CircuitLevel() {
        this.gates = new ArrayList<>();
    }

    public void addGate(Gate gate) {
        this.verify(gate);
        this.gates.add(gate);
    }
    
    void addGate(Integer index, Gate gate) {
        this.verify(gate);
        if(index>=this.gates.size()) {
            this.gates.add(gate);
        } else {
            this.gates.add(index,gate);
        }
        
    }

    public List<Gate> getGates() {
        return gates;
    }

    public void setGates(List<Gate> gates) {
        this.gates = gates;
    }

    // Verify if there are different gates applied to the same qubit at same circuit level
    private void verify(Gate gate) {

        if (!this.gates.isEmpty()) {
            boolean verify = gates.stream()
                    .flatMap(g -> g.getIndexes().stream())
                    .anyMatch(gate.getIndexes().stream().collect(Collectors.toList())::contains);

            if (verify) {
                throw new IllegalArgumentException("Adding gate that affects a qubit already involved in this circuit level");
            }
        }
    }

    

}
