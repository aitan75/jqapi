package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.math.ComplexMatrix;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;

/**
 * Standalone benchmark of the production {@code QuantumRegister.applyOperator}
 * hot loop, for issue #12 phase 2's before/after comparison. Like
 * {@link MemoryLimitBenchmark}, this is
 * intentionally NOT a JUnit test: no {@code @Test} method, and its name doesn't
 * match surefire's include patterns ({@code *Test}, {@code Test*},
 * {@code *Tests}, {@code *TestCase}), so {@code mvn test} never runs it. Run it
 * manually via its {@code main} method.
 * <p>
 * For each of {16, 20} qubits x {1-qubit Hadamard, 2-qubit CNOT}, measures
 * steady-state wall-clock time and per-thread allocated bytes for repeated
 * gate application on an already-constructed register. Both gates are
 * self-inverse, so repeated application keeps the state bounded.
 */
public final class QuantumRegisterHotLoopBenchmark {

    private static final int[] QUBIT_COUNTS = {16, 20};
    private static final int WARMUP_ITERATIONS = 50;
    private static final int TIMED_ITERATIONS = 200;

    private QuantumRegisterHotLoopBenchmark() {
    }

    public static void main(String[] args) {
        if (args.length == 1 && args[0].equals("--baseline")) {
            runBaseline();
            return;
        }
        if (args.length != 0) throw new IllegalArgumentException("Usage: QuantumRegisterHotLoopBenchmark [--baseline]");
        printEnvironment();
        System.out.printf("%-6s %-14s %-14s %-14s%n", "n", "gate", "ns/op", "bytes/op");
        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", Constants.HADAMARD_MATRIX, Collections.singletonList(0));
            runCase(n, "2-qubit(CNOT)", Constants.CONTROLLED_NOT_MATRIX, Arrays.asList(0, n - 1));
        }
    }

    private static void runBaseline() {
        int warmup = BenchmarkSupport.integer("warmup", 50, 1, 1000);
        int repetitions = BenchmarkSupport.integer("repetitions", 200, 1, 1000);
        int n = BenchmarkSupport.integer("qubits", 20, 2, 24);
        BenchmarkSupport.checkMemory(n);
        BenchmarkSupport.environment(warmup, repetitions);
        QuantumRegister register = new QuantumRegister(n, JQAPIConfig.sequential(24));
        BenchmarkSupport.measure("H-q0-existing-register", n, warmup, repetitions,
                () -> register.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)));
        BenchmarkSupport.measure("CNOT-q0-qLast-existing-register", n, warmup, repetitions,
                () -> register.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1)));
    }

    private static void runCase(int n, String gateLabel, ComplexMatrix gate, List<Integer> targets) {
        QuantumRegister register = new QuantumRegister(n);
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            register.applyOperator(gate, targets);
        }

        ThreadMXBean threadBean = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        if (threadBean.isThreadAllocatedMemorySupported() && !threadBean.isThreadAllocatedMemoryEnabled()) {
            threadBean.setThreadAllocatedMemoryEnabled(true);
        }
        long threadId = Thread.currentThread().threadId();

        long allocBefore = threadBean.getThreadAllocatedBytes(threadId);
        long start = System.nanoTime();
        for (int i = 0; i < TIMED_ITERATIONS; i++) {
            register.applyOperator(gate, targets);
        }
        long elapsedNs = System.nanoTime() - start;
        long allocAfter = threadBean.getThreadAllocatedBytes(threadId);

        double nsPerOp = elapsedNs / (double) TIMED_ITERATIONS;
        double bytesPerOp = (allocAfter - allocBefore) / (double) TIMED_ITERATIONS;
        System.out.printf("%-6d %-14s %-14.1f %-14.1f%n", n, gateLabel, nsPerOp, bytesPerOp);
    }

    private static void printEnvironment() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("==============================================================");
        System.out.println(" JQAPI QuantumRegister hot-loop benchmark (issue #12 phase 2)");
        System.out.println("==============================================================");
        System.out.println("os.name              : " + System.getProperty("os.name"));
        System.out.println("os.arch              : " + System.getProperty("os.arch"));
        System.out.println("java.version         : " + System.getProperty("java.version"));
        System.out.println("availableProcessors  : " + rt.availableProcessors());
        System.out.println();
    }
}
