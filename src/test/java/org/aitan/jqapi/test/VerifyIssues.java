package org.aitan.jqapi.test;

import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.classical.*;
import org.aitan.jqapi.visualization.*;
import org.aitan.jqapi.visualization.spec.*;
import java.util.*;
import org.junit.jupiter.api.Test;

public class VerifyIssues {
    @Test
    void verifyToSpecLoss() {
        CircuitSpec s = CircuitSpec.of(2, List.of(new LevelSpec(List.of())),
            List.of(new ClassicalRecord(1)),
            List.of(new Condition(new ClassicalRecord(1), 1)));
        System.out.println("ORIG records=" + s.measurementRecords().size() + " conditions=" + s.conditions().size());
        Circuit c = CircuitSpecs.toCircuit(s);
        CircuitSpec s2 = CircuitSpecs.toSpec(c);
        System.out.println("BACK records=" + s2.measurementRecords().size() + " conditions=" + s2.conditions().size());
    }
}
