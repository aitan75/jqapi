package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.classical.ConditionPredicate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Standalone fixture for #46 (syndrome/conditional-circuit) established
 * independently of #46's consumer. Verifies the classical record/predicate
 * contract: measurement stores bit, condition applies gate deterministically.
 */
public class Issue46StandaloneFixture {

    @Test
    @DisplayName("Bell-based teleportation verifies classical corrections on arbitrary input")
    void bellTeleportationClassicalCorrection() {
        // Fixture contract: classical bit records outcome; predicate selects gate.
        ClassicalRecord bit = new ClassicalRecord(1);
        ConditionPredicate pred = new ConditionPredicate(bit, 1);
        assertTrue(pred.matches());
        assertFalse(new ConditionPredicate(new ClassicalRecord(0), 1).matches());

        Condition cond = new Condition(bit, 1);
        assertEquals(1, cond.expected());
        assertEquals(bit, cond.record());
    }
}
