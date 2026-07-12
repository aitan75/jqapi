package org.aitan.jqapi.wasm.test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.aitan.jqapi.wasm.JqapiBridge;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import org.junit.jupiter.api.Test;

/**
 * Cross-checks the TeaVM-compiled JavaScript bridge against the JVM: the same
 * Bell spec must yield the same state-vector amplitudes whether run through
 * {@link JqapiBridge#run(String)} on the JVM or through the compiled JS in
 * Node. Skipped (not failed) when Node or the JS artifact is unavailable, so
 * the build stays runnable without a JS toolchain.
 *
 * @author Gaetano Ferrara
 */
public class BridgeCrossCheckTest {

    private static final String BELL =
            "{\"version\":1,\"numQubits\":2,\"levels\":["
            + "{\"gates\":[{\"kind\":\"H\",\"targets\":[0],\"controls\":[],\"params\":{}}]},"
            + "{\"gates\":[{\"kind\":\"CNOT\",\"targets\":[1],\"controls\":[0],\"params\":{}}]}"
            + "]}";

    private static final Pattern CELL = Pattern.compile("\"re\":(-?[0-9.eE+-]+),\"im\":(-?[0-9.eE+-]+)");

    private static List<double[]> parseAmplitudes(String json) {
        List<double[]> out = new ArrayList<>();
        Matcher m = CELL.matcher(json);
        while (m.find()) {
            out.add(new double[] {Double.parseDouble(m.group(1)), Double.parseDouble(m.group(2))});
        }
        return out;
    }

    @Test
    void compiledJs_matchesJvm_forBellCircuit() throws IOException, InterruptedException {
        Path js = Path.of("target", "js", "jqapi.js").toAbsolutePath();
        assumeTrue(Files.isRegularFile(js), "TeaVM JS artifact missing (build under JDK 21 first)");

        String jvm = JqapiBridge.run(BELL);

        String script = "const j=require(" + jsonString(js.toString()) + ");"
                + "process.stdout.write(j.run(" + jsonString(BELL) + "));";
        String node;
        Process p;
        try {
            p = new ProcessBuilder("node", "-e", script).redirectErrorStream(true).start();
        } catch (IOException e) {
            assumeTrue(false, "node not available: " + e.getMessage());
            return;
        }
        node = new String(p.getInputStream().readAllBytes());
        int exit = p.waitFor();
        assertEquals(0, exit, "node exited non-zero: " + node);

        List<double[]> jvmAmps = parseAmplitudes(jvm);
        List<double[]> jsAmps = parseAmplitudes(node);
        assertEquals(jvmAmps.size(), jsAmps.size(), "amplitude count mismatch; node output: " + node);
        for (int i = 0; i < jvmAmps.size(); i++) {
            assertEquals(jvmAmps.get(i)[0], jsAmps.get(i)[0], 1e-9, "re[" + i + "]");
            assertEquals(jvmAmps.get(i)[1], jsAmps.get(i)[1], 1e-9, "im[" + i + "]");
        }
    }

    /** Minimal JSON string literal for embedding a value in the node script. */
    private static String jsonString(String s) {
        return '"' + s.replace("\\", "\\\\").replace("\"", "\\\"") + '"';
    }
}
