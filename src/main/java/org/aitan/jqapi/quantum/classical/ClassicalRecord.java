package org.aitan.jqapi.quantum.classical;

public class ClassicalRecord {
    private final int bit;
    public ClassicalRecord(int bit) {
        if (bit != 0 && bit != 1) {
            throw new IllegalArgumentException("ClassicalRecord bit must be 0 or 1, got: " + bit);
        }
        this.bit = bit;
    }
    public int bit() { return bit; }
}
