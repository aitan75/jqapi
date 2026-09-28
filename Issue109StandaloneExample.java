import java.util.*;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;

public class Issue109StandaloneExample {
    public static void main(String[] args) {
        // Reusable template for parametric algorithms (#32 ML, #51 Hamiltonian)
        // Parameters: declaration order (theta, phi, lambda for U3; theta for RX/RY/RZ/PHASE)
        List<ParametricGate> gates = List.of(
            new ParametricGate("RX", new int[]{0}, "theta"),
            new ParametricGate("U3", new int[]{1}, "theta", "phi", "lambda")
        );
        ParametricCircuit template = new ParametricCircuit(2, JQAPIConfig.getDefault(), gates);

        // Concrete binding
        Circuit circuit = template.bind(Map.of("theta", Math.PI / 4, "phi", 0.0, "lambda", 0.0));
        System.out.println("Bound circuit qubits: " + circuit.getInputSize());
        System.out.println("Levels: " + circuit.getLevels().size());

        // Reuse measurement (#112): same template with different bindings
        long start = System.nanoTime();
        Circuit reuse = template.bind(Map.of("theta", 0.1, "phi", 0.2, "lambda", 0.3));
        long elapsed = System.nanoTime() - start;
        System.out.println("Reuse binding time (ns): " + elapsed);
        System.out.println("Reused circuit qubits: " + reuse.getInputSize());
        System.out.println("Commit: " + (System.getenv("GIT_COMMIT") != null ? System.getenv("GIT_COMMIT") : System.getProperty("git.commit"))
            + "; JVM: " + System.getProperty("java.vm.name") + "; Heap max: " + (Runtime.getRuntime().maxMemory() / 1024 / 1024) + " MB; Machine: " + java.net.InetAddress.getLocalHost().getHostName());
    }
}
