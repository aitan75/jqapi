package org.aitan.jqapi.quantum.classical;

/** Equality predicate on an addressed classical bit, evaluated when its gate executes. */
public record Condition(int bitIndex, int expected) {
    public Condition {
        if (bitIndex < 0 || bitIndex >= 30) throw new IllegalArgumentException("Classical bit index must be in [0, 30)");
        if (expected != 0 && expected != 1) throw new IllegalArgumentException("Expected bit must be 0 or 1");
    }
}
