package org.aitan.jqapi.quantum;

import java.util.function.IntConsumer;

/**
 * Single-threaded {@link OperatorExecutor}. TeaVM-safe (no concurrency), so it
 * is the executor the WASM/JS build uses.
 *
 * @author Gaetano Ferrara
 */
public final class SequentialOperatorExecutor implements OperatorExecutor {

    @Override
    public void applyGroups(int dimension, int targetMask, IntConsumer groupApplier) {
        for (int base = 0; base < dimension; base++) {
            if ((base & targetMask) == 0) {
                groupApplier.accept(base);
            }
        }
    }
}
