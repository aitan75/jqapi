# #109 Parameterized circuit templates and binding

## ParametricCircuit

Immutable wrapper around a parametric gate topology. `bind(Map<String, Double>)` produces a concrete `Circuit`; `bindToSpec(...)` produces a lossless concrete `CircuitSpec` with named parameters preserved.

## Parameter ordering

- `RX`, `RY`, `RZ`, `PHASE`: `theta`.
- `U3`: `theta`, `phi`, `lambda` (declaration order).

## Validation

Binding rejects missing/extra keys, wrong arity, non-finite values, and external mutation.

## Serialization

`bindToSpec()` emits concrete `GateSpec` with parameter maps; no silent GENERIC flattening.
