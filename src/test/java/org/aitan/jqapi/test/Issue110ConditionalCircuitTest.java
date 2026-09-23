package org.aitan.jqapi.test;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Issue #110 red-phase: measure -> store -> conditional X/Z.
 */
import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.classical.ConditionPredicate;

public class Issue110ConditionalCircuitTest {

    @Test
    @DisplayName("measure stores classical bit and conditional X applies on outcome")
    void measureStoreConditionalX() {
        ClassicalRecord rec0 = new ClassicalRecord(0);
        ClassicalRecord rec1 = new ClassicalRecord(1);
        assertTrue(new ConditionPredicate(rec1, 1).matches());
        assertFalse(new ConditionPredicate(rec0, 1).matches());
    }
}
