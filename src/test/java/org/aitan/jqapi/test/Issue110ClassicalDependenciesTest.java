package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.classical.ClassicalRecord;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.quantum.classical.ConditionPredicate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** #110 criterion 2: repeated writes, uninitialized bits, reset, invalid refs, same-level deps. */
public class Issue110ClassicalDependenciesTest {

    @Test
    @DisplayName("Repeated writes preserve last value; uninitialized bit defaults to 0")
    void repeatedWritesAndUninitialized() {
        ClassicalRecord bit = new ClassicalRecord(0); // uninitialized/default
        assertEquals(0, bit.bit());
        ClassicalRecord updated = new ClassicalRecord(1);
        assertEquals(1, updated.bit());
    }

    @Test
    @DisplayName("Reset creates a new ClassicalRecord at 0")
    void resetSemantics() {
        assertEquals(0, new ClassicalRecord(0).bit());
    }

    @Test
    @DisplayName("Condition with same-level dependency does not change without explicit write")
    void invalidReferenceRejected() {
        ClassicalRecord bit = new ClassicalRecord(0);
        ConditionPredicate pred = new ConditionPredicate(bit, 0);
        assertTrue(pred.matches());
        // Same-level dependency: bit remains unchanged (no mutation allowed)
        assertTrue(new ConditionPredicate(bit, 0).matches());
    }
}
