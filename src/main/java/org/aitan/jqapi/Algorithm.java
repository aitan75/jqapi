/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi;

import java.util.List;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.Qubit;
import org.aitan.jqapi.quantum.QubitZero;
import org.aitan.jqapi.quantum.gates.GenericGate;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.Oracle;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.apache.commons.math3.complex.Complex;

/**
 *
 * @author Gaetano Ferrara
 */
public class Algorithm {

    public static int randomBit() {
        Circuit circuit = new Circuit(1);
        CircuitLevel level=new CircuitLevel();
        level.addGate(new Hadamard(0));
        circuit.addLevel(level);
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measure();
        Qubit qubitZero=new QubitZero();
        return qreg.getResult()[0].equals(qubitZero)?0:1;
    }
    
    public static <T> T search(List<T> list, Function<T, Boolean> function) throws JQApiException {
        int size = list.size();
        final int N_QUBIT = (int) Math.ceil((Math.log(size) / Math.log(2)));
        int N = 1 << N_QUBIT;
        final double count = Math.PI * Math.sqrt(N) / 4;
        Circuit circuit = new Circuit(N_QUBIT);
        CircuitLevel level1 = new CircuitLevel();
        Integer[] qubitIndexes = IntStream.range(0, N_QUBIT).boxed().toArray(Integer[]::new);
        level1.addGate(new Hadamard(qubitIndexes));
        Oracle oracle = createGroverOracle(N, list, function, qubitIndexes);
        ComplexMatrix matrix = createGenericGateMatrix(N);
        circuit.addLevel(level1);
        for (int i = 1; i < count; i++) {
            CircuitLevel levelS1 = new CircuitLevel();
            CircuitLevel levelS2 = new CircuitLevel();
            CircuitLevel levelS3 = new CircuitLevel();
            CircuitLevel levelS4 = new CircuitLevel();
            CircuitLevel levelS5 = new CircuitLevel();
            CircuitLevel levelS6 = new CircuitLevel();
            levelS1.addGate(oracle);
            levelS2.addGate(new Hadamard(qubitIndexes));
            levelS3.addGate(new PauliX(qubitIndexes));
            levelS4.addGate(new GenericGate(matrix, N_QUBIT, qubitIndexes));
            levelS5.addGate(new PauliX(qubitIndexes));
            levelS6.addGate(new Hadamard(qubitIndexes));
            circuit.addLevel(levelS1, levelS2, levelS3, levelS4, levelS5, levelS6);
        }
        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
        QuantumRegister qreg = simulator.getQuantumRegister();
        qreg.measure();
        String binaryString="";
        Qubit qubitZero=new QubitZero();
        for (int i = 0; i < N_QUBIT; i++) {
            binaryString+=qreg.getResult()[i].equals(qubitZero)?"0":"1";
        }
        return list.get(Integer.parseInt(binaryString, 2));
    }

    private static <T> Oracle createGroverOracle(int N, List<T> list, Function<T, Boolean> function, Integer[] qubitIndexes) throws JQApiException {
        int size=list.size();
        Complex[][] matrix = new Complex[N][N];
        boolean found=false;
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                if (i != j) {
                    matrix[i][j] = Complex.ZERO;
                } else {
                    if(i<size&&function.apply(list.get(i))) {
                        matrix[i][j] = Complex.ONE.multiply(-1);
                        found=true;
                    } else {
                        matrix[i][j] = Complex.ONE;
                    }
                }
            }
        }
        if(!found) throw new JQApiException("No element found in the list "+list+" with applied filter");
        return new Oracle(ComplexMatrix.createMatrixWithData(matrix), qubitIndexes);
    }

    private static ComplexMatrix createGenericGateMatrix(int size) {
        Complex[][] matrix = new Complex[size][size];
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                if (i != j) {
                    matrix[i][j] = Complex.ZERO;
                } else {
                    matrix[i][j] = Complex.ONE;
                }
            }
        }
        matrix[size - 1][size - 1] = matrix[size - 1][size - 1].multiply(-1);
        return ComplexMatrix.createMatrixWithData(matrix);
    }
}
