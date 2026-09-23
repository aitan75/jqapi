package org.aitan.jqapi.quantum.classical;

public class Condition {
    private final ClassicalRecord record;
    private final int expected;
    public Condition(ClassicalRecord record, int expected) {
        if (expected != 0 && expected != 1) {
            throw new IllegalArgumentException("Condition expected value must be 0 or 1, got: " + expected);
        }
        this.record = record; this.expected = expected;
    }
    public ClassicalRecord record() { return record; }
    public int expected() { return expected; }
}
