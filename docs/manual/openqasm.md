# Import and export OpenQASM circuits

Use OpenQASM 2 to run circuits exported by other tools, or to share a jqapi circuit.
The supported gates, classical control subset, limits, and ordering conventions
are listed in the [OpenQASM API reference](../api/openqasm.md).

```java
import org.aitan.jqapi.quantum.simulator.LocalSimulator;
import org.aitan.jqapi.visualization.CircuitSpecs;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser;
import org.aitan.jqapi.visualization.openqasm.OpenQasmSerializer;

String source = """
        OPENQASM 2.0;
        include "qelib1.inc";
        qreg q[3];
        creg flag[1];
        h q[0];
        cx q[0],q[2];
        measure q[0] -> flag[0];
        if(flag==1) x q[2];
        reset q[0];
        """;
var spec = OpenQasmParser.parse(source);
var simulator = new LocalSimulator(CircuitSpecs.toCircuit(spec));
simulator.execute();
System.out.println(simulator.extractClassicalRecords());
String exported = OpenQasmSerializer.serialize(spec);
```

Keep `spec` for export so that angles and classical metadata remain available.
Imported operations execute in source order. Register indices are preserved:
jqapi's qubit 0 is the most significant bit, so reverse basis-index bits when
comparing state vectors with Qiskit. Measurement results are returned in flattened
classical address order, rather than Qiskit's displayed bitstring order.

Phase A supports unitary gates, reset, and explicitly addressed measurement;
phase B adds one-bit-register `if` conditions using the existing classical model.
For example, declare `creg flag[1];` and use `if(flag==1)`. Comparing a multi-bit
register, conditional reset/measurement, custom gate bodies, and unsupported gates
produces an error rather than a changed circuit. Export may rename and split
classical registers to preserve individual bit conditions.

Barriers are validated and discarded for simulation; export does not restore
compiler optimization barriers. OpenQASM 3 is not supported.
