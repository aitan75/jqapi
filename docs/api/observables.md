# Observables — `org.aitan.jqapi.observable`

Pauli observables (Hamiltonians), Hermitian overlaps and exact expectation
values of pure states. One shared representation for VQE/QAOA (#32), Trotter
simulation (#50) and quantum kernels (#51). Shot-based estimates live in the
simulator package: see [`ExpectationSampler`](simulator.md#expectationsampler).

- [Back to API index](README.md)
- Related: [Math](math.md) · [Simulator](simulator.md)

## Contents

- [Conventions](#conventions)
- [Pauli, PauliString](#pauli-paulistring)
- [PauliSum](#paulisum)
- [Expectation](#expectation)
- [PauliSumJson](#paulisumjson)

---

## Conventions

- **Label order.** In a label such as `"XIZ"`, character 0 acts on **qubit 0**,
  the most significant bit of the basis-state index, like everywhere else in
  jqapi. `"ZI"` measures qubit 0; on `|10>` it has value −1.
- **Pure states.** Expectations take a normalized `ComplexVector` of dimension
  `2^n` (for example `register.getRegisterState()`). A density-matrix adapter
  (`Tr(ρH)`, issue #9) can use the same `PauliString` masks.
- **Validation.** `null` arguments throw `NullPointerException`; invalid
  labels, indexes, coefficients, dimensions and non-normalized or non-finite
  states throw `IllegalArgumentException`; exceeded budgets and results outside
  the `double` range throw `JQApiLimitException`.

---

## `Pauli`, `PauliString`

`enum Pauli { I, X, Y, Z }` names a single-qubit factor.

`record PauliString(int numQubits, int xMask, int zMask)` is an immutable tensor
product of Paulis **without a coefficient**, for 1 to 30 qubits. Qubit `q` maps
to mask bit `numQubits − 1 − q`; X and Y set the X mask, Z and Y set the Z mask.

| Member | Description |
|--------|-------------|
| `fromLabel(String label)` *(static)* | Parses `I`/`X`/`Y`/`Z` per qubit, uppercase only. |
| `of(int numQubits, Map<Integer, Pauli> paulis)` *(static)* | Sparse form; absent qubits are `I`. The map is not retained. |
| `get(int qubit)` | Factor on `qubit`. |
| `yCount()` | Number of Y factors (global factor `i^yCount`). |
| `xMask()` / `zMask()` / `numQubits()` | Record components. |
| `toString()` | The label, e.g. `"XIZ"`. |

```java
PauliString a = PauliString.fromLabel("XIZ");
PauliString b = PauliString.of(3, Map.of(0, Pauli.X, 2, Pauli.Z));
assert a.equals(b);
```

---

## `PauliSum`

`record PauliSum(List<Term> terms)` is an immutable real linear combination
`H = Σ cₖ Pₖ`. `record Term(double coeff, PauliString pauli)` rejects
non-finite coefficients. A sum needs at least one term, and every term must act
on the same number of qubits; the list is copied (`List.copyOf`).

| Member | Description |
|--------|-------------|
| `of(Term... terms)` / `of(List<Term> terms)` *(static)* | Builds the sum. |
| `terms()` | Unmodifiable terms, in input order. |
| `numQubits()` | Qubit count of every term. |

Like terms are **not** merged and the sum is not simplified.

---

## `Expectation`

Static helpers on pure state vectors. Pauli terms are evaluated through the
masks with `P|b> = i^yCount · (−1)^popcount(b & zMask) · |b ⊕ xMask>`, in
`O(2^n)` time per term and `O(1)` extra memory: no `2^n × 2^n` operator is ever
built (a 20-qubit evaluation is covered by the tests).

| Method | Returns | Description |
|--------|---------|-------------|
| `overlap(a, b)` | `Complex` | Hermitian `⟨a\|b⟩ = Σ conj(aᵢ)·bᵢ`; equal dimensions and finite amplitudes required. |
| `fidelity(a, b)` | `double` | `\|⟨a\|b⟩\|²` of two normalized states (tolerance `1e-9`). |
| `of(state, PauliString p)` | `double` | Exact `⟨ψ\|P\|ψ⟩`. |
| `of(state, PauliSum h)` | `double` | Exact `⟨ψ\|H\|ψ⟩` within `DEFAULT_MAX_WORK`. |
| `of(state, PauliSum h, long maxWork)` | `double` | As above with an explicit amplitude-visit budget. |
| `requireWithinBudget(PauliSum h, long maxWork)` | `void` | Checks `terms × 2^n ≤ maxWork` from the observable alone, before any state is allocated. |

`DEFAULT_MAX_WORK` is 1,000,000,000 amplitude visits, as for sampling.

```java
Circuit ansatz = new Circuit(1);
CircuitLevel level = new CircuitLevel();
level.addGate(new Ry(theta, 0));
ansatz.addLevel(level);
LocalSimulator sim = new LocalSimulator(ansatz);
sim.execute();
ComplexVector psi = sim.getQuantumRegister().getRegisterState();

PauliSum h = PauliSum.of(
        new PauliSum.Term(1.0, PauliString.fromLabel("Z")),
        new PauliSum.Term(0.5, PauliString.fromLabel("X")));
double energy = Expectation.of(psi, h); // cos θ + 0.5 sin θ
```

`ComplexVector.innerProduct` is the underlying primitive; unlike
`Expectation.overlap` it does not reject non-finite entries. The bilinear
`dotProduct` is unchanged.

---

## `PauliSumJson`

Deterministic JSON for a `PauliSum`. It is an **execution input**, like shots,
and is never stored in `CircuitSpec`.

```json
{"numQubits":3,"terms":[{"coeff":0.5,"pauli":"XIZ"},{"coeff":-1.0,"pauli":"YYI"}]}
```

| Member | Description |
|--------|-------------|
| `toJson(PauliSum)` *(static)* | Compact JSON, terms in order. |
| `fromJson(String json, JQAPIConfig config)` *(static)* | Parses and validates; `numQubits` is bounded by `config.maxQubits()`. |
| `MAX_TERMS` | 1024 terms. |
| `MAX_JSON_LENGTH` | 1 MiB of input. |

Unknown or missing fields, malformed labels, a label length different from
`numQubits` and non-finite coefficients throw `IllegalArgumentException`;
oversized input, too many terms and out-of-range `numQubits` throw
`JQApiLimitException`. The browser bridge accepts this format (see
[bridge exports](simulator.md#browser-bridge-expectation-exports)).
