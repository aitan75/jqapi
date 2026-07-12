package org.aitan.jqapi.quantum;

import java.util.function.IntConsumer;

/**
 * Strategy for iterating the independent amplitude-group leaders of an
 * {@code applyOperator} call. Extracting this keeps {@code ForkJoinPool} and
 * {@code IntStream.parallel()} out of {@link QuantumRegister}, so the TeaVM
 * (WASM/JS, issue #5 phase 2b) build can dead-code-eliminate the parallel path.
 *
 * @author Gaetano Ferrara
 */
@FunctionalInterface
public interface OperatorExecutor {

    /**
     * Invokes {@code groupApplier} once per group leader — every {@code base}
     * in {@code [0, dimension)} whose target bits (per {@code targetMask}) are
     * all zero. Groups are independent; visitation order is unspecified.
     *
     * @param dimension the state-vector half-length (number of base indexes)
     * @param targetMask bit mask of the gate's target positions
     * @param groupApplier applied to each group leader index
     */
    void applyGroups(int dimension, int targetMask, IntConsumer groupApplier);
}
