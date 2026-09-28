package org.aitan.jqapi.benchmark;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryType;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;

/** Shared metadata and bounded measurements for the existing standalone harnesses. */
final class BenchmarkSupport {
    private BenchmarkSupport() { }

    static int integer(String name, int fallback, int min, int max) {
        int value = Integer.parseInt(System.getProperty("benchmark." + name, Integer.toString(fallback)));
        if (value < min || value > max) throw new IllegalArgumentException(name + " must be in [" + min + ", " + max + "]");
        return value;
    }

    static void environment(int warmup, int repetitions) {
        System.out.println("timestamp=" + Instant.now());
        System.out.println("commit=" + System.getProperty("benchmark.commit", "UNRECORDED"));
        System.out.println("workingTree=" + System.getProperty("benchmark.tree", "UNRECORDED"));
        System.out.println("machine=" + System.getProperty("benchmark.machine", "UNRECORDED"));
        System.out.println("os=" + System.getProperty("os.name") + " " + System.getProperty("os.version") + " " + System.getProperty("os.arch"));
        System.out.println("jvm=" + System.getProperty("java.vm.name") + " " + System.getProperty("java.runtime.version"));
        System.out.println("jvmArgs=" + ManagementFactory.getRuntimeMXBean().getInputArguments());
        System.out.println("processors=" + Runtime.getRuntime().availableProcessors());
        System.out.println("maxHeapBytes=" + Runtime.getRuntime().maxMemory());
        System.out.println("warmup=" + warmup + ", repetitions=" + repetitions + ", execution=sequential");
        System.out.println("memoryMetric=sum of heap-pool peak used bytes since reset; not simultaneous live peak or RSS");
        System.out.println("workload,qubits,minMs,medianMs,maxMs,heapPoolPeakSumBytes,stateVectorLowerBoundBytes,samplesMs");
    }

    static void checkMemory(int qubits) {
        // Headroom for copies/temporaries: a preflight guard, not a capacity claim.
        if (64L * (1L << qubits) > Runtime.getRuntime().maxMemory() / 2) {
            throw new IllegalArgumentException("Workload exceeds benchmark heap budget; reduce qubits or increase -Xmx");
        }
    }

    static void measure(String name, int qubits, int warmup, int repetitions, Runnable operation) {
        checkMemory(qubits);
        for (int i = 0; i < warmup; i++) operation.run();
        var pools = ManagementFactory.getMemoryPoolMXBeans().stream()
                .filter(pool -> pool.getType() == MemoryType.HEAP).toList();
        pools.forEach(pool -> pool.resetPeakUsage());
        double[] samples = new double[repetitions];
        for (int i = 0; i < repetitions; i++) {
            long start = System.nanoTime();
            operation.run();
            samples[i] = (System.nanoTime() - start) / 1e6;
        }
        long peak = pools.stream().mapToLong(pool -> pool.getPeakUsage().getUsed()).sum();
        double[] sorted = samples.clone();
        Arrays.sort(sorted);
        double median = (sorted[(repetitions - 1) / 2] + sorted[repetitions / 2]) / 2;
        System.out.printf(Locale.ROOT, "%s,%d,%.6f,%.6f,%.6f,%d,%d,\"%s\"%n",
                name, qubits, sorted[0], median, sorted[repetitions - 1], peak,
                16L * (1L << qubits), Arrays.toString(samples));
    }
}
