package org.aitan.jqapi.quantum.classical;

/** Immutable snapshot of one classical bit; register order defines its address. */
public record ClassicalRecord(int bit) {
    public ClassicalRecord {
        if (bit != 0 && bit != 1) throw new IllegalArgumentException("Classical bit must be 0 or 1");
    }
}
