import java.util.*;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;

public class Issue109StandaloneExample {
    public static void main(String[] args) {
        // Template riutilizzabile per algoritmi parametrici (#32 ML, #51 Hamiltonian)
        // Parametri: in ordine dichiarato (theta, phi, lambda per U3; theta per RX/RY/RZ/PHASE)
        List<ParametricGate> gates = List.of(
            new ParametricGate("RX", new int[]{0}, "theta"),
            new ParametricGate("U3", new int[]{1}, "theta", "phi", "lambda")
        );
        ParametricCircuit template = new ParametricCircuit(2, JQAPIConfig.getDefault(), gates);

        // Binding per un circuito concreto
        Circuit circuit = template.bind(Map.of("theta", Math.PI / 4, "phi", 0.0, "lambda", 0.0));
        System.out.println("Bound circuit qubits: " + circuit.getInputSize());
        System.out.println("Levels: " + circuit.getLevels().size());

        // Misurazione riuso (#112): riutilizzo dello stesso template con binding diversi
        long start = System.nanoTime();
        Circuit reuse = template.bind(Map.of("theta", 0.1, "phi", 0.2, "lambda", 0.3));
        long elapsed = System.nanoTime() - start;
        System.out.println("Reuse binding time (ns): " + elapsed);
        System.out.println("Reused circuit qubits: " + reuse.getInputSize());
    }
}
