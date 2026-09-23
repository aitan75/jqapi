package org.aitan.jqapi.benchmark;

import com.sun.management.ThreadMXBean;
import java.lang.management.ManagementFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import org.aitan.jqapi.visualization.render.AsciiCircuitRenderer;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.aitan.jqapi.visualization.spec.GateKind;
import org.aitan.jqapi.visualization.spec.GateSpec;
import org.aitan.jqapi.visualization.spec.LevelSpec;

/**
 * Standalone per-thread allocation comparison for serialization and rendering.
 * Run the same compiled benchmark against baseline and candidate core classes.
 * This is not a throughput benchmark or a JUnit test.
 */
public final class CircuitVisualizationAllocationBenchmark {
    private static final int WARMUP = 500;
    private static final int ITERATIONS = 1_000;
    private static volatile String sink;

    private CircuitVisualizationAllocationBenchmark() {
    }

    public static void main(String[] args) {
        if (!(ManagementFactory.getThreadMXBean() instanceof ThreadMXBean bean)
                || !bean.isThreadAllocatedMemorySupported()) {
            throw new IllegalStateException("Per-thread allocation measurement is unavailable");
        }
        bean.setThreadAllocatedMemoryEnabled(true);
        AsciiCircuitRenderer renderer = new AsciiCircuitRenderer();
        System.out.println("levels,json bytes/op,renderer bytes/op");
        for (int count : new int[]{10, 100, 1_000}) {
            CircuitSpec spec = fixture(count);
            double jsonBytes = allocated(bean, () -> CircuitSpecJson.toJson(spec));
            double renderBytes = allocated(bean, () -> renderer.draw(spec));
            System.out.printf(java.util.Locale.ROOT, "%d,%.0f,%.0f%n", count, jsonBytes, renderBytes);
        }
    }

    private static double allocated(ThreadMXBean bean, Supplier<String> operation) {
        for (int i = 0; i < WARMUP; i++) {
            sink = operation.get();
        }
        long threadId = Thread.currentThread().threadId();
        long before = bean.getThreadAllocatedBytes(threadId);
        for (int i = 0; i < ITERATIONS; i++) {
            sink = operation.get();
        }
        return (bean.getThreadAllocatedBytes(threadId) - before) / (double) ITERATIONS;
    }

    private static CircuitSpec fixture(int count) {
        List<LevelSpec> levels = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            levels.add(new LevelSpec(List.of(
                    new GateSpec(GateKind.CNOT, List.of(7), List.of(0), Map.of(), null),
                    new GateSpec(GateKind.RX, List.of(1), List.of(), Map.of("theta", 0.5), null),
                    new GateSpec(GateKind.U3, List.of(2), List.of(),
                            Map.of("theta", 0.5, "phi", 0.25, "lambda", 0.125), null))));
        }
        return CircuitSpec.of(8, levels);
    }
}
