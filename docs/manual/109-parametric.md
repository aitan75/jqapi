# Reusing parameterized circuits

Create a `ParametricCircuit` once, then call `bind` for each set of named angles.
This API can supply repeated circuit evaluations for #32 and #51 without
requiring either consumer algorithm. Bindings do not share simulator state.

```java
var config = JQAPIConfig.sequential(2);
var template = new ParametricCircuit(2, config, List.of(
    new ParametricGate("RX", new int[]{0}, "rotation"),
    new ParametricGate("U3", new int[]{0}, "rotation", "azimuth", "phase")));
var values = Map.of("rotation", 0.4, "azimuth", 0.2, "phase", -0.3);
Circuit circuit = template.bind(values);
CircuitSpec saved = template.bindToSpec(values);
```

These are two sequential levels, even though both gates address qubit zero.
Names can repeat: `rotation` supplies RX's angle and U3's first angle. RX, RY,
RZ and PHASE take one name; U3 takes three in theta, phi, lambda order.
Qubit zero is the most significant bit. The template copies input arrays/lists
and returns copies from its array accessors. Both binding methods reject
missing/extra keys, null/non-finite values and invalid template inputs.

For save/load, serialize `saved` using `CircuitSpecJson.toJson` and read it with
`CircuitSpecJson.fromJson`, then use `CircuitSpecs.toCircuit(spec, config)`.
The spec preserves concrete angles and topology. Symbolic template JSON is
unsupported; the concrete spec does not claim to retain parameter names.
See the [API contract](../api/109-param-circuit.md) for validation details and
why exporting the runtime circuit instead is lossy.

## Run the standalone consumer

From the repository root, with JDK 25:

```bash
mvn -B verify
java -cp target/classes Issue109StandaloneExample.java
```

The example binds arbitrary parameter names, executes the circuit and verifies
the concrete JSON round-trip. It is outside Maven's source roots, so run this
command separately to check compilation and execution.

## Reuse measurement (#112 methodology)

Use the example's optional measurement mode; timing is separate from correctness
tests and never acts as a CI pass/fail threshold:

```bash
java -Xms256m -Xmx256m \
  -Dbenchmark.commit="$(git rev-parse HEAD)" \
  -Dbenchmark.machine="your-machine-model" \
  -Dbenchmark.warmup=2000 \
  -Dbenchmark.iterations=1000 \
  -Dbenchmark.repetitions=7 \
  -cp target/classes Issue109StandaloneExample.java --benchmark
```

Run from a clean checkout so the commit identifies the measured code. Save the
output with the machine model filled in. It records commit, JVM version, maximum
heap, OS/architecture/CPU count, warmup count, operations per repetition, all
samples and min/median/max nanoseconds per binding. The same immutable two-gate
template is reused with alternating prebuilt binding maps. Measured work includes
validation, concrete spec/circuit allocation and a volatile result sink; it
excludes map construction, simulation and serialization. No sampling RNG is used.

This is an exploratory local measurement, not a speedup claim or a capacity
limit. JVM compilation, garbage collection and machine load can affect results;
compare repeated runs on the same named environment and report the spread.
