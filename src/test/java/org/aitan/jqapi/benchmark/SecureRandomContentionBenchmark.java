package org.aitan.jqapi.benchmark;

import java.security.SecureRandom;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.aitan.jqapi.quantum.QuantumRegister;

/**
 * Standalone concurrency measurement for the single shared {@link SecureRandom}
 * used by {@code QuantumRegister} measurement (security audit finding M-2).
 * NOT a JUnit test (no {@code @Test}, name doesn't match surefire patterns); run
 * via its {@code main} method.
 *
 * <p>It reports two workloads:
 * <ol>
 *   <li>a direct {@code nextDouble()} hot loop on the shared instance, which
 *       exposes the provider's internal lock under maximum pressure; and</li>
 *   <li>the actual use: concurrent {@code QuantumRegister.measure()} calls with
 *       one register per thread, where a single draw is amortised over the
 *       {@code O(2^n)} state-vector scan.</li>
 * </ol>
 * The register workload (table B) is the decision input: because a measurement
 * performs one draw per {@code O(2^n)} scan, the shared cryptographic instance is
 * not a throughput bottleneck and is retained. No non-cryptographic RNG is
 * introduced.
 */
public final class SecureRandomContentionBenchmark {

    /** Mirrors the shared instance in {@code QuantumRegister}. */
    private static final SecureRandom SHARED_RANDOM = new SecureRandom();

    private static final int[] THREADS = {1, 2, 4, 8};
    private static final int QUANTUM_REGISTER_QUBITS = 12;
    private static final long RNG_OPS_PER_THREAD = 1_000_000L;
    private static final long MEASURE_OPS_PER_THREAD = 20_000L;
    private static final long MEASURE_WARMUP_OPS = 1_000L;

    private SecureRandomContentionBenchmark() {
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("java.version        : " + System.getProperty("java.version"));
        System.out.println("availableProcessors : " + Runtime.getRuntime().availableProcessors());

        System.out.println();
        System.out.println("A. Shared SecureRandom.nextDouble() hot loop (lock stress, worst case)");
        System.out.printf("%-8s %-16s %-16s%n", "threads", "elapsed ns", "ns/op");
        for (int threads : THREADS) {
            runRng(threads);
            long start = System.nanoTime();
            runRng(threads);
            long elapsed = System.nanoTime() - start;
            System.out.printf("%-8d %-16d %-16.2f%n",
                    threads, elapsed, elapsed / (double) (RNG_OPS_PER_THREAD * threads));
        }

        System.out.println();
        System.out.println("B. Concurrent QuantumRegister.measure() (actual use: one draw per O(2^n))");
        System.out.printf("%-8s %-16s %-16s%n", "threads", "elapsed ns", "ns/measure");
        for (int threads : THREADS) {
            runMeasure(threads, MEASURE_WARMUP_OPS);
            long start = System.nanoTime();
            runMeasure(threads, MEASURE_OPS_PER_THREAD);
            long elapsed = System.nanoTime() - start;
            System.out.printf("%-8d %-16d %-16.2f%n",
                    threads, elapsed, elapsed / (double) (MEASURE_OPS_PER_THREAD * threads));
        }

        System.out.println();
        System.out.println("Decision (M-2): table B stays flat as threads grow because each measurement");
        System.out.println("draws once per O(2^n) scan, so the shared SecureRandom is retained.");
        System.out.println("Table A only shows the provider lock under a pathological hot loop.");
    }

    private static void runRng(int threads) throws InterruptedException {
        runParallel(threads, () -> {
            for (long i = 0; i < RNG_OPS_PER_THREAD; i++) {
                SHARED_RANDOM.nextDouble();
            }
        });
    }

    private static void runMeasure(int threads, long ops) throws InterruptedException {
        runParallel(threads, () -> {
            QuantumRegister register = new QuantumRegister(QUANTUM_REGISTER_QUBITS);
            for (long i = 0; i < ops; i++) {
                register.measure();
            }
        });
    }

    private static void runParallel(int threads, Runnable task) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        for (int t = 0; t < threads; t++) {
            pool.execute(() -> {
                ready.countDown();
                try {
                    go.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
                task.run();
                done.countDown();
            });
        }
        ready.await();
        go.countDown();
        done.await();
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
    }
}
