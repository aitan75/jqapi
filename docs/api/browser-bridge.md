# Browser bridge and Studio policy

`JqapiBridge` is compiled to the vendored TeaVM ES2015 module with **JDK 25**.
Copy `jqapi-wasm/target/js/jqapi.js` into the web project after rebuilding; never
edit generated code. The JVM core retains its independent larger defaults and
has no additional runtime dependency.

| Export | JSON success payload |
| --- | --- |
| `capabilities()` | Numeric policy limits, without an `ok` envelope |
| `importQasm(source)` | `{ok:true,spec:CircuitSpec}` |
| `exportQasm(specJson)` | `{ok:true,source:string}` |
| `lint(specJson, disabledRules)` | `{ok:true,diagnostics:[{rule,severity,levels,qubits,locations:[]}]}`; no simulation, texts localized by rule ID in the web layer |
| `lintQasm(source, disabledRules)` | `{ok:true,diagnostics:[…,locations:[{line,column}]],qubitNames:["reg[i]",…],spec:CircuitSpec}`; syntax errors return `INVALID_QASM`. `disabledRules` is a comma-separated rule ID list (e.g. `"QED001"`, or `""`), skipped before the 100-diagnostic cap |
| `run(specJson)` | Amplitudes and optional classical records |
| `trace(specJson,seed)` | Initial and post-operation frames, including skipped conditions |
| `sample(specJson,shots)` | Shots, quantum counts and optional classical counts |
| `expectation(specJson,observableJson)` | Exact value and per-term values |
| `sampleExpectation(specJson,observableJson,shots)` | Estimate, standard error, total shots and per-term statistics |

Errors have shape `{ok:false,error:{code,detail?}}`. `INVALID_QASM` includes a
parser/serializer diagnostic and never returns partial data. Existing invalid
spec/shot/observable/version codes remain. Limits use `INPUT_LIMIT_EXCEEDED`.
Exact expectations on non-unitary circuits use `NON_UNITARY_CIRCUIT`; sampling
can still succeed.

`BrowserBudget` is the policy source; a compiled TeaVM/web test compares its
`capabilities()` against UI limits. **The browser bridge's previous 24-qubit
guard is narrowed to eight**, including consumers outside Studio.

| Resource | Limit | Enforcement |
| --- | --- | --- |
| Quantum/classical bits | 8 each | Before vector/histogram allocation |
| Shots | 1–10,000; estimates need 2+ | Bridge entry points and UI |
| Depth/gates | 256 levels / 1,024 gates | Before gate construction; grid dimensions before allocation |
| Dense storage | 4,096 complex cells total | Sum explicit matrix cells before constructing gates |
| Input | 1,000,000 characters per input | Before parsing; uploaded files also capped at 1,000,000 bytes |
| Observable terms | 64 | Bridge and observable editor |
| Work | 20,000,000 estimated amplitude visits per call | Before simulator execution |
| Trace | 65,536 amplitudes across all frames | Before tracing/serialization |
| Result | 8 MiB UTF-8 per bridge response | Before returning success |
| Elapsed | 5 seconds per worker job | Host terminates the worker, including startup time |

Work is `trajectories * 2^qubits * (1 + gatePasses + extraPasses)`. Structured
gates contribute at least one pass or their target count; explicit matrices
contribute their row count. Exact observables add two passes per term. Sampled
observables multiply trajectories by non-identity terms and include two basis
change passes per qubit. Identity-only observables need no sampling trajectories.
These are conservative admission units, not wall-clock predictions. Core
simulation budgets also remain active.

Preflight output bounds complement the final byte guard: at most 256 quantum
or classical bins, 64 observable terms, and 65,536 trace amplitudes. Dense cells
represent a 64 KiB numeric lower bound, not a heap ceiling. JSON, object storage,
temporary allocations, worker messaging and rendering add overhead.

The web client's `startJob` owns one worker per request. `cancel()` terminates it
and resolves with `CANCELLED`; the deadline resolves with `TIMEOUT`. Worker
startup/message failures resolve with `SIMULATION_FAILED`. All outcomes release
the worker; late replies are ignored. Counts and both observable evaluations
share one job deadline. Direct synchronous exports need a worker host to enforce
elapsed time, while input/work/output guards always apply.

After QASM parsing the editor checks its narrower classical/gate capabilities.
Classical addresses are never remapped. v2 without classical bits is represented
as v1 on the existing unitary canvas, preserving all operations and parameters.
JSON import validation is also stricter for `MULTI_CONTROLLED`: the editor accepts
only X base matrices or single-control phase matrices. Other base matrices now
fail instead of being reconstructed incorrectly as controlled X. This is an
editor compatibility change; the core and bridge retain their broader matrix
support. Failed imports preserve the current model.
See [Studio usage](../manual/studio.md), the
[September 28 baseline](../benchmarks/2026-09-28/README.md) and
[September 30 measurements](../benchmarks/2026-09-30/README.md).
