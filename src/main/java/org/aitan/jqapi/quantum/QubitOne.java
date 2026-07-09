package org.aitan.jqapi.quantum;

/**
 *
 * @author Gaetano Ferrara
 */
public class QubitOne extends Qubit{

    public QubitOne() {
        super(0);
    }
    
    @Override
    public double zeroProbability() {
        return 0.0;
    }

    @Override
    public double oneProbability() {
        return 1.0;
    }
    
}
