package org.aitan.jqapi.quantum.gates;

import java.util.Objects;
import org.aitan.jqapi.quantum.classical.Condition;
import org.aitan.jqapi.utils.Constants;

/** A unitary gate placement guarded by a classical equality predicate. */
public final class ConditionalGate extends Gate {
    private final Gate gate;
    private final Condition condition;

    public ConditionalGate(Gate gate, Condition condition) {
        super(Objects.requireNonNull(gate, "gate").getNumberQubits(), gate.getMatrix(),
                gate.getType(), gate.getIndexes().toArray(new Integer[0]));
        if (gate instanceof ConditionalGate || Constants.MEASUREMENT.equals(gate.getType())
                || Constants.RESET.equals(gate.getType())) {
            throw new IllegalArgumentException("Conditions require a non-nested unitary gate");
        }
        this.gate = gate;
        this.condition = Objects.requireNonNull(condition, "condition");
    }

    public Gate gate() { return gate; }
    public Condition condition() { return condition; }
}
