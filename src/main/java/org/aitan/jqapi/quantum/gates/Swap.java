/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.aitan.jqapi.quantum.gates;

import static org.aitan.jqapi.utils.Constants.SWAP;
import static org.aitan.jqapi.utils.Constants.SWAP_MATRIX;

/**
 *
 * @author Gaetano Ferrara
 */
public class Swap extends Gate{
    public Swap(Integer firstQubit, Integer secondQubit) {
        super(2, SWAP_MATRIX, SWAP, firstQubit, secondQubit);
    }
}
