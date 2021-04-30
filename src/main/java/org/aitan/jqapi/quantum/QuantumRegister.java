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
    private final Qubit[] input;
    private ComplexVector registerState;

    public QuantumRegister(int size) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister();

    }

    public QuantumRegister(int size, Qubit[] qubits) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister(qubits);
    }

    public QuantumRegister(int size, double... alphas) {
        this.result = new Qubit[size];
        this.input = new Qubit[size];
        this.size = size;
        this.initializeQuantumRegister(alphas);

    }

    public int getSize() {
        return size;
    }

    public ComplexVector getRegisterState() {
        return registerState;
    }

    public Qubit[] getQubitRegisterState() {
        ComplexVector[] factorize = ComplexVector.factorize(this.registerState);
        Qubit[] qubits = new Qubit[size];
        for (int i = 0; i < factorize.length; i++) {
            qubits[i] = new Qubit(factorize[i]);
        }
        return qubits;
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
        return input;
    }

    public Qubit[] getResult() {
        return result;
    }

    private void initializeQuantumRegister() {
        ComplexVector registerStateToUpdate = new Qubit(1).getValue();
        this.input[0] = new Qubit(1);
        for (int i = 1; i < size; i++) {
            registerStateToUpdate = new Qubit(1).getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = new Qubit(1);
        }
        this.registerState = registerStateToUpdate;
    }

    private void initializeQuantumRegister(Qubit[] qubits) {
        ComplexVector registerStateToUpdate = qubits[0].getValue();
        this.input[0] = qubits[0];
        for (int i = 1; i < size; i++) {
            Qubit qubit = qubits[i];
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = registerStateToUpdate;
    }

    private void initializeQuantumRegister(double... alphas) {
        ComplexVector registerStateToUpdate = new Qubit(alphas[0]).getValue();
        this.input[0] = new Qubit(alphas[0]);
        for (int i = 1; i < size; i++) {
            Qubit qubit = new Qubit(alphas[i]);
            registerStateToUpdate = qubit.getValue().tensorProduct(registerStateToUpdate);
            this.input[i] = qubit;
        }
        this.registerState = registerStateToUpdate;
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
            if (bitAtIndex == indexCollapsed && !this.registerState.getEntry(i).equals(Complex.ZERO)) {
                double newProbability = Math.pow(this.registerState.getEntry(i).abs(), 2);
                this.registerState.setEntry(i, new Complex(Math.sqrt(newProbability)));
                count++;
            } else {
                this.registerState.setEntry(i, Complex.ZERO);
            }
        }
        double d = registerNotZero / count;

        Complex[] toArray = Arrays.asList(this.registerState.toArray()).stream().map(complex -> complex.multiply(Math.sqrt(d))).toArray(Complex[]::new);
        this.registerState = new ComplexVector(toArray);
    }

}
