package org.aitan.jqapi.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 *
 * @author Gaetano Ferrara
 */
public class Utils {

    private Utils() {
    }

    /**
     * Rounds a value to the given number of decimal places using HALF_UP
     * rounding. Replicates {@code org.apache.commons.math3.util.Precision.round}
     * (issue #12), including the negative-zero handling of MATH-1089.
     *
     * @param value the value to round
     * @param scale the number of decimal places
     * @return the rounded value
     */
    public static double round(double value, int scale) {
        double rounded = new BigDecimal(Double.toString(value))
                .setScale(scale, RoundingMode.HALF_UP)
                .doubleValue();
        return rounded == 0d ? 0d * value : rounded;
    }

    public static String toBinary(int number, int length)
    {
        StringBuilder result = new StringBuilder();
 
        for (int i = length - 1; i >= 0 ; i--)
        {
            int mask = 1 << i;
            result.append((number & mask) != 0 ? 1 : 0);
        }
 
        return result.toString();
    }
    
    public static int bitAtIndex(int index,int number, int length)
    {
        if (index < 0 || index >= length) {
            throw new IllegalArgumentException("Bit index " + index + " out of range [0, " + length + ")");
        }
        String toBinary=toBinary(number, length);

        return Integer.parseInt(toBinary.substring(index, index + 1));
    }
}
