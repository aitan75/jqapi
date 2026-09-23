package org.aitan.jqapi.quantum.classical;

public class ConditionPredicate {
    private final ClassicalRecord record;
    private final int expected;
    public ConditionPredicate(ClassicalRecord record, int expected) {
        this.record = record; this.expected = expected;
    }
    public boolean matches() { return record.bit() == expected; }
}
