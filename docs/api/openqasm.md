# OpenQASM 2 import and export

`org.aitan.jqapi.visualization.openqasm` converts a documented OpenQASM 2 subset
into `CircuitSpec` and exports supported specs as portable text. It has no runtime
dependencies. `CircuitSpecs.toCircuit(spec, config)` connects imported circuits to
the local simulator. Keep the original spec when exporting: runtime gates do not
retain all named parameter metadata.

```java
CircuitSpec spec = OpenQasmParser.parse(source);
Circuit circuit = CircuitSpecs.toCircuit(spec);
String qasm = OpenQasmSerializer.serialize(spec);
```

Both methods also accept `JQAPIConfig` as a second argument. Parsing creates no
state vector and uses independent state for every call, including concurrent calls.

## Supported subset

A complete program must start with `OPENQASM 2.0;` and declare at least one
positive-sized quantum register. Names are case sensitive. Statements are separated
by semicolons, not newlines. Whitespace and `//` comments are accepted.

Only `include "qelib1.inc";` is supported; it enables the following fixed mapping
without reading external files. Native `U`, `CX`, `measure`, and `reset` do not
require the include. Arbitrary include files, custom `gate`/`opaque` definitions,
OpenQASM 3, noise, and unlisted gates are rejected.

| OpenQASM operation | CircuitSpec kind | Controls, then targets | Parameters |
|---|---|---|---|
| `h`, `x`, `y`, `z`, `s`, `t`, `id` | Corresponding fixed kind | One target | None |
| `cx`, native `CX` | `CNOT` | Control, target | None |
| `cy`, `cz` | `CY`, `CZ` | Control, target | None |
| `swap` | `SWAP` | Two targets | None |
| `cswap` | `CSWAP` | Control, two targets | None |
| `ccx` | `TOFFOLI` | Two controls, target | None |
| `rx`, `ry`, `rz` | `RX`, `RY`, `RZ` | One target | `theta` |
| `u1` | `PHASE` | One target | `theta` |
| `u3`, native `U` | `U3` | One target | `theta`, `phi`, `lambda` |
| `u2(phi,lambda)` | `U3` | One target | `theta = pi/2` |
| `sdg`, `tdg` | `PHASE` | One target | `theta = -pi/2`, `-pi/4` |
| `measure q[i] -> c[j]` | `MEASUREMENT` | One target | Explicit classical destination |
| `reset` | `RESET` | One target | None |

Exports use the first name in each row, with `u1` for phase gates and `u3` for U3.
The exceptions are SWAP (three CX gates) and CSWAP (CX, Toffoli, CX): the original
`qelib1.inc` lacks these names, although Qiskit/Cirq exporters commonly use them.
Decomposition preserves behavior, including classical conditions, but changes
gate/level counts on reimport. Exports are checked with Qiskit's strict parser
without custom instructions or legacy compatibility settings.
The newer `p` and `u` aliases are outside this subset; lower them to `u1` and `u3`
before import. Generic matrices, oracles, arbitrary multi-controlled gates, missing
parameters, and measurements without explicit classical destinations fail export
instead of becoming comments, identities, or invented destinations.

Expressions accept finite decimal/scientific numbers, `pi`, parentheses, unary
minus, `+`, `-`, `*`, `/`, right-associative `^`, and `sin`, `cos`, `tan`, `exp`,
`ln`, `sqrt`. Angles are radians. Invalid expressions, non-finite values, invalid
indices, wrong arity, and repeated operands fail with an exception. Syntax errors
include line and column information.

Whole-register gate operands expand element by element. Multiple register operands
must have equal lengths; an indexed qubit can be broadcast alongside a register.
Whole-register measurements require equal-sized quantum and classical registers;
indexed measurements require an indexed destination.

## Classical execution: phases A and B

Phase A covers unitary operations, reset, and measurements with representable
classical destinations. Phase B uses the existing `GateSpec.classicalTarget` and
`Condition` execution model: `if(flag==0)` and `if(flag==1)` are accepted when
`flag` is a declared **one-bit** classical register and the operation is unitary.
This also supports measurements in the middle of a circuit.

OpenQASM 2 compares an entire classical register, whereas `Condition` compares
one addressed bit. Multi-bit register comparisons, indexed conditions such as
`if(c[0]==1)`, and conditional measurement/reset are rejected. Export declares each
classical bit separately (`creg c0[1];`, `creg c1[1];`, …), writes measurements to
`cN[0]`, and emits `if(cN==value)`. Thus even a spec with many classical bits can
preserve all its supported single-bit conditions.

## Ordering, phases, and round trips

Registers are flattened in declaration order. Within each register, index `i`
retains its meaning. jqapi qubit 0 remains the **most significant bit** of a basis
index. For Qiskit state vectors, reverse the `n` index bits before comparing with
jqapi; Qiskit treats qubit 0 as least significant. Cirq with explicit qubit order
`[q0, q1, ...]` already uses the jqapi ordering. For Qiskit classical bitstrings,
remove register separators and reverse bit order to obtain jqapi's classical
address order; exported one-bit registers may change the displayed grouping.

Imported operations occupy successive levels in source order, preserving
measurement/reset/conditional dependencies. Export serializes levels in order
and expands multi-target single-qubit families. Parallel level grouping, source
register names, comments, expression spelling, and aliases are not retained.
CircuitSpec v1/v2 schemas are unchanged; imports produce v2.

`barrier` operands are validated, then the directive is discarded. Import does
not reorder gates. This preserves simulation behavior but loses the barrier's
compiler optimization constraint on later export; it is not a lossless textual
round trip. The [OpenQASM 2 specification](https://arxiv.org/abs/1707.03429) defines
that constraint.

`RX`/`RY`/`RZ` use jqapi's standard rotation matrices; U3 and phase use the existing
library definitions. Some qelib1 implementations express `rz` as a phase gate,
and external toolchains may choose different global phases. Interoperability
state comparisons therefore allow one global phase, while preserving relative
phases and measurement distributions. Arbitrary quantum-controlled versions of
parametric gates are rejected rather than applying a potentially incorrect
controlled global phase.

## Limits

Quantum and classical register totals each respect `config.maxQubits()` (default
24, hard cap 30). Additional fixed limits are 1,000,000 source/output characters,
256 characters per token, 10,000 expanded operations, and 64 expression recursion
levels. Limit violations throw `JQApiLimitException`; malformed or unsupported
constructs throw `IllegalArgumentException`. Null arguments are rejected.

## Reproducible interoperability checks

The Maven suite uses committed fixtures generated by Qiskit 2.5.2 and Cirq 1.7.0,
with independent state vectors already converted to jqapi index order. It checks
all amplitudes up to a global phase, round trips, non-adjacent controls, classical
execution, rejection cases, concurrent parsing, and limits.

```bash
mvn -B verify
python3 -m venv /tmp/jqapi-qasm-check
/tmp/jqapi-qasm-check/bin/pip install -r src/test/python/requirements-openqasm.txt
/tmp/jqapi-qasm-check/bin/python src/test/python/openqasm_interop.py
```

The optional Python check parses Java-generated exports with Qiskit's strict
OpenQASM 2 parser and compares unitary state vectors. Python packages are test
utilities only; neither Maven nor consumers need them. To intentionally regenerate
external fixtures, run that script with `--generate`, review the changes, then
rerun Maven and the external check.
