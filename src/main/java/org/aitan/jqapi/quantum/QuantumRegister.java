/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum;

import java.util.Arrays;
import java.util.List;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.utils.Utils;
import org.apache.commons.math3.complex.Complex;

/**
 *
 * @author Gaetano Ferrara
 */
public class QuantumRegister {

    private final Qubit[] result;
    private final int size;
    private final ComplexVector input;
    private ComplexVector registerState;

    public QuantumRegister(int size) {
        this.result = new Qubit[size];
        this.size = size;
        this.initializeRegisterState();
        this.input = this.registerState;
    }

    public QuantumRegister(int size, Qubit[] qubits) {
        this.result = new Qubit[size];
        this.size = size;
        this.initializeRegisterState(qubits);
        this.input = this.registerState;
    }

    public QuantumRegister(int size, double... alphas) {
        this.result = new Qubit[size];
        this.size = size;
        this.initializeRegisterState(alphas);
        this.input = this.registerState;
    }

    public int getSize() {
        return size;
    }

    private void initializeRegisterState() {
        ComplexVector registerStateToUpdate = new Qubit(1).getValue();
        for (int i = 1; i < size; i++) {
            registerStateToUpdate = new Qubit(1).getValue().tensorProduct(registerStateToUpdate);
        }
        this.registerState = registerStateToUpdate;
    }

    private void initializeRegisterState(Qubit[] qubits) {
        ComplexVector registerStateToUpdate = qubits[0].getValue();
        for (int i = 1; i < size; i++) {
            registerStateToUpdate = qubits[i].getValue().tensorProduct(registerStateToUpdate);
        }
        this.registerState = registerStateToUpdate;
    }
    
    private void initializeRegisterState(double ... alphas) {
        ComplexVector registerStateToUpdate = new Qubit(alphas[0]).getValue();
        for (int i = 1; i < size; i++) {
            registerStateToUpdate = new Qubit(alphas[i]).getValue().tensorProduct(registerStateToUpdate);
        }
        this.registerState = registerStateToUpdate;
    }

    public ComplexVector getRegisterState() {
        return registerState;
    }

    public void setRegisterState(ComplexVector registerState) {
        if (registerState.getDimension() != this.registerState.getDimension()) {
            throw new IllegalArgumentException("ERROR: Overflow register dimension");
        }
        this.registerState = registerState;
    }

    public void measure() {
        int indexCollapsed = this.calculateCollapsedIndex();
        //Initialize all register state to 0
        for (int i = 0; i < registerState.getDimension(); i++) {
            registerState.setEntry(i, Complex.ZERO);

        }
        //Set indexCollapsed element of register state to 1
        registerState.setEntry(indexCollapsed, Complex.ONE);
        ComplexVector[] factorize = ComplexVector.factorize(registerState);
        for (int i = 0; i < size; i++) {
            result[i] = new Qubit(factorize[i].getEntry(0));
        }
    }

    public void measureQubitAtIndexes(List<Integer> indexes) {
        if (indexes.size() < size) {
            indexes.forEach(index -> {
                int indexCollapsed = this.calculateCollapsedIndex(index);
                ComplexVector qubitToMeasure = new ComplexVector(new Complex[]{Complex.ZERO, Complex.ZERO});
                qubitToMeasure.setEntry(indexCollapsed, Complex.ONE);
                this.result[index] = new Qubit(qubitToMeasure);
                this.updateRegisterStateAfterQubitCollapsed(index, indexCollapsed);
            });

        } else {
            this.measure();
        }

    }
    
    public Qubit[] getInput() {
        Qubit[] qubitsInput=new Qubit[size];
        ComplexVector[] factorize = ComplexVector.factorize(input);
        int i=0;
        for (ComplexVector complexVector : factorize) {
            qubitsInput[i]=new Qubit(complexVector);
            i++;
        }
        return qubitsInput;
    }

    public Qubit[] getResult() {
        return result;
    }

    private int calculateCollapsedIndex() {
        double random = Math.random();
        double p;

        int j = -1;
        while (random >= 0) {
            j++;
            p = Math.pow(this.registerState.getEntry(j).abs(), 2);
            random -= p;
        }

        return j;
    }

    private int calculateCollapsedIndex(int qubitIndex) {
        double random = Math.random();
        double zeroProbability = 0;
        double oneProbability = 0;

        for (int i = 0; i < this.registerState.getDimension(); i++) {
            String toBinary = Utils.toBinary(i, size);
            int bitAtIndex = Integer.parseInt(toBinary.substring(qubitIndex, qubitIndex + 1));
            zeroProbability += bitAtIndex == 0 ? Math.pow(this.registerState.getEntry(i).abs(), 2) : 0;
            oneProbability += bitAtIndex == 1 ? Math.pow(this.registerState.getEntry(i).abs(), 2) : 0;
        }
        return zeroProbability >= random ? 0 : 1;
    }
    private void updateRegisterStateAfterQubitCollapsed(int qubitPos, int indexCollapsed) {
        long count = 0;
        List<Complex> register = Arrays.asList(this.registerState.toArray());
        long registerNotZero = register.stream().filter(complex -> !complex.equals(Complex.ZERO)).count();
        for (int i = 0; i < this.registerState.getDimension(); i++) {
            int bitAtIndex = Utils.bitAtIndex(qubitPos, i, size);
            if (bitAtIndex == indexCollapsed&&!this.registerState.getEntry(i).equals(Complex.ZERO)) {
                double newProbability = Math.pow(this.registerState.getEntry(i).abs(), 2);
                this.registerState.setEntry(i, new Complex(Math.sqrt(newProbability)));
                count++;
            } else {
                this.registerState.setEntry(i, Complex.ZERO);
            }
        }
        double d=registerNotZero/count;
            
        Complex[] toArray = Arrays.asList(this.registerState.toArray()).stream().map(complex->complex.multiply(Math.sqrt(d))).toArray(Complex[]::new);
        this.registerState=new ComplexVector(toArray);
    }

}
