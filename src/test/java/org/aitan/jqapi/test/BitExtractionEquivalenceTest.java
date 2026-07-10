package org.aitan.jqapi.test;

import org.aitan.jqapi.utils.Utils;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

/**
 * Proves that the shift/mask bit extraction used on the O(2^n) hot paths of
 * QuantumRegister (issue #34) is bit-for-bit equivalent to the previous
 * {@link Utils#bitAtIndex(int, int, int)} (String-based) implementation, for
 * every index/number within range.
 */
public class BitExtractionEquivalenceTest {

    // The replacement used on the hot paths: bit at position `pos` (0 = MSB) of
    // `number` within a `size`-bit field.
    private static int shiftMaskBit(int pos, int number, int size) {
        return (number >> (size - 1 - pos)) & 1;
    }

    @Test
    void shiftMask_matchesUtilsBitAtIndex_acrossAllInRangeInputs() {
        for (int size = 1; size <= 12; size++) {
            int dimension = 1 << size;
            for (int number = 0; number < dimension; number++) {
                for (int pos = 0; pos < size; pos++) {
                    assertEquals(Utils.bitAtIndex(pos, number, size), shiftMaskBit(pos, number, size),
                            "size=" + size + " number=" + number + " pos=" + pos);
                }
            }
        }
    }
}
