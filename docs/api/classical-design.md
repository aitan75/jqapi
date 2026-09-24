# Classical execution and CircuitSpec v2

This design replaces the unfinished v2 prototype (global lists of values and
conditions). That prototype had no measurement destinations or gate references;
its JSON is rejected rather than assigned an ambiguous execution meaning.

## Contract

- A circuit declares `numClassicalBits`, from zero to its configuration's
  `maxQubits`. Each simulator owns a fresh, zero-initialized classical register.
- `Measurement.into(qubit, classicalBit)` measures one physical qubit and stores
  the outcome immediately. Legacy `Measurement` still only measures qubits.
- `ConditionalGate(gate, new Condition(classicalBit, expected))` executes a
  unitary gate when the current classical bit equals zero or one. It can wrap
  X, Z, or another unitary gate; it cannot wrap measurement, reset, or another
  conditional gate. Conditions belong to individual gate placements.
- Levels execute in order. Gates within a level must have disjoint qubits;
  writing a classical bit twice, or reading and writing it in the same level,
  is rejected, independently of insertion order. Multiple reads are allowed.
- Writes in later levels overwrite earlier values. Reading an unwritten bit
  returns zero. Quantum reset leaves classical bits unchanged. A new simulator
  or sampling shot starts with new classical state. Repeated `execute()` calls
  on one simulator continue its quantum and classical state.
- All classical references are validated before execution. Qubit zero and the
  first selected classical bit are the most significant bits of their respective
  output indexes. Sampling can aggregate selected classical bits separately from
  the final quantum measurements; those final measurements do not overwrite the
  classical register.

## Serialization and capabilities

Version 1 retains its original quantum-only meaning. Version 2 adds the top-level
`numClassicalBits` (default zero), optional `classicalTarget` on a single-qubit
MEASUREMENT, and optional `condition: {"bitIndex": 0, "expected": 1}` on a unitary
gate. Outcomes are execution results, never circuit input metadata. v1 carrying
classical fields and unknown versions are rejected. Migration from v1 adds a
zero-length classical register without changing gates.

Java and the regenerated TeaVM bridge execute v2. The grid editor cannot represent
classical operations yet and rejects them on import rather than discarding them.
The ASCII renderer likewise rejects classical circuits explicitly. Supporting
classical wires in either UI is outside this first execution implementation.

No loops, general classical computation, new core runtime dependencies, or changes
to the Java 25 / TeaVM 0.15 toolchain are introduced.
