import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.quantum.Circuit;
import org.aitan.jqapi.quantum.ParametricCircuit;
import org.aitan.jqapi.quantum.ParametricCircuit.ParametricGate;
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.spec.CircuitSpecJson;

/** Standalone consumer for #32/#51; optional binding-only measurement follows #112. */
public class Issue109StandaloneExample {
    private static volatile Circuit sink;

    public static void main(String[] args) {
        var config = JQAPIConfig.sequential(2);
        var template = new ParametricCircuit(2, config, List.of(
                new ParametricGate("RX", new int[]{0}, "rotation"),
                new ParametricGate("U3", new int[]{0}, "rotation", "azimuth", "phase")));
        var values = Map.of("rotation", Math.PI / 4, "azimuth", 0.2, "phase", -0.3);
        Circuit circuit = template.bind(values);
        var simulator = new LocalSimulator(circuit);
        simulator.execute();
        System.out.println("Bound circuit qubits: " + circuit.getInputSize());
        System.out.println("Sequential levels: " + circuit.getLevels().size());
        System.out.println("Amplitude of |00>: " + simulator.getQuantumRegister().getRegisterState().getEntry(0));

        var spec = template.bindToSpec(values);
        var restored = CircuitSpecJson.fromJson(CircuitSpecJson.toJson(spec), config);
        if (!spec.equals(restored)) throw new AssertionError("Concrete spec round-trip failed");
        CircuitSpecs.toCircuit(restored, config);
        System.out.println("Concrete JSON: " + CircuitSpecJson.toJson(spec));
        if (Arrays.asList(args).contains("--benchmark")) measureReuse(template);
    }

    private static void measureReuse(ParametricCircuit template) {
        int warmup = positiveProperty("benchmark.warmup", 2_000);
        int iterations = positiveProperty("benchmark.iterations", 1_000);
        int repetitions = positiveProperty("benchmark.repetitions", 7);
        var bindings = List.of(
                Map.of("rotation", 0.1, "azimuth", 0.2, "phase", 0.3),
                Map.of("rotation", 0.7, "azimuth", -0.4, "phase", 0.9));
        String commit = System.getProperty("benchmark.commit", System.getenv("GIT_COMMIT"));
        System.out.println("Commit: " + (commit == null ? "unspecified (set -Dbenchmark.commit)" : commit));
        System.out.println("JVM: " + System.getProperty("java.vm.name") + " " + System.getProperty("java.runtime.version"));
        System.out.println("Heap max bytes: " + Runtime.getRuntime().maxMemory());
        System.out.println("Machine: " + System.getProperty("benchmark.machine", "unspecified")
                + "; OS: " + System.getProperty("os.name") + " " + System.getProperty("os.version")
                + "; arch: " + System.getProperty("os.arch")
                + "; processors: " + Runtime.getRuntime().availableProcessors());
        System.out.printf(Locale.ROOT, "Warmup: %d; operations/repetition: %d; repetitions: %d%n",
                warmup, iterations, repetitions);
        System.out.println("Scope: reuse one two-qubit/two-level template; alternate two prebuilt bindings;");
        System.out.println("include concrete circuit allocation and volatile sink; exclude simulation and map creation.");
        for (int i = 0; i < warmup; i++) sink = template.bind(bindings.get(i % bindings.size()));
        double[] samples = new double[repetitions];
        System.out.println("repetition,ns/bind");
        for (int repetition = 0; repetition < repetitions; repetition++) {
            long start = System.nanoTime();
            for (int i = 0; i < iterations; i++) sink = template.bind(bindings.get(i % bindings.size()));
            samples[repetition] = (System.nanoTime() - start) / (double) iterations;
            System.out.printf(Locale.ROOT, "%d,%.1f%n", repetition + 1, samples[repetition]);
        }
        Arrays.sort(samples);
        double median = (samples[(repetitions - 1) / 2] + samples[repetitions / 2]) / 2;
        System.out.printf(Locale.ROOT, "ns/bind min=%.1f median=%.1f max=%.1f%n",
                samples[0], median, samples[repetitions - 1]);
        System.out.println("Exploratory local timing only; no speedup claim or CI performance threshold.");
    }

    private static int positiveProperty(String name, int fallback) {
        int value = Integer.parseInt(System.getProperty(name, Integer.toString(fallback)));
        if (value <= 0) throw new IllegalArgumentException(name + " must be positive");
        return value;
    }
}
