package org.aitan.jqapi.quantum.gates;

import org.aitan.jqapi.math.ComplexMatrix;
import static org.aitan.jqapi.utils.Constants.MEASUREMENT;

/** Computational-basis measurement, optionally storing one outcome in a classical bit. */
public class Measurement extends Gate {
    private final Integer classicalTarget;

    public Measurement(Integer... indexes) {
        this(null, indexes);
    }

    private Measurement(Integer classicalTarget, Integer[] indexes) {
        super(1, ComplexMatrix.createIdentityMatrix(2), MEASUREMENT, indexes);
        this.classicalTarget = classicalTarget;
    }

    /** Measures one qubit and overwrites the addressed classical bit. */
    public static Measurement into(int qubit, int classicalBit) {
        if (qubit < 0 || qubit >= 30 || classicalBit < 0 || classicalBit >= 30) {
            throw new IllegalArgumentException("Measurement indexes must be in [0, 30)");
        }
        return new Measurement(classicalBit, new Integer[]{qubit});
    }

    /** Null for a legacy measurement without a classical destination. */
    public Integer classicalTarget() { return classicalTarget; }
}
