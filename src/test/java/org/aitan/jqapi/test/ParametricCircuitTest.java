package org.aitan.jqapi.test;

import java.util.*;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ParametricCircuitTest {

    @Test
    void bind_producesConcreteCircuitWithBoundValues() {
        List<ParametricGate> gates = List.of(
            new ParametricGate("RX", new int[]{0}, "theta"),
            new ParametricGate("U3", new int[]{1}, "theta", "phi", "lambda")
        );
        ParametricCircuit template = new ParametricCircuit(2, JQAPIConfig.getDefault(), gates);
        Circuit bound = template.bind(Map.of("theta", Math.PI / 2, "phi", 0.1, "lambda", 0.2));
        assertNotNull(bound);
        assertEquals(2, bound.getInputSize());
        assertEquals(2, bound.getLevels().size());
    }

    @Test
    void bind_rejectsMissingParameter() {
        ParametricCircuit template = new ParametricCircuit(1, JQAPIConfig.getDefault(),
            List.of(new ParametricGate("RX", new int[]{0}, "theta")));
        assertThrows(IllegalArgumentException.class, () -> template.bind(Map.of()));
    }

    @Test
    void bind_rejectsNonFiniteParameter() {
        ParametricCircuit template = new ParametricCircuit(1, JQAPIConfig.getDefault(),
            List.of(new ParametricGate("RX", new int[]{0}, "theta")));
        assertThrows(IllegalArgumentException.class, () -> template.bind(Map.of("theta", Double.POSITIVE_INFINITY)));
    }

    @Test
    void repeatedBindingsProduceIndependentCircuits() {
        ParametricCircuit template = new ParametricCircuit(1, JQAPIConfig.getDefault(),
            List.of(new ParametricGate("RX", new int[]{0}, "theta")));
        Circuit a = template.bind(Map.of("theta", 0.5));
        Circuit b = template.bind(Map.of("theta", 1.5));
        assertNotSame(a, b);
    }

    @Test
    void externalArrayModificationDoesNotAffectTemplate() {
        int[] idx = new int[]{0};
        ParametricGate g = new ParametricGate("RX", idx, "theta");
        idx[0] = 99;
        assertEquals(0, g.indexes()[0]);
    }

    @Test
    void extraKeysRejected() {
        ParametricCircuit template = new ParametricCircuit(1, JQAPIConfig.getDefault(),
            List.of(new ParametricGate("RX", new int[]{0}, "theta")));
        assertThrows(IllegalArgumentException.class, () -> template.bind(Map.of("theta", 0.5, "extra", 1.0)));
    }
}
