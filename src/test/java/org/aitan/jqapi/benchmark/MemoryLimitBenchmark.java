package org.aitan.jqapi.benchmark;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.aitan.jqapi.Algorithm;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliX;

/**
 * Standalone stress benchmark that measures the <em>real</em> ceiling of the
 * simulator on the running machine — the defaults (24 qubits / 12 search
 * qubits) are conservative theoretical values, while boxed {@code Complex}
 * amplitudes cost far more than a raw {@code double[2]}, so the empirical limit
 * differs.
 * <p>
 * This class is intentionally <strong>NOT</strong> a JUnit test: it has no
 * {@code @Test} method and its name does not match the surefire include
 * patterns ({@code *Test}, {@code Test*}, {@code *Tests}, {@code *TestCase}),
 * so {@code mvn test} never runs it and can never be driven into an
 * {@link OutOfMemoryError}. Run it manually via its {@code main} method.
 * <p>
 * It raises the configured limit to the hard cap (via
 * {@code JQAPIConfig.of(30, 30)}, the {@code ABSOLUTE_MAX_QUBITS} ceiling) so
 * the MED-1 guard does not stop the growth before physical memory does; a hard
 * cap on the loop counters prevents a runaway on very large heaps.
 *
 * @author qa-automation-strategist
 */
public final class MemoryLimitBenchmark {

    /** Hard cap on qubits for loop 1 (JQAPIConfig.ABSOLUTE_MAX_QUBITS; 2^30 amplitudes is already far past any sane heap). */
    private static final int MAX_QUBITS_CAP = 30;
    /** Hard cap on search qubits for loop 2 (the dense oracle is O((2^n)^2)). */
    private static final int MAX_SEARCH_QUBITS_CAP = 20;
    /** Per-iteration wall-clock guard (ms): stop growing once one step gets this slow. */
    private static final long TIME_BUDGET_MS = 120_000L;
    /** A config raised to the hard cap so the domain guard does not stop us before memory does. */
    private static final JQAPIConfig UNCAPPED = JQAPIConfig.of(30, 30);

    private MemoryLimitBenchmark() {
    }

    public static void main(String[] args) {
        printEnvironment();

        int maxQubitsReached = runQubitLoop();
        SearchResult searchResult = runSearchLoop();

        printSummary(maxQubitsReached, searchResult);
    }

    // ------------------------------------------------------------------
    // Environment
    // ------------------------------------------------------------------
    private static void printEnvironment() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("========================================================");
        System.out.println(" JQAPI Memory Limit Benchmark");
        System.out.println("========================================================");
        System.out.println("os.name              : " + System.getProperty("os.name"));
        System.out.println("os.arch              : " + System.getProperty("os.arch"));
        System.out.println("java.version         : " + System.getProperty("java.version"));
        System.out.println("availableProcessors  : " + rt.availableProcessors());
        System.out.println("maxMemory (JVM heap) : " + toMb(rt.maxMemory()) + " MB");
        System.out.println("(physical RAM captured separately by the caller, e.g. `sysctl hw.memsize` on macOS)");
        System.out.println();
    }

    // ------------------------------------------------------------------
    // Loop 1 — max qubits (register + representative circuit execution)
    // ------------------------------------------------------------------
    private static int runQubitLoop() {
        System.out.println("--- Loop 1: max qubits (H on all qubits + X + H) ---");
        System.out.printf("%-6s %-12s %-14s %-40s%n", "n", "elapsed(ms)", "usedHeap(MB)", "status");

        int lastCompleted = 0;
        String stopReason = "reached hard cap of " + MAX_QUBITS_CAP + " qubits";

        for (int n = 1; n <= MAX_QUBITS_CAP; n++) {
            long start = System.currentTimeMillis();
            try {
                executeRepresentativeCircuit(n);
                long elapsed = System.currentTimeMillis() - start;
                long usedHeap = usedHeapBytes();
                System.out.printf("%-6d %-12d %-14d %-40s%n", n, elapsed, toMb(usedHeap), "OK");
                lastCompleted = n;

                if (elapsed > TIME_BUDGET_MS) {
                    stopReason = "iteration n=" + n + " exceeded the " + TIME_BUDGET_MS + " ms time budget";
                    break;
                }
            } catch (OutOfMemoryError oom) {
                System.out.printf("%-6d %-12s %-14s %-40s%n", n, "-", "-", "OutOfMemoryError: " + oom.getMessage());
                stopReason = "OutOfMemoryError at n=" + n;
                break;
            } catch (Throwable t) {
                System.out.printf("%-6d %-12s %-14s %-40s%n", n, "-", "-",
                        t.getClass().getSimpleName() + ": " + t.getMessage());
                stopReason = t.getClass().getSimpleName() + " at n=" + n;
                break;
            } finally {
                freeMemory();
            }
        }
        System.out.println("Loop 1 stopped: " + stopReason);
        System.out.println();
        return lastCompleted;
    }

    private static void executeRepresentativeCircuit(int n) {
        Circuit circuit = new Circuit(n, UNCAPPED);
        Integer[] all = IntStream.range(0, n).boxed().toArray(Integer[]::new);

        CircuitLevel hLevel = new CircuitLevel();
        hLevel.addGate(new Hadamard(all));
        CircuitLevel xLevel = new CircuitLevel();
        xLevel.addGate(new PauliX(0));
        CircuitLevel hLevel2 = new CircuitLevel();
        hLevel2.addGate(new Hadamard(all));
        circuit.addLevel(hLevel, xLevel, hLevel2);

        QuantumSimulator simulator = new LocalSimulator(circuit);
        simulator.execute();
    }

    // ------------------------------------------------------------------
    // Loop 2 — max search size (Grover, dense oracle dominates)
    // ------------------------------------------------------------------
    private static SearchResult runSearchLoop() {
        System.out.println("--- Loop 2: max search size (Grover, dense 2^n x 2^n oracle) ---");
        System.out.printf("%-8s %-12s %-14s %-14s %-40s%n", "nQubit", "listSize", "elapsed(ms)", "usedHeap(MB)", "status");

        int lastQubit = 0;
        int lastListSize = 0;
        long lastElapsed = 0;
        String stopReason = "reached hard cap of " + MAX_SEARCH_QUBITS_CAP + " search qubits";

        for (int nQubit = 2; nQubit <= MAX_SEARCH_QUBITS_CAP; nQubit++) {
            int listSize = 1 << nQubit; // exactly forces N_QUBIT = nQubit
            List<Integer> list = new ArrayList<>(listSize);
            for (int i = 0; i < listSize; i++) {
                list.add(i);
            }
            final Integer target = listSize - 1;
            Function<Integer, Boolean> isTarget = (Integer x) -> x.equals(target);

            long start = System.currentTimeMillis();
            try {
                Integer found = Algorithm.search(list, isTarget, UNCAPPED);
                long elapsed = System.currentTimeMillis() - start;
                long usedHeap = usedHeapBytes();
                String status = target.equals(found) ? "OK" : "WRONG RESULT: " + found;
                System.out.printf("%-8d %-12d %-14d %-14d %-40s%n", nQubit, listSize, elapsed, toMb(usedHeap), status);
                lastQubit = nQubit;
                lastListSize = listSize;
                lastElapsed = elapsed;

                if (elapsed > TIME_BUDGET_MS) {
                    stopReason = "nQubit=" + nQubit + " exceeded the " + TIME_BUDGET_MS + " ms time budget";
                    break;
                }
            } catch (OutOfMemoryError oom) {
                System.out.printf("%-8d %-12d %-14s %-14s %-40s%n", nQubit, listSize, "-", "-",
                        "OutOfMemoryError: " + oom.getMessage());
                stopReason = "OutOfMemoryError at nQubit=" + nQubit;
                break;
            } catch (Throwable t) {
                System.out.printf("%-8d %-12d %-14s %-14s %-40s%n", nQubit, listSize, "-", "-",
                        t.getClass().getSimpleName() + ": " + t.getMessage());
                stopReason = t.getClass().getSimpleName() + " at nQubit=" + nQubit;
                break;
            } finally {
                freeMemory();
            }
        }
        System.out.println("Loop 2 stopped: " + stopReason);
        System.out.println();
        return new SearchResult(lastQubit, lastListSize, lastElapsed, stopReason);
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    private static void printSummary(int maxQubitsReached, SearchResult searchResult) {
        Runtime rt = Runtime.getRuntime();
        System.out.println("========================================================");
        System.out.println(" SUMMARY (transcribe into README)");
        System.out.println("========================================================");
        System.out.println("OS / arch            : " + System.getProperty("os.name") + " / " + System.getProperty("os.arch"));
        System.out.println("CPU cores            : " + rt.availableProcessors());
        System.out.println("JVM max heap (MB)    : " + toMb(rt.maxMemory()));
        System.out.println("Max qubits reached   : " + maxQubitsReached + "  (register = 2^" + maxQubitsReached + " amplitudes)");
        System.out.println("Max search qubits    : " + searchResult.nQubit);
        System.out.println("Max search list size : " + searchResult.listSize);
        System.out.println("Slowest search (ms)  : " + searchResult.elapsedMs);
        System.out.println("Search stop reason   : " + searchResult.stopReason);
        System.out.println("Peak used heap (MB)  : " + toMb(usedHeapBytes()) + " (post-GC snapshot)");
        System.out.println("========================================================");
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private static long usedHeapBytes() {
        Runtime rt = Runtime.getRuntime();
        return rt.totalMemory() - rt.freeMemory();
    }

    private static long toMb(long bytes) {
        return bytes / (1024L * 1024L);
    }

    @SuppressWarnings("java:S1215") // explicit GC is deliberate: keep one iteration's garbage from distorting the next
    private static void freeMemory() {
        System.gc();
    }

    private static final class SearchResult {
        final int nQubit;
        final int listSize;
        final long elapsedMs;
        final String stopReason;

        SearchResult(int nQubit, int listSize, long elapsedMs, String stopReason) {
            this.nQubit = nQubit;
            this.listSize = listSize;
            this.elapsedMs = elapsedMs;
            this.stopReason = stopReason;
        }
    }
}
