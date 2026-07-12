package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.List;
import java.util.function.IntConsumer;
import org.aitan.jqapi.quantum.OperatorExecutor;
import org.aitan.jqapi.quantum.ParallelOperatorExecutor;
import org.aitan.jqapi.quantum.SequentialOperatorExecutor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class OperatorExecutorTest {

    private static List<Integer> collectLeaders(OperatorExecutor exec, int dimension, int targetMask) {
        List<Integer> seen = new ArrayList<>();
        IntConsumer apply = base -> {
            synchronized (seen) {
                seen.add(base);
            }
        };
        exec.applyGroups(dimension, targetMask, apply);
        seen.sort(Integer::compareTo);
        return seen;
    }

    @Test
    void sequentialAndParallel_visitTheSameLeaderIndexes() {
        int dimension = 1 << 8;
        int targetMask = 0b10; // group leaders are indexes with that bit clear
        List<Integer> seq = collectLeaders(new SequentialOperatorExecutor(), dimension, targetMask);
        List<Integer> par = collectLeaders(new ParallelOperatorExecutor(null), dimension, targetMask);
        assertEquals(seq, par);
        for (int base : seq) {
            assertEquals(0, base & targetMask, "leader must have target bits clear");
        }
    }
}
