package org.aitan.jqapi.test;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.junit.jupiter.api.Test;
public class VerifyEmpty {
    @Test
    void empty() {
        Circuit c = new Circuit(1);
        LocalSimulator sim = new LocalSimulator(c);
        sim.execute();
        System.out.println("RECORDS=" + sim.extractClassicalRecords().size());
        System.out.println("RESULT=" + java.util.Arrays.toString(sim.getQuantumRegister().getResult()));
    }
}
