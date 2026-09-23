package org.aitan.jqapi.test;

import java.util.List;
import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.visualization.spec.CircuitSpec;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;
import org.aitan.jqapi.visualization.spec.LevelSpec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CircuitSpecRoundTripV2Test {

    @Test
    @DisplayName("v2 spec with measurementRecords and conditions round-trips losslessly")
    void v2RoundTripLossless() {
        CircuitSpec original = CircuitSpec.of(2, List.of(new LevelSpec(List.of())),
            List.of(new ClassicalRecord(1)),
            List.of(new Condition(new ClassicalRecord(1), 1)));
        String json = CircuitSpecJson.toJson(original);
        CircuitSpec parsed = CircuitSpecJson.fromJson(json);
        assertEquals(original.version(), parsed.version());
        assertEquals(original.numQubits(), parsed.numQubits());
        assertEquals(original.measurementRecords().size(), parsed.measurementRecords().size());
        assertEquals(original.conditions().size(), parsed.conditions().size());
    }
}
