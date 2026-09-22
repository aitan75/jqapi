package org.aitan.jqapi.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.aitan.jqapi.Algorithm;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.exceptions.JQApiException;
import org.aitan.jqapi.exceptions.JQApiLimitException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Additional coverage tests for {@link Algorithm#search(List, Function)} and
 * {@link Algorithm#search(List, Function, JQAPIConfig)}.
 * These tests specifically target coverage gaps in the original test suite.
 */
public class AlgorithmCoverageTests {

    // ------------------------------------------------------------------
    // Algorithm.search() edge cases
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Algorithm.search() edge cases")
    class SearchEdgeCases {

        @Test
        @DisplayName("search() throws JQApiException when no element matches")
        void searchNoMatchThrows() {
            List<String> list = Arrays.asList("apple", "banana", "cherry");
            Function<String, Boolean> predicate = s -> false; // no matches

            JQApiException ex = assertThrows(JQApiException.class,
                    () -> Algorithm.search(list, predicate, JQAPIConfig.getDefault()));

            assertEquals("No element found in the list of 3 elements with applied filter",
                         ex.getMessage());
        }

        @Test
        @DisplayName("search() with single element throws JQApiLimitException")
        void searchSingleElementRejected() {
            List<Integer> list = Collections.singletonList(42);
            Function<Integer, Boolean> predicate = x -> x.equals(42);

            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(list, predicate, JQAPIConfig.getDefault()));

            assertEquals("Search list must contain at least 2 elements, was: 1",
                         ex.getMessage());
        }

        @Test
        @DisplayName("search() with empty list throws JQApiLimitException")
        void emptyListRejected() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(new ArrayList<>(), (Integer x) -> x.equals(1)));
            assertEquals("Search list must contain at least 2 elements, was: 0",
                         ex.getMessage());
        }

        @Test
        @DisplayName("search() with 16 elements exceeds maxSearchQubits=3")
        void searchExceedsMaxSearchQubits() throws JQApiException {
            // 16 elements requires ceil(log2(16)) = 4 qubits
            List<Integer> list = IntStream.range(0, 16).boxed().toList();
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(list, x -> x.equals(15), JQAPIConfig.of(24, 3)));
            assertEquals("Search requires 4 qubits, exceeds maximum allowed search qubits (3)",
                         ex.getMessage());
        }

        @Test
        @DisplayName("search() with exactly 2 elements works")
        void searchSmallValidList() throws JQApiException {
            List<Integer> list = Arrays.asList(10, 30);
            Function<Integer, Boolean> predicate = x -> x.equals(30);
            Integer result = Algorithm.search(list, predicate, JQAPIConfig.getDefault());
            assertEquals(30, result);
        }

        @Test
        @DisplayName("search() respects custom config with small maxSearchQubits")
        void searchRespectsCustomMaxSearchQubits() throws JQApiException {
            JQAPIConfig config = JQAPIConfig.of(24, 3); // maxSearchQubits = 3

            // 16 elements require 4 qubits (2^4 = 16)
            List<Integer> list = IntStream.range(0, 16).boxed().toList();
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(list, x -> x.equals(15), config));
            assertEquals("Search requires 4 qubits, exceeds maximum allowed search qubits (3)",
                         ex.getMessage());
        }

        @Test
        @DisplayName("search() with multiple matching negative-number-list values")
        void searchWithNegativeNumbers() throws JQApiException {
            List<Integer> list = Arrays.asList(-10, -5, 0, 5, 10);
            Function<Integer, Boolean> predicate = x -> x > 0;

            Integer result = Algorithm.search(list, predicate, JQAPIConfig.getDefault());
            assertTrue(result > 0, "Result should be positive: " + result);
        }

        @Test
        @DisplayName("search() with custom config works when within limits")
        void searchWithinCustomLimits() throws JQApiException {
            JQAPIConfig config = JQAPIConfig.of(24, 10); // maxSearchQubits = 10
            List<Integer> list = IntStream.range(0, 1 << 10).boxed().toList(); // 1024 elements
            Integer result = Algorithm.search(list, x -> x.equals(512), config);
            assertEquals(512, result);
        }
    }

    // ------------------------------------------------------------------
    // JQAPIConfig additional tests
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("JQAPIConfig additional tests")
    class JQAPIConfigTests {

        @Test
        @DisplayName("of() method validates maxQubits and maxSearchQubits independently")
        void ofValidatesBothLimitsIndependently() {
            // maxQubits invalid first
            JQApiLimitException ex1 = assertThrows(JQApiLimitException.class,
                    () -> JQAPIConfig.of(-5, 10));
            assertEquals("maxQubits must be positive, was: -5", ex1.getMessage());

            // maxSearchQubits invalid first
            JQApiLimitException ex2 = assertThrows(JQApiLimitException.class,
                    () -> JQAPIConfig.of(24, -5));
            assertEquals("maxSearchQubits must be positive, was: -5", ex2.getMessage());
        }

        @Test
        @DisplayName("getDefault returns the documented defaults")
        void getDefaultReturnsDefaults() {
            JQAPIConfig def = JQAPIConfig.getDefault();
            assertEquals(24, def.maxQubits());
            assertEquals(12, def.maxSearchQubits());
            assertEquals(24, JQAPIConfig.DEFAULT_MAX_QUBITS);
            assertEquals(12, JQAPIConfig.DEFAULT_MAX_SEARCH_QUBITS);
        }

        @Test
        @DisplayName("getDefault is frozen against System.setProperty changes")
        void getDefaultFrozenAgainstRuntimeChanges() {
            int before = JQAPIConfig.getDefault().maxQubits(); // force class init before mutating the property
            String old = System.setProperty("jqapi.max.qubits", "30");
            try {
                assertEquals(before, JQAPIConfig.getDefault().maxQubits());
            } finally {
                if (old == null) {
                    System.clearProperty("jqapi.max.qubits");
                } else {
                    System.setProperty("jqapi.max.qubits", old);
                }
            }
        }

        @Test
        @DisplayName("sequential() returns a sequential-only configuration")
        void sequentialReturnsSequentialConfig() {
            JQAPIConfig seq = JQAPIConfig.sequential(10);
            assertEquals(10, seq.maxQubits());
            assertEquals(JQAPIConfig.DEFAULT_MAX_SEARCH_QUBITS, seq.maxSearchQubits());
            assertFalse(seq.parallelEnabled());
            assertEquals(JQAPIConfig.DEFAULT_PARALLEL_THRESHOLD, seq.parallelThreshold());
            assertTrue(seq.operatorExecutor() instanceof org.aitan.jqapi.quantum.SequentialOperatorExecutor);
        }

        @Test
        @DisplayName("withParallel() returns a copy with given parallelism policy")
        void withParallelReturnsCopy() {
            JQAPIConfig original = JQAPIConfig.getDefault();
            JQAPIConfig withParallel = original.withParallel(false, 1 << 10);
            assertEquals(original.maxQubits(), withParallel.maxQubits());
            assertEquals(original.maxSearchQubits(), withParallel.maxSearchQubits());
            assertFalse(withParallel.parallelEnabled());
            assertEquals(1 << 10, withParallel.parallelThreshold());
            assertEquals(original.operatorExecutor(), withParallel.operatorExecutor());
        }

        @Test
        @DisplayName("withExecutor() returns a copy with given executor")
        void withExecutorReturnsCopy() {
            java.util.concurrent.ForkJoinPool customPool = new java.util.concurrent.ForkJoinPool();
            JQAPIConfig original = JQAPIConfig.getDefault();
            JQAPIConfig withExecutor = original.withExecutor(customPool);
            assertEquals(original.maxQubits(), withExecutor.maxQubits());
            assertEquals(original.maxSearchQubits(), withExecutor.maxSearchQubits());
            assertTrue(withExecutor.parallelEnabled());
            assertEquals(original.parallelThreshold(), withExecutor.parallelThreshold());
            assertTrue(withExecutor.operatorExecutor() instanceof org.aitan.jqapi.quantum.ParallelOperatorExecutor);
            assertEquals(customPool, withExecutor.parallelExecutor());
        }
    }
}
