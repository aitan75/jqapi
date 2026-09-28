# Parameterized circuit templates and binding (#109)

`org.aitan.jqapi.quantum.ParametricCircuit` is an immutable sequence of
parameterized gate placements. It owns no simulator, register or random state.
Every binding creates independent runtime levels, gates and matrices.

## Public API

- `ParametricCircuit(int inputSize, JQAPIConfig config, List<ParametricGate> gates)`
  copies the list and validates the configured qubit budget and target bounds.
- `ParametricGate(String kind, int[] indexes, String... params)` copies its arrays
  and validates the kind, parameter arity, nonblank names and distinct,
  nonnegative, nonempty targets. `kind()`, `indexes()` and `params()` expose the
  declaration; array accessors return copies.
- `bind(Map<String, Double>)` creates a fresh executable `Circuit` using the
  template's configuration.
- `bindToSpec(Map<String, Double>)` creates a lossless **concrete** `CircuitSpec`
  without constructing a runtime circuit or allocating a state vector.

Each placement occupies one sequential level in declaration order. Several
placements may address the same qubit. Several targets within one placement
apply the same single-qubit operator independently to each target; arbitrary
non-adjacent targets and their declared order are preserved. Qubit zero is the
most significant bit. An empty placement list produces an empty circuit/spec.

## Parameter ordering and validation

| Kind | Symbolic-name positions | Concrete `GateSpec.params` keys |
|------|-------------------------|--------------------------------|
| `RX`, `RY`, `RZ`, `PHASE` | one angle | `theta` |
| `U3` | polar angle, azimuth, phase | `theta`, `phi`, `lambda` |

Names are case-sensitive and may be arbitrary nonblank strings. The same name
may occur in several gates or several positions of one U3. For example,
`new ParametricGate("U3", new int[]{0}, "a", "b", "a")` maps a binding of
`a=0.1, b=0.2` to `theta=0.1, phi=0.2, lambda=0.1`.

Both binding methods require exactly the distinct declared keys. Missing or
extra keys, null values, NaN and either infinity throw `IllegalArgumentException`.
Invalid placement contents and out-of-register targets also throw
`IllegalArgumentException`. Null required containers/configuration/kind throw
`NullPointerException`; invalid circuit size or an exceeded qubit budget throws
`JQApiLimitException`. Template structure is validated at construction, before
binding. Later changes to input lists, arrays or binding maps cannot change
previously bound results.

## Serialization contract

Symbolic template serialization is **unsupported**: the JSON API accepts a
concrete `CircuitSpec`, not a `ParametricCircuit`. `bindToSpec` deliberately
resolves symbolic names to canonical angle keys; it does not preserve symbols.
Its result round-trips through `CircuitSpecJson.toJson/fromJson`, preserving
kinds, target order, sequential levels and exact bound doubles. Reconstruct the
runtime with `CircuitSpecs.toCircuit(spec, config)`.

Keep this concrete spec for save/load. `CircuitSpecs.toSpec(template.bind(...))`
is still the existing best-effort runtime mapper: it degrades parametric gates
to generic matrices and cannot recover their angles.

See the [standalone consumer and measurement instructions](../manual/109-parametric.md).
