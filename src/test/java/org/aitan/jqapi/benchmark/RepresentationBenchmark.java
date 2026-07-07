package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;

/**
 * Standalone benchmark comparing the raw {@code double[]} baseline against the
 * EJML {@code ZMatrixRMaj} candidate for issue #12's amplitude representation
 * decision. Like {@link MemoryLimitBenchmark}, this is intentionally NOT a
 * JUnit test: no {@code @Test} method, and its name doesn't match surefire's
 * include patterns ({@code *Test}, {@code Test*}, {@code *Tests},
 * {@code *TestCase}), so {@code mvn test} never runs it. Run it manually via
 * its {@code main} method.
 * <p>
 * For each of {16, 20} qubits x {1-qubit gate, 2-qubit gate}, this first
 * verifies both representations compute identical results for one gate
 * application (float tolerance), then measures steady-state wall-clock time
 * and per-thread allocated bytes for repeated gate application on an
 * already-allocated state.
 */
public final class RepresentationBenchmark {

    private static final int[] QUBIT_COUNTS = {16, 20};
    private static final int WARMUP_ITERATIONS = 50;
    private static final int TIMED_ITERATIONS = 200;
    private static final double TOLERANCE = 1e-9;

    // 2x2, interleaved (re, im) row-major; mirrors Constants.HADAMARD_MATRIX
    // (src/main/java/org/aitan/jqapi/utils/Constants.java:90-92)
    private static final double HALF = 1.0 / Math.sqrt(2.0);
    private static final double[] HADAMARD_GATE_FLAT = {
        HALF, 0.0, HALF, 0.0,
        HALF, 0.0, -HALF, 0.0
    };

    // 4x4, interleaved (re, im) row-major; mirrors Constants.CONTROLLED_NOT_MATRIX
    // (src/main/java/org/aitan/jqapi/utils/Constants.java:40-45)
    private static final double[] CNOT_GATE_FLAT = {
        1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 1, 0, 0, 0
    };

    private RepresentationBenchmark() {
    }

    public static void main(String[] args) {
        printEnvironment();
        System.out.printf("%-6s %-14s %-20s %-14s %-14s %-12s%n",
                "n", "gate", "impl", "ns/op", "bytes/op", "correctness");

        for (int n : QUBIT_COUNTS) {
            runCase(n, "1-qubit(H)", new int[]{0}, HADAMARD_GATE_FLAT);
            runCase(n, "2-qubit(CNOT)", new int[]{0, n - 1}, CNOT_GATE_FLAT);
        }
    }

    private static void runCase(int n, String gateLabel, int[] targets, double[] gateFlat) {
        boolean correct = checkCorrectness(n, targets, gateFlat);

        Result baseline = measure(new RawStateBaseline(n), targets, gateFlat);
        Result ejml = measure(new EjmlStateBenchmark(n), targets, gateFlat);

        printRow(n, gateLabel, "double[] baseline", baseline, correct);
        printRow(n, gateLabel, "EJML ZMatrixRMaj", ejml, correct);
    }

    private static void printRow(int n, String gateLabel, String impl, Result result, boolean correct) {
        System.out.printf("%-6d %-14s %-20s %-14.1f %-14.1f %-12s%n",
                n, gateLabel, impl, result.nsPerOp, result.bytesPerOp, correct ? "OK" : "MISMATCH");
    }

    private static boolean checkCorrectness(int n, int[] targets, double[] gateFlat) {
        RawStateBaseline baseline = new RawStateBaseline(n);
        EjmlStateBenchmark ejml = new EjmlStateBenchmark(n);
        baseline.applyGate(targets, gateFlat);
        ejml.applyGate(targets, gateFlat);
        double[] a = baseline.snapshot();
        double[] b = ejml.snapshot();
        for (int i = 0; i < a.length; i++) {
            if (Math.abs(a[i] - b[i]) > TOLERANCE) {
                return false;
            }
        }
        return true;
    }

    private static Result measure(AmplitudeState impl, int[] targets, double[] gateFlat) {
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            impl.applyGate(targets, gateFlat);
        }

        ThreadMXBean threadBean = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        if (threadBean.isThreadAllocatedMemorySupported() && !threadBean.isThreadAllocatedMemoryEnabled()) {
            threadBean.setThreadAllocatedMemoryEnabled(true);
        }
        long threadId = Thread.currentThread().threadId();

        long allocBefore = threadBean.getThreadAllocatedBytes(threadId);
        long start = System.nanoTime();
        for (int i = 0; i < TIMED_ITERATIONS; i++) {
            impl.applyGate(targets, gateFlat);
        }
        long elapsedNs = System.nanoTime() - start;
        long allocAfter = threadBean.getThreadAllocatedBytes(threadId);

        double nsPerOp = elapsedNs / (double) TIMED_ITERATIONS;
        double bytesPerOp = (allocAfter - allocBefore) / (double) TIMED_ITERATIONS;
        return new Result(nsPerOp, bytesPerOp);
    }

    private static void printEnvironment() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("========================================================");
        System.out.println(" JQAPI Representation Benchmark (Issue #12 Phase 1 spike)");
        System.out.println("========================================================");
        System.out.println("os.name              : " + System.getProperty("os.name"));
        System.out.println("os.arch              : " + System.getProperty("os.arch"));
        System.out.println("java.version         : " + System.getProperty("java.version"));
        System.out.println("availableProcessors  : " + rt.availableProcessors());
        System.out.println();
    }

    private static final class Result {
        final double nsPerOp;
        final double bytesPerOp;

        Result(double nsPerOp, double bytesPerOp) {
            this.nsPerOp = nsPerOp;
            this.bytesPerOp = bytesPerOp;
        }
    }
}
