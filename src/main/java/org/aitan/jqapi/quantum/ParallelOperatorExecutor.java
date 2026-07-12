package org.aitan.jqapi.quantum;

import java.util.concurrent.ForkJoinPool;
import java.util.function.IntConsumer;
import java.util.stream.IntStream;

/**
 * Multi-threaded {@link OperatorExecutor}. Instantiated only on the JVM path
 * (via {@link org.aitan.jqapi.JQAPIConfig#getDefault()}); it is never reachable
 * from the WASM entry point, so TeaVM drops it together with its
 * {@code ForkJoinPool} / {@code IntStream.parallel()} references.
 *
 * @author Gaetano Ferrara
 */
public final class ParallelOperatorExecutor implements OperatorExecutor {

    private final ForkJoinPool pool;

    /** @param pool the pool to run in, or {@code null} for the common pool */
    public ParallelOperatorExecutor(ForkJoinPool pool) {
        this.pool = pool;
    }

    /** @return the pool this executor submits to, or {@code null} for the common pool */
    public ForkJoinPool pool() {
        return pool;
    }

    @Override
    public void applyGroups(int dimension, int targetMask, IntConsumer groupApplier) {
        Runnable task = () -> IntStream.range(0, dimension).parallel().forEach(base -> {
            if ((base & targetMask) == 0) {
                groupApplier.accept(base);
            }
        });
        if (pool != null) {
            pool.submit(task).join(); // run the parallel stream inside the caller-supplied pool
        } else {
            task.run(); // uses the common ForkJoinPool
        }
    }
}
