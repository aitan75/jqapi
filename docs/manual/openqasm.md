# Import and export OpenQASM circuits

For web file import/export, see [Studio](studio.md). The Java API below supports
a broader classical layout than the editable canvas.

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

## Educational circuit hints

`CircuitLinter` reports likely mistakes in a parsed circuit without running it.
Hints never block execution and never change the circuit: no gate is removed and
no qubit is renumbered. Analysis is one pass over the operations (O(gates + qubits)),
allocates no state vector, and returns at most 100 diagnostics.

```java
import java.util.Set;
import org.aitan.jqapi.JQAPIConfig;
import org.aitan.jqapi.visualization.lint.CircuitLinter;
import org.aitan.jqapi.visualization.openqasm.OpenQasmParser;

var program = OpenQasmParser.parseProgram(source, JQAPIConfig.getDefault());
var diagnostics = CircuitLinter.lint(program, Set.of()); // e.g. Set.of("QED002") to disable a rule
System.out.print(CircuitLinter.format(diagnostics));
```

```text
line 4:1 QED001 warning: Two H gates on q[0] cancel out (H·H = I) with no operation on that qubit in between.
  hint: If unintended, remove the H on q[0] at both positions, keeping any other qubit those gates act on. ...
```

Each `Diagnostic` has a stable rule ID, severity, involved level indexes and qubits,
source locations, a message and a suggestion. `CircuitLinter.lint(spec)` works on a
`CircuitSpec` directly; locations are then empty and `levels` identify the operations.

| Rule | Reports | Not reported |
|---|---|---|
| `QED001` (warning) | Two unconditional `h` on the same qubit with nothing touching that qubit in between: `h q[0]; x q[1]; h q[0];` | An intervening `cx`, measurement, reset, `barrier` or conditional `h` on that qubit |
| `QED002` (note) | A measured qubit used by an unconditional quantum operation before `reset`: `measure q[0] -> c[0]; cx q[0],q[1];` | `reset` after measurement; classical feed-forward such as teleportation's `if(m==1) x q[2];` |
| `QED003` (warning) | Declared qubits that no gate, measurement, reset, barrier or explicit `id` references | Measurement-only qubits; runtime identity padding (dropped by `CircuitSpecs.toSpec`); circuits with no operations |

`QED001` is an ideal-circuit identity: with a noise model, removing gates can change
noisy results. `QED002` is a heuristic: re-preparing a measured qubit is valid, so
use `reset` to make it explicit or disable the rule. For `QED003`, six declared
qubits of which three are used store 64 amplitudes instead of 8, an eightfold
storage difference rather than a guaranteed speedup; shrinking the register changes
the output bitstring width.

The Studio shows the same hints in English or Italian, in two places:

- under the circuit, with **Show in circuit** to outline the involved gates;
- in the **QASM source** editor, linted as you type, with **Go to line** buttons
  that select each involved statement. Syntax errors are reported separately and
  replace the hints; while an edit is being checked, older hints are dimmed and
  inactive. **Apply to circuit** loads the source like **Import QASM**, and **Copy
  from circuit** fills the editor with the exported circuit.

Each panel has a checkbox per rule (shared by both panels for the session);
disabled rules are skipped by the engine, so they never use up the 100-diagnostic
limit. **Dismiss** hides one finding until the operations it involves change; moving them to other source lines (e.g. adding a comment above) keeps it hidden.
After a QASM import or **Apply to circuit**, the circuit hints still respect the
source's barriers until the circuit is edited; barriers are not editor operations.
