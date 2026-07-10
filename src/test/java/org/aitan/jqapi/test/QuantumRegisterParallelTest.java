package org.aitan.jqapi.test;

import java.util.List;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RejectedExecutionException;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.aitan.jqapi.math.ComplexVector;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.utils.Constants;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class QuantumRegisterParallelTest {

    private static final double TOL = 1e-9;

    // A dense state: Hadamard on every qubit (built via the sequential path).
    private static QuantumRegister uniformSuperposition(int n) {
        QuantumRegister reg = new QuantumRegister(n);
        for (int q = 0; q < n; q++) {
            reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(q), false);
        }
        return reg;
    }

    private static void assertRegistersEqual(QuantumRegister a, QuantumRegister b, int n) {
        ComplexVector va = a.getRegisterState();
        ComplexVector vb = b.getRegisterState();
        int dim = 1 << n;
        for (int i = 0; i < dim; i++) {
            assertEquals(va.getEntry(i), vb.getEntry(i), "amplitude " + i);
        }
    }

    @Test
    void parallel_matchesSequential_hadamard() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), false);
        par.applyOperator(Constants.HADAMARD_MATRIX, List.of(3), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_cnotNonAdjacent() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), false);
        par.applyOperator(Constants.CONTROLLED_NOT_MATRIX, List.of(0, n - 1), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void parallel_matchesSequential_rotationZ() {
        int n = 12;
        QuantumRegister seq = uniformSuperposition(n);
        QuantumRegister par = uniformSuperposition(n);
        seq.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), false);
        par.applyOperator(Constants.rotationZMatrix(0.7), List.of(5), true);
        assertRegistersEqual(seq, par, n);
    }

    @Test
    void autoPath_largeRegister_hadamardIsCorrect() {
        int n = 16; // dimension 65536 >= PARALLEL_MIN_DIMENSION -> auto parallel
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)); // auto path
        double inv = 1.0 / Math.sqrt(2.0);
        // Qubit 0 is the MSB: its |1> branch is index (1 << (n-1)).
        assertEquals(inv, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(0).getImaginary(), TOL);
        assertEquals(inv, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(12345).getReal(), TOL);
    }

    @Test
    void autoPath_hadamardTwice_isIdentity() {
        int n = 16;
        QuantumRegister reg = new QuantumRegister(n);
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0));
        assertEquals(1.0, reg.getRegisterState().getEntry(0).getReal(), TOL);
        assertEquals(0.0, reg.getRegisterState().getEntry(1 << (n - 1)).getReal(), TOL);
    }

    // --- JQAPIConfig parallelism policy ---

    @Test
    void config_parallelDefaults() {
        JQAPIConfig c = JQAPIConfig.of(24, 12);
        assertTrue(c.parallelEnabled());
        assertEquals(1 << 16, c.parallelThreshold());
        assertNull(c.parallelExecutor());
    }

    @Test
    void config_withParallelAndExecutor_areImmutableCopies() {
        JQAPIConfig base = JQAPIConfig.of(24, 12);
        ForkJoinPool pool = new ForkJoinPool(2);
        try {
            JQAPIConfig c = base.withParallel(false, 1024).withExecutor(pool);
            assertFalse(c.parallelEnabled());
            assertEquals(1024, c.parallelThreshold());
            assertSame(pool, c.parallelExecutor());
            // base is untouched (immutable withers)
            assertTrue(base.parallelEnabled());
            assertEquals(1 << 16, base.parallelThreshold());
            assertNull(base.parallelExecutor());
        } finally {
            pool.shutdown();
        }
    }

    @Test
    void config_rejectsNonPositiveThreshold() {
        assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, 12).withParallel(true, 0));
    }

    // --- QuantumRegister honours the config policy + executor ---

    @Test
    void register_customExecutorIsUsed_shutdownPoolRejects() {
        ForkJoinPool pool = new ForkJoinPool(2);
        pool.shutdown(); // now rejects submissions
        JQAPIConfig cfg = JQAPIConfig.of(24, 12).withParallel(true, 1).withExecutor(pool);
        QuantumRegister reg = new QuantumRegister(12, cfg); // dim 4096 >= threshold 1 -> parallel via pool
        assertThrows(RejectedExecutionException.class,
                () -> reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)));
    }

    @Test
    void register_parallelDisabled_ignoresExecutor() {
        ForkJoinPool pool = new ForkJoinPool(2);
        pool.shutdown();
        JQAPIConfig cfg = JQAPIConfig.of(24, 12).withParallel(false, 1).withExecutor(pool);
        QuantumRegister reg = new QuantumRegister(12, cfg);
        // disabled -> sequential path -> pool never touched -> no rejection
        assertDoesNotThrow(() -> reg.applyOperator(Constants.HADAMARD_MATRIX, List.of(0)));
    }

    @Test
    void register_customExecutor_producesCorrectResults() {
        ForkJoinPool pool = new ForkJoinPool(2);
        try {
            JQAPIConfig cfg = JQAPIConfig.of(24, 12).withParallel(true, 1).withExecutor(pool);
            QuantumRegister par = new QuantumRegister(12, cfg);
            QuantumRegister seq = new QuantumRegister(12);
            for (int q = 0; q < 12; q++) {
                par.applyOperator(Constants.HADAMARD_MATRIX, List.of(q));       // custom pool (threshold 1)
                seq.applyOperator(Constants.HADAMARD_MATRIX, List.of(q), false); // sequential reference
            }
            assertRegistersEqual(seq, par, 12);
        } finally {
            pool.shutdown();
        }
    }
}
