# Visualization — `org.aitan.jqapi.visualization`

A serializable, lossless description of a circuit (`CircuitSpec`), a
bidirectional mapper to/from the runtime [`Circuit`](quantum.md#circuit)
(`CircuitSpecs`), and a deterministic ASCII/Unicode renderer
(`AsciiCircuitRenderer`). Entirely in `jqapi-core`, no runtime dependency.

- [Back to API index](README.md)
- Related: [Quantum core](quantum.md) · [Gates](gates.md) · [Simulator](simulator.md)

## Contents

- [Why a DTO](#why-a-dto)
- [The spec model (`.spec`)](#the-spec-model-spec)
- [CircuitSpecs — mapper](#circuitspecs--mapper)
- [AsciiCircuitRenderer](#asciicircuitrenderer)

---

## Why a DTO

The runtime `Circuit`/`Gate` model is **lossy**: parametric gates discard their
angle, `MultiControlled` discards its control count, and nothing is
serializable. So the runtime circuit cannot be the source of truth for a
visualization or a save/load format. `CircuitSpec` is the canonical,
immutable, lossless representation the renderer (and, in later phases, the
editor and save/load) is built on.

---

## The spec model (`.spec`)

All records, immutable, primitive-typed (no dependency on the runtime `Complex`).

| Type | Shape | Purpose |
|------|-------|---------|
| `GateKind` (enum) | `H, X, Y, Z, S, T, CNOT, CZ, CY, SWAP, CSWAP, TOFFOLI, RX, RY, RZ, PHASE, U3, MULTI_CONTROLLED, ORACLE, GENERIC, MEASUREMENT, RESET, IDENTITY` | Unambiguous discriminator — the layer never depends on runtime `getType()` strings. |
| `CircuitSpec` | `(int version, int numQubits, List<LevelSpec> levels)` | The whole circuit. `CircuitSpec.of(numQubits, levels)` stamps `CURRENT_VERSION`. |
| `LevelSpec` | `(List<GateSpec> gates)` | One time-step; idle wires need not be listed. |
| `GateSpec` | `(GateKind kind, List<Integer> targets, List<Integer> controls, Map<String,Double> params, List<List<ComplexCell>> matrix)` | One gate placement (all components immutable, so equal specs compare equal). `GateSpec.of(kind, targets…)` is the uncontrolled, non-parametric shortcut. |
| `ComplexCell` | `(double re, double im)` | One matrix entry, carried as primitives. |

Conventions: `controls` are the most-significant qubits, so the runtime index
order is `controls ++ targets`. `params` carries `theta`/`phi`/`lambda` for
`RX`/`RY`/`RZ`/`PHASE`/`U3`; `matrix` is non-null only for
`GENERIC`/`ORACLE`/`MULTI_CONTROLLED`.

```java
CircuitSpec bell = CircuitSpec.of(2, List.of(
        new LevelSpec(List.of(GateSpec.of(GateKind.H, 0))),
        new LevelSpec(List.of(
                new GateSpec(GateKind.CNOT, List.of(1), List.of(0), Map.of(), null)))));
```

---

## `CircuitSpecs` — mapper

Static, non-instantiable. Bridges the spec model and the runtime circuit.

| Method | Returns | Description |
|--------|---------|-------------|
| `toCircuit(CircuitSpec)` | `Circuit` | **Lossless** build: the spec carries angles, control counts and matrices explicitly, so every kind reconstructs its concrete gate. `IDENTITY` gates are omitted (`Circuit` auto-pads idle wires). |
| `toSpec(Circuit)` | `CircuitSpec` | **Best-effort** reflect-back — see below. |

`toSpec` maps the runtime `getType()` label to a `GateKind` and splits
`getIndexes()` into controls/targets by the kind's known arity. It is
best-effort because the runtime model is lossy:

- Fixed-arity gates (single-qubit, `CNOT`/`CY`/`CZ`, `Swap`, `CSwap`,
  `Toffoli`, `Oracle`) reflect back exactly.
- Parametric gates (angle lost) and `MultiControlled` (control count lost)
  **degrade to `GENERIC`**, carrying the raw unitary and `getIndexes()` as
  targets — still renderable and executable, but no longer identified by their
  original kind. Idle `Identity` wires are dropped.

Lossless reflect-back is planned for a later (accessor-enabler) phase.

---

## `CircuitSpecJson` — JSON serialization

Zero-dependency, deterministic JSON for `CircuitSpec` — the shared format
between the Java simulator and the browser editor (and for save/load and
URL-sharing).

| Method | Returns | Description |
|--------|---------|-------------|
| `toJson(CircuitSpec)` | `String` | Compact, deterministic JSON (fixed key order; param keys sorted). Throws on non-finite numbers. |
| `fromJson(String)` | `CircuitSpec` | Parses and **validates at the boundary**: `numQubits` in `1..maxQubits`, indexes in range, controls/targets disjoint, matrix `2^k × 2^k`, at most `MAX_GATES` gates, finite numbers, known `GateKind`. Throws `IllegalArgumentException`/`JQApiLimitException` on bad input. |

```json
{"version":1,"numQubits":2,"levels":[
  {"gates":[{"kind":"H","targets":[0],"controls":[],"params":{}}]},
  {"gates":[{"kind":"CNOT","targets":[1],"controls":[0],"params":{}}]}
]}
```

`params` carries `theta`/`phi`/`lambda` for parametric kinds; `matrix` (nested
`{"re":…,"im":…}` arrays) appears only for `GENERIC`/`ORACLE`/`MULTI_CONTROLLED`.

---

## `AsciiCircuitRenderer`

Deterministic text drawing of a circuit. Output uses `\n` separators and a
fixed left-to-right level order, so it is stable enough for golden-master tests.

| Method | Description |
|--------|-------------|
| `new AsciiCircuitRenderer()` | Unicode renderer. |
| `new AsciiCircuitRenderer(boolean asciiOnly)` | `true` → pure-ASCII fallback (`● → *`, `⊕ → (+)`, `× → X`). |
| `draw(CircuitSpec)` | The drawing as a `String`. |
| `draw(Circuit)` | Convenience — routes through `toSpec` first. |
| `print(CircuitSpec)` / `print(Circuit)` | Prints to stdout, newline-terminated. |

Glyphs: single-qubit gates are boxed (`[H]`); a control is `●`, a
CNOT/Toffoli target `⊕`, a Swap target `×`; vertical connectors are `│` and
wire crossings `┼`; idle wires are plain (`──`).

```java
System.out.println(new AsciiCircuitRenderer().draw(bell));
// q0: ─[H]──●─
//           │
// q1: ──────⊕─
```
