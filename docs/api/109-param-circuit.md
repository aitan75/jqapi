# Parameterized circuit templates and binding (#109)

## Public API

- `ParametricCircuit(int, JQAPIConfig, List<ParametricGate>)`: immutable template.
- `ParametricGate(String kind, int[] indexes, String... params)`: defensively copied.
- `bind(Map<String, Double>)`: validates keys, arity, finiteness; produces concrete `Circuit`.
- `bindToSpec(Map<String, Double>)`: produces concrete `CircuitSpec` preserving named parameters (`GateSpec` with `params` map).

## Ordering

Parameters follow declaration order: `theta` for RX/RY/RZ/PHASE; `theta`, `phi`, `lambda` for U3.

## Serialization

Template serializes to `CircuitSpec` via `bindToSpec`. Symbolic preservation is explicitly supported; concrete `CircuitSpec` never flattens to GENERIC silently.
