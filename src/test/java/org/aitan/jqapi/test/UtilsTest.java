package org.aitan.jqapi.test;

import org.aitan.jqapi.utils.Utils;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Boundary tests for {@link Utils#bitAtIndex(int, int, int)} (issue #3, LOW-2:
 * a raw {@code StringIndexOutOfBoundsException} on an out-of-range index must
 * become a clear {@link IllegalArgumentException}).
 */
public class UtilsTest {

    @Test
    public void bitAtIndexNegativeIndexRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> Utils.bitAtIndex(-1, 5, 4));
        assertEquals("Bit index -1 out of range [0, 4)", ex.getMessage());
    }

    @Test
    public void bitAtIndexEqualToLengthRejected() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> Utils.bitAtIndex(4, 5, 4));
        assertEquals("Bit index 4 out of range [0, 4)", ex.getMessage());
    }

    @Test
    public void bitAtIndexInRangeReturnsExpectedBit() {
        // 5 in 4-bit binary is 0101: index 0 is the most significant bit.
        assertEquals(0, Utils.bitAtIndex(0, 5, 4));
        assertEquals(1, Utils.bitAtIndex(1, 5, 4));
        assertEquals(0, Utils.bitAtIndex(2, 5, 4));
        assertEquals(1, Utils.bitAtIndex(3, 5, 4));
    }
}
