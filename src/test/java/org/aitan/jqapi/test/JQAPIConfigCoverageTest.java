package org.aitan.jqapi.test;

import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class JQAPIConfigCoverageTest {

    @Test @DisplayName("of() validates both limits independently")
    void ofValidatesBothLimitsIndependently() {
        assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(0, 12));
        assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, 0));
        assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(31, 12));
        assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, 31));
    }

    @Test @DisplayName("getDefault returns defaults and is frozen")
    void getDefaultReturnsDefaults() {
        JQAPIConfig cfg = JQAPIConfig.getDefault();
        assertEquals(JQAPIConfig.DEFAULT_MAX_QUBITS, cfg.maxQubits());
        assertEquals(JQAPIConfig.DEFAULT_MAX_SEARCH_QUBITS, cfg.maxSearchQubits());
        assertEquals(JQAPIConfig.DEFAULT_PARALLEL_ENABLED, cfg.parallelEnabled());
        assertEquals(JQAPIConfig.DEFAULT_PARALLEL_THRESHOLD, cfg.parallelThreshold());
    }

    @Test @DisplayName("sequential() returns sequential config")
    void sequentialReturnsSequentialConfig() {
        JQAPIConfig cfg = JQAPIConfig.sequential(20);
        assertFalse(cfg.parallelEnabled());
        assertNotNull(cfg.operatorExecutor());
        assertNull(cfg.parallelExecutor());
    }

    @Test @DisplayName("withParallel() returns copy with new parallelism")
    void withParallelReturnsCopy() {
        JQAPIConfig base = JQAPIConfig.of(20, 10);
        JQAPIConfig copy = base.withParallel(false, 100);
        assertFalse(copy.parallelEnabled());
        assertEquals(100, copy.parallelThreshold());
        assertNotSame(base, copy);
    }

    @Test @DisplayName("withExecutor() returns copy with custom executor")
    void withExecutorReturnsCopy() {
        JQAPIConfig base = JQAPIConfig.of(20, 10);
        var pool = java.util.concurrent.ForkJoinPool.commonPool();
        JQAPIConfig copy = base.withExecutor(pool);
        assertSame(pool, copy.parallelExecutor());
        assertNotSame(base, copy);
    }

    @Test @DisplayName("parallelExecutor() returns null for sequential config")
    void parallelExecutorNullForSequential() {
        JQAPIConfig cfg = JQAPIConfig.sequential(10);
        assertNull(cfg.parallelExecutor());
    }


}