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
        String toBinary=toBinary(number, length);
 
        return Integer.parseInt(toBinary.substring(index, index + 1));
    }
}
