package org.aitan.jqapi.quantum.classical;

public class Condition {
    private final ClassicalRecord record;
    private final int expected;
    public Condition(ClassicalRecord record, int expected) {
        this.record = record; this.expected = expected;
    }
    public ClassicalRecord record() { return record; }
    public int expected() { return expected; }
}
