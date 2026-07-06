package org.aitan.jqapi;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.exceptions.JQApiLimitException;
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
        return search(list, function, JQAPIConfig.getDefault());
    }

    /**
     * Runs Grover's search over {@code list}, returning the first element for
     * which {@code function} evaluates to {@code true}, using the supplied
     * configuration to bound the required number of qubits.
     *
     * @param <T> the element type
     * @param list the list to search (must contain at least 2 elements)
     * @param function the predicate identifying the searched element
     * @param config the configuration bounding the search size
     * @return the matching element
     * @throws JQApiException if no element matches or the search does not converge
     * @throws JQApiLimitException if the list is too small or too large for the configured limits
     */
    public static <T> T search(List<T> list, Function<T, Boolean> function, JQAPIConfig config) throws JQApiException {
        Objects.requireNonNull(list, "list");
        int size = list.size();
        if (size < 2) {
            throw new JQApiLimitException("Search list must contain at least 2 elements, was: " + size);
        }
        final int N_QUBIT = 32 - Integer.numberOfLeadingZeros(size - 1); //exact ceil(log2(size)), no floating point
        if (N_QUBIT > config.maxSearchQubits()) {
            throw new JQApiLimitException("Search requires " + N_QUBIT + " qubits, exceeds maximum allowed search qubits (" + config.maxSearchQubits() + ")");
        }
        int N = 1 << N_QUBIT;
        final double count = Math.PI * Math.sqrt(N) / 4;
        Circuit circuit = new Circuit(N_QUBIT, config);
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
        //Grover is probabilistic: the amplified solution is measured with high
        //but not unit probability. Verify the measured candidate classically
        //and retry the simulation on an unlucky outcome.
        final int MAX_ATTEMPTS = 10;
        Qubit qubitZero = new QubitZero();
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            QuantumSimulator simulator = new LocalSimulator(circuit);
            simulator.execute();
            QuantumRegister qreg = simulator.getQuantumRegister();
            qreg.measure();
            StringBuilder binaryString = new StringBuilder();
            for (int i = 0; i < N_QUBIT; i++) {
                binaryString.append(qreg.getResult()[i].equals(qubitZero) ? "0" : "1");
            }
            int candidate = Integer.parseInt(binaryString.toString(), 2);
            if (candidate < size && function.apply(list.get(candidate))) {
                return list.get(candidate);
            }
        }
        throw new JQApiException("Grover search did not converge after " + MAX_ATTEMPTS + " attempts");
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
        if(!found) throw new JQApiException("No element found in the list of "+size+" elements with applied filter");
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
