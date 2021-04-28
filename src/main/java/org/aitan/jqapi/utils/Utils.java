/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.utils;

/**
 *
 * @author Gaetano Ferrara
 */
public class Utils {
    public static String toBinary(int x, int len)
    {
        StringBuilder result = new StringBuilder();
 
        for (int i = len - 1; i >= 0 ; i--)
        {
            int mask = 1 << i;
            result.append((x & mask) != 0 ? 1 : 0);
        }
 
        return result.toString();
    }
    
    public static int bitAtIndex(int index,int x, int len)
    {
        String toBinary=toBinary(x, len);
 
        return Integer.parseInt(toBinary.substring(index, index + 1));
    }
}
