# #109 Parameterized circuit templates and binding

Scope: immutable `ParametricCircuit` with validated named bindings for
RX/RY/RZ/PHASE/U3. `bind` creates independent concrete circuits; `bindToSpec`
retains gate kinds, canonical angle keys, target order and sequential levels.
Names may repeat within and between gates. Public inputs and resource budgets
are validated before execution; qubit zero remains the most significant bit.

Symbolic serialization is unsupported. Concrete specs round-trip through JSON;
runtime `CircuitSpecs.toSpec` remains best-effort and loses parametric metadata.

See [API](../docs/api/109-param-circuit.md) and
[manual / reproducible reuse measurement](../docs/manual/109-parametric.md).
