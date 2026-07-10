package org.aitan.jqapi.benchmark;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;

/**
 * Standalone benchmark comparing sequential vs parallel {@code applyOperator}
 * wall-clock for issue #8. NOT a JUnit test (no {@code @Test}, name doesn't match
 * surefire patterns). Run via its {@code main} method. Degree of parallelism is
 * controlled by {@code -Djava.util.concurrent.ForkJoinPool.common.parallelism=N}.
 */
public final class QuantumRegisterParallelBenchmark {

    private static final int[] QUBIT_COUNTS = {20, 22};
    private static final int WARMUP = 20;
    private static final int TIMED = 100;

    private QuantumRegisterParallelBenchmark() {
    }

    public static void main(String[] args) {
        System.out.println("os.arch             : " + System.getProperty("os.arch"));
        System.out.println("java.version        : " + System.getProperty("java.version"));
        System.out.println("availableProcessors : " + Runtime.getRuntime().availableProcessors());
        System.out.println("commonPool.parallelism : "
                + java.util.concurrent.ForkJoinPool.commonPool().getParallelism());
        System.out.printf("%-6s %-14s %-14s %-14s %-10s%n", "n", "gate", "seq ns/op", "par ns/op", "speedup");
        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", Constants.HADAMARD_MATRIX, Collections.singletonList(0));
            runCase(n, "2-qubit(CNOT)", Constants.CONTROLLED_NOT_MATRIX, Arrays.asList(0, n - 1));
        }
    }

    private static void runCase(int n, String label, ComplexMatrix gate, List<Integer> targets) {
        double seq = time(n, gate, targets, false);
        double par = time(n, gate, targets, true);
        System.out.printf("%-6d %-14s %-14.1f %-14.1f %-10.2f%n", n, label, seq, par, seq / par);
    }

    private static double time(int n, ComplexMatrix gate, List<Integer> targets, boolean parallel) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int i = 0; i < WARMUP; i++) {
            reg.applyOperator(gate, targets, parallel);
        }
        long start = System.nanoTime();
        for (int i = 0; i < TIMED; i++) {
            reg.applyOperator(gate, targets, parallel);
        }
        return (System.nanoTime() - start) / (double) TIMED;
    }
}
