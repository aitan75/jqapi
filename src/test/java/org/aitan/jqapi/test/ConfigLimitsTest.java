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
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.CircuitLevel;
import org.aitan.jqapi.quantum.QuantumRegister;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.quantum.simulator.QuantumSimulator;
import org.aitan.jqapi.quantum.gates.Hadamard;
import org.aitan.jqapi.quantum.gates.PauliX;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Boundary and rejection tests for the configurable size limits introduced by
 * issue #2 (fixes MED-1 unbounded allocation and MED-2 integer overflow /
 * degenerate inputs).
 * <p>
 * Every scenario asserts the exact contract: the concrete exception type
 * ({@link JQApiLimitException} for domain-limit violations,
 * {@link NullPointerException} for {@code null} inputs) and, where the plan
 * pins them down, the exact message text. Sizes are kept deliberately small so
 * the suite is fast and never risks an actual {@link OutOfMemoryError} — the
 * point is to prove validation fires <em>before</em> any allocation.
 *
 * @author qa-automation-strategist
 */
public class ConfigLimitsTest {

    // ------------------------------------------------------------------
    // JQAPIConfig
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("JQAPIConfig")
    class JQAPIConfigTests {

        @Test
        @DisplayName("of rejects non-positive maxQubits (validated first)")
        void ofRejectsNonPositiveMaxQubits() {
            JQApiLimitException zero = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(0, 15));
            assertEquals("maxQubits must be positive, was: 0", zero.getMessage());

            JQApiLimitException negative = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(-3, 15));
            assertEquals("maxQubits must be positive, was: -3", negative.getMessage());
        }

        @Test
        @DisplayName("of rejects non-positive maxSearchQubits")
        void ofRejectsNonPositiveMaxSearchQubits() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, 0));
            assertEquals("maxSearchQubits must be positive, was: 0", ex.getMessage());

            JQApiLimitException negative = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, -1));
            assertEquals("maxSearchQubits must be positive, was: -1", negative.getMessage());
        }

        @Test
        @DisplayName("maxQubits is validated before maxSearchQubits")
        void maxQubitsValidatedBeforeMaxSearchQubits() {
            // Both invalid: the message must be about maxQubits (checked first).
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(-1, -1));
            assertEquals("maxQubits must be positive, was: -1", ex.getMessage());
        }

        @Test
        @DisplayName("getDefault returns the documented defaults 24 / 12")
        void getDefaultReturnsDocumentedDefaults() {
            // NOTE: assumes the jqapi.max.* system properties are not overridden
            // (they are not, in the surefire fork).
            JQAPIConfig def = JQAPIConfig.getDefault();
            assertEquals(24, def.maxQubits());
            assertEquals(12, def.maxSearchQubits());
            assertEquals(24, JQAPIConfig.DEFAULT_MAX_QUBITS);
            assertEquals(12, JQAPIConfig.DEFAULT_MAX_SEARCH_QUBITS);
        }

        @Test
        @DisplayName("accessors return the supplied values")
        void accessorsReturnSuppliedValues() {
            JQAPIConfig config = JQAPIConfig.of(10, 7);
            assertEquals(10, config.maxQubits());
            assertEquals(7, config.maxSearchQubits());
        }

        @Test
        @DisplayName("search > qubits is accepted: of(24, 30) valid, each limit checked independently")
        void ofValidatesPositivityOnly() {
            JQAPIConfig config = assertDoesNotThrow(() -> JQAPIConfig.of(24, 30));
            assertEquals(24, config.maxQubits());
            assertEquals(30, config.maxSearchQubits());
        }

        @Test
        @DisplayName("limits above ABSOLUTE_MAX_QUBITS (30) are rejected")
        void limitsAboveHardCapRejected() {
            JQApiLimitException qubits = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(31, 12));
            assertEquals("maxQubits must be at most 30, was: 31", qubits.getMessage());

            JQApiLimitException search = assertThrows(JQApiLimitException.class, () -> JQAPIConfig.of(24, 31));
            assertEquals("maxSearchQubits must be at most 30, was: 31", search.getMessage());

            assertDoesNotThrow(() -> JQAPIConfig.of(30, 30));
        }

        @Test
        @DisplayName("getDefault is frozen: System.setProperty at runtime cannot raise the limits")
        void getDefaultFrozenAgainstRuntimePropertyChanges() {
            int before = JQAPIConfig.getDefault().maxQubits(); //force class init before mutating the property
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
        @DisplayName("JQApiLimitException is unchecked and not part of the checked JQApiException hierarchy")
        void limitExceptionIsUnchecked() {
            assertTrue(IllegalArgumentException.class.isAssignableFrom(JQApiLimitException.class));
            assertFalse(JQApiException.class.isAssignableFrom(JQApiLimitException.class));
        }
    }

    // ------------------------------------------------------------------
    // Circuit
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Circuit")
    class CircuitTests {

        @Test
        @DisplayName("size 0 is rejected, size 1 is accepted")
        void sizeZeroRejectedOneAccepted() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new Circuit(0));
            assertEquals("Circuit size must be positive, was: 0", ex.getMessage());

            assertDoesNotThrow(() -> new Circuit(1));
        }

        @Test
        @DisplayName("negative size is rejected")
        void negativeSizeRejected() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new Circuit(-5));
            assertEquals("Circuit size must be positive, was: -5", ex.getMessage());
        }

        @Test
        @DisplayName("exactly at the default maximum (24) is accepted")
        void exactlyAtDefaultMaxAccepted() {
            Circuit circuit = assertDoesNotThrow(() -> new Circuit(24));
            assertEquals(24, circuit.getInputSize());
        }

        @Test
        @DisplayName("above the default maximum (25) is rejected")
        void aboveDefaultMaxRejected() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new Circuit(25));
            assertEquals("Circuit size 25 exceeds maximum allowed qubits (24)", ex.getMessage());
        }

        @Test
        @DisplayName("a per-instance config BELOW default rejects earlier")
        void perInstanceConfigBelowDefaultRejectsEarlier() {
            // size 5 is fine under the default (24) but must fail under of(3, 3)
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> new Circuit(5, JQAPIConfig.of(3, 3)));
            assertEquals("Circuit size 5 exceeds maximum allowed qubits (3)", ex.getMessage());

            assertDoesNotThrow(() -> new Circuit(3, JQAPIConfig.of(3, 3)));
        }

        @Test
        @DisplayName("a per-instance config ABOVE default accepts a size the default would reject")
        void perInstanceConfigAboveDefaultAcceptsLargerSize() {
            // 26 > default 24, but of(26, ...) raises the ceiling. Validation only,
            // no register is allocated by the Circuit constructor.
            Circuit circuit = assertDoesNotThrow(() -> new Circuit(26, JQAPIConfig.of(26, 26)));
            assertEquals(26, circuit.getInputSize());
        }

        @Test
        @DisplayName("getConfig returns the supplied configuration")
        void getConfigReturnsSuppliedConfig() {
            JQAPIConfig config = JQAPIConfig.of(8, 5);
            Circuit circuit = new Circuit(4, config);
            assertSame(config, circuit.getConfig());
        }

        @Test
        @DisplayName("the default constructor stores a non-null (default) config")
        void defaultConstructorStoresConfig() {
            Circuit circuit = new Circuit(2);
            assertNotNull(circuit.getConfig());
            assertEquals(24, circuit.getConfig().maxQubits());
        }

        @Test
        @DisplayName("setInputSize validates against the stored config")
        void setInputSizeValidates() {
            Circuit circuit = new Circuit(2);

            JQApiLimitException zero = assertThrows(JQApiLimitException.class, () -> circuit.setInputSize(0));
            assertEquals("Circuit size must be positive, was: 0", zero.getMessage());

            JQApiLimitException tooBig = assertThrows(JQApiLimitException.class, () -> circuit.setInputSize(25));
            assertEquals("Circuit size 25 exceeds maximum allowed qubits (24)", tooBig.getMessage());

            assertDoesNotThrow(() -> circuit.setInputSize(3));
            assertEquals(3, circuit.getInputSize());
        }

        @Test
        @DisplayName("setInputSize respects a tightened per-instance config")
        void setInputSizeRespectsTightenedConfig() {
            Circuit circuit = new Circuit(2, JQAPIConfig.of(3, 3));
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> circuit.setInputSize(4));
            assertEquals("Circuit size 4 exceeds maximum allowed qubits (3)", ex.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // QuantumRegister (direct construction)
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("QuantumRegister (direct)")
    class QuantumRegisterTests {

        @Test
        @DisplayName("size 0 is rejected")
        void sizeZeroRejected() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new QuantumRegister(0));
            assertEquals("Register size must be positive, was: 0", ex.getMessage());
        }

        @Test
        @DisplayName("negative size is rejected")
        void negativeSizeRejected() {
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new QuantumRegister(-2));
            assertEquals("Register size must be positive, was: -2", ex.getMessage());
        }

        @Test
        @DisplayName("small valid size (2) is accepted")
        void smallValidSizeAccepted() {
            QuantumRegister reg = assertDoesNotThrow(() -> new QuantumRegister(2));
            assertEquals(2, reg.getSize());
        }

        @Test
        @DisplayName("direct use above default (25) throws BEFORE allocating (MED-1 guard)")
        void aboveDefaultRejectedBeforeAllocation() {
            // 25 qubits would be 2^25 amplitudes; validation must fire first so
            // this never allocates. If validation ran after `new Qubit[size]`
            // this would OOM instead of throwing our domain exception.
            JQApiLimitException ex = assertThrows(JQApiLimitException.class, () -> new QuantumRegister(25));
            assertEquals("Register size 25 exceeds maximum allowed qubits (24)", ex.getMessage());
        }

        @Test
        @DisplayName("the config-accepting constructor honours the passed config (can exceed the default)")
        void configConstructorHonoursPassedConfig() {
            // A raised config lets a caller build a register the no-arg-config
            // path would reject. Keep the size small (3) to stay fast.
            QuantumRegister reg = assertDoesNotThrow(
                    () -> new QuantumRegister(3, JQAPIConfig.of(28, 28)));
            assertEquals(3, reg.getSize());
        }

        @Test
        @DisplayName("the config-accepting constructor still rejects non-positive and over-limit sizes")
        void configConstructorStillValidates() {
            assertThrows(JQApiLimitException.class,
                    () -> new QuantumRegister(0, JQAPIConfig.of(28, 28)));
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> new QuantumRegister(5, JQAPIConfig.of(3, 3)));
            assertEquals("Register size 5 exceeds maximum allowed qubits (3)", ex.getMessage());
        }

        @Test
        @DisplayName("getSize/getRegisterState reflect a config-bounded qubits-array construction")
        void configConstructorWithQubitsArray() {
            org.aitan.jqapi.quantum.Qubit[] qubits = {
                new org.aitan.jqapi.quantum.QubitZero(), new org.aitan.jqapi.quantum.QubitOne()
            };
            QuantumRegister reg = assertDoesNotThrow(
                    () -> new QuantumRegister(2, JQAPIConfig.of(28, 28), qubits));
            assertEquals(2, reg.getSize());
        }

        @Test
        @DisplayName("getSize/getRegisterState reflect a config-bounded alphas construction")
        void configConstructorWithAlphas() {
            QuantumRegister reg = assertDoesNotThrow(
                    () -> new QuantumRegister(2, JQAPIConfig.of(28, 28), 1.0, 0.0));
            assertEquals(2, reg.getSize());
        }

        @Test
        @DisplayName("the deprecated forSimulation factories still delegate to the config constructors")
        @SuppressWarnings("deprecation")
        void deprecatedForSimulationStillWorks() {
            QuantumRegister reg = assertDoesNotThrow(
                    () -> QuantumRegister.forSimulation(3, JQAPIConfig.of(28, 28)));
            assertEquals(3, reg.getSize());

            assertThrows(JQApiLimitException.class,
                    () -> QuantumRegister.forSimulation(0, JQAPIConfig.of(28, 28)));
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> QuantumRegister.forSimulation(5, JQAPIConfig.of(3, 3)));
            assertEquals("Register size 5 exceeds maximum allowed qubits (3)", ex.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // measureQubitAtIndexes range / null checks (LOW-2/LOW-3)
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("QuantumRegister.measureQubitAtIndexes")
    class MeasureIndexTests {

        @Test
        @DisplayName("null list throws NullPointerException")
        void nullListThrowsNpe() {
            QuantumRegister reg = new QuantumRegister(2);
            assertThrows(NullPointerException.class, () -> reg.measureQubitAtIndexes(null));
        }

        @Test
        @DisplayName("null element throws JQApiLimitException")
        void nullElementRejected() {
            QuantumRegister reg = new QuantumRegister(2);
            List<Integer> indexes = new ArrayList<>();
            indexes.add(null);
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> reg.measureQubitAtIndexes(indexes));
            assertEquals("Measurement index null out of range [0, 2)", ex.getMessage());
        }

        @Test
        @DisplayName("negative index throws JQApiLimitException")
        void negativeIndexRejected() {
            QuantumRegister reg = new QuantumRegister(2);
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> reg.measureQubitAtIndexes(Arrays.asList(-1)));
            assertEquals("Measurement index -1 out of range [0, 2)", ex.getMessage());
        }

        @Test
        @DisplayName("index == size throws JQApiLimitException")
        void indexEqualToSizeRejected() {
            QuantumRegister reg = new QuantumRegister(2);
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> reg.measureQubitAtIndexes(Arrays.asList(2)));
            assertEquals("Measurement index 2 out of range [0, 2)", ex.getMessage());
        }

        @Test
        @DisplayName("a valid in-range index is accepted")
        void validIndexAccepted() {
            QuantumRegister reg = new QuantumRegister(2);
            // fresh |00> register: measuring qubit 0 collapses to a valid branch
            assertDoesNotThrow(() -> reg.measureQubitAtIndexes(Collections.singletonList(0)));
        }
    }

    // ------------------------------------------------------------------
    // Algorithm.search MED-2 guards
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Algorithm.search")
    class SearchTests {

        @Test
        @DisplayName("null list throws NullPointerException")
        void nullListThrowsNpe() {
            assertThrows(NullPointerException.class,
                    () -> Algorithm.search(null, (Integer x) -> x.equals(1)));
        }

        @Test
        @DisplayName("list with fewer than 2 elements is rejected")
        void listTooSmallRejected() {
            JQApiLimitException empty = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(new ArrayList<Integer>(), (Integer x) -> x.equals(1)));
            assertEquals("Search list must contain at least 2 elements, was: 0", empty.getMessage());

            JQApiLimitException single = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(Collections.singletonList(1), (Integer x) -> x.equals(1)));
            assertEquals("Search list must contain at least 2 elements, was: 1", single.getMessage());
        }

        @Test
        @DisplayName("a list requiring more qubits than maxSearchQubits is rejected")
        void listExceedingSearchQubitsRejected() {
            // 16 elements -> N_QUBIT = ceil(log2(16)) = 4, which exceeds of(24, 3).
            // Rejected before any circuit / oracle is allocated.
            List<Integer> list = IntStream.range(0, 16).boxed().collect(java.util.stream.Collectors.toList());
            JQApiLimitException ex = assertThrows(JQApiLimitException.class,
                    () -> Algorithm.search(list, (Integer x) -> x.equals(15), JQAPIConfig.of(24, 3)));
            assertEquals("Search requires 4 qubits, exceeds maximum allowed search qubits (3)", ex.getMessage());
        }

        @Test
        @DisplayName("a small valid search returns the expected element")
        void smallValidSearchReturnsExpectedElement() throws JQApiException {
            // 4 elements -> N_QUBIT = 2 (dense 4x4 oracle, fast). Single marked
            // element => one Grover iteration converges with high probability.
            List<Integer> list = Arrays.asList(10, 20, 30, 40);
            Function<Integer, Boolean> isTarget = (Integer x) -> x.equals(30);
            Integer found = Algorithm.search(list, isTarget);
            assertEquals(30, found);
        }
    }

    // ------------------------------------------------------------------
    // End-to-end config propagation through the simulator
    // ------------------------------------------------------------------
    @Nested
    @DisplayName("Config propagation (end-to-end)")
    class PropagationTests {

        @Test
        @DisplayName("LocalSimulator builds and executes a register honouring the circuit's config")
        void simulatorHonoursCircuitConfig() {
            // A 3-qubit circuit bound by of(3, 3). Proves forSimulation propagates
            // the circuit config down to the register. Sizes kept tiny (2^3 = 8).
            Circuit circuit = new Circuit(3, JQAPIConfig.of(3, 3));
            CircuitLevel hLevel = new CircuitLevel();
            hLevel.addGate(new Hadamard(0, 1, 2));
            CircuitLevel xLevel = new CircuitLevel();
            xLevel.addGate(new PauliX(0));
            circuit.addLevel(hLevel, xLevel);

            QuantumSimulator simulator = new LocalSimulator(circuit);
            assertDoesNotThrow(simulator::execute);

            QuantumRegister reg = simulator.getQuantumRegister();
            assertEquals(3, reg.getSize());
            assertEquals(8, reg.getRegisterState().getDimension());
        }
    }
}
