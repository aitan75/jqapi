package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;
import java.util.List;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;

/**
 * Standalone allocation benchmark for the measurement collapse path (issue #34),
 * which previously allocated a {@code String} per amplitude via
 * {@code Utils.toBinary}/{@code bitAtIndex}. NOT a JUnit test (no {@code @Test},
 * name doesn't match surefire patterns). Run via its {@code main} method.
 * <p>
 * Reports per-thread allocated bytes for a partial measurement, isolated from the
 * register-preparation cost by differencing (prep+measure) minus (prep only).
 */
public final class QuantumMeasurementAllocationBenchmark {

    private static final int[] QUBIT_COUNTS = {14, 16, 18};
    private static final int WARMUP = 20;
    private static final int TIMED = 200;
    private static long sink;

    private QuantumMeasurementAllocationBenchmark() {
    }

    public static void main(String[] args) {
        ThreadMXBean bean = (ThreadMXBean) ManagementFactory.getThreadMXBean();
        if (bean.isThreadAllocatedMemorySupported() && !bean.isThreadAllocatedMemoryEnabled()) {
            bean.setThreadAllocatedMemoryEnabled(true);
        }
        long tid = Thread.currentThread().threadId();
        System.out.printf("%-6s %-22s%n", "n", "partial-measure bytes/op");
        for (int n : QUBIT_COUNTS) {
            double prep = alloc(n, false, bean, tid);
            double prepAndMeasure = alloc(n, true, bean, tid);
            System.out.printf("%-6d %-22.1f%n", n, prepAndMeasure - prep);
        }
        if (sink == Long.MIN_VALUE) {
            System.out.println(sink); // keep the register from being optimized away
        }
    }

    private static double alloc(int n, boolean measure, ThreadMXBean bean, long tid) {
        for (int i = 0; i < WARMUP; i++) {
            run(n, measure);
        }
        long before = bean.getThreadAllocatedBytes(tid);
        for (int i = 0; i < TIMED; i++) {
            run(n, measure);
        }
        long after = bean.getThreadAllocatedBytes(tid);
        return (after - before) / (double) TIMED;
    }

    private static void run(int n, boolean measure) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int q = 0; q < n; q++) {
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(q));
        }
        if (measure) {
            reg.measureQubitAtIndexes(List.of(0));
        }
        sink += reg.getSize();
    }
}
