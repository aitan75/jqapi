# 2026-09-30: Studio execution policy (#113)

Base commit: `219cb6e58f645b8df00a89ab802f3758af38df8c`; working tree includes
the #113 implementation. TeaVM was rebuilt with Oracle JDK 25.0.3+9-LTS-195.
The [raw worker results](studio.json) identify the actual generated module by
SHA-256; [source hashes](harness-sha256.txt) identify the harness and execution code.

Environment: Apple M2, 8 logical CPUs, 24 GiB RAM, Darwin 25.6.0 arm64,
Node v24.15.0, headless Chromium 153.0.8010.12. Tests/builds and the two browser
benchmarks ran separately. Desktop activity, thermal state and power mode were
not controlled. These are single-session observations, not capacity ceilings or
cross-platform timing guarantees.

## Actual Studio worker client

Run `node benchmarks/studio.mjs` from `jqapi-web`. Each case has three warmups
and seven measured repetitions. Each request creates a fresh worker, as in
Studio. Timings include worker startup, module loading through Vite, TeaVM,
JSON parsing and structured cloning. They exclude React rendering. Modules may
be served from browser cache; these are not cold-network startup measurements.
The workload is eight separate H gates followed by CNOT(q0,q7), except for the
trace boundary case, which applies 255 sequential H gates to q0.

| Workload (8 qubits) | Median ms | Maximum ms | Result JSON bytes |
| --- | ---: | ---: | ---: |
| Trace, 9 gates / 10 frames | 44.9 | 50.9 | 55,954 |
| Trace, 255 gates / 256 frames | 89.7 | 91.2 | 1,087,685 |
| Counts, 1,000 shots | 234.0 | 237.6 | 597 |
| Counts + exact + sampled X0, 1,000 shots | 346.6 | 368.0 | 829 |
| Counts, 7,800 shots, near work limit | 1,149.5 | 1,162.6 | 853 |

The last case costs 19,968,000 admission units, immediately below the 20 million
limit. A main-thread 10 ms heartbeat fired 114–116 times while it ran, showing
that synchronous TeaVM work no longer occupies the UI thread. This does not
measure input latency or prove a responsiveness bound. Worker heap was not measured.
Trace normalization, frame counts, shot totals and deterministic X0 observable
results were checked outside the timed portion.

The raw generated module is 1,254,147 bytes, or 215,663 gzip bytes. This includes
QASM parser/serializer support; it is not the size of the minified Vite app or
its full network transfer.

Vite emits the simulator as a separate worker bundle. The production chunk-size
warning concerns the main UI bundle; the worker is below the default 500 kB
warning threshold. The raw generated module's growth is a separate download
and startup consideration, not the direct cause of that warning.

## Policy rationale

- **Keep eight qubits.** The [#112 baseline](../2026-09-28/README.md) already
  showed a 16-qubit single-state response of 2,490,394 bytes and 129.8 ms, versus
  9,242 bytes and 2.7 ms at eight. That run excluded trace growth, worker startup
  and rendering. There is no evidence here for increasing Studio's default.
  Full tables/histograms remain bounded to 256 rows/bins; future increases need
  reduced/paged views and measurements including rendering.
- **20 million work units / five seconds.** The near-budget sampler completed
  in about 1.15 seconds on this machine. The deadline leaves substantial margin
  for startup, multiple evaluations and slower machines, but may reject valid
  workloads there. Terminating the worker is the recovery mechanism. Unit and
  browser tests verify timeout/cancel/retry behavior without timing performance
  assertions. The admission formula is deliberately conservative for basis
  changes and dense matrix rows; it is not a runtime prediction.
- **Trace and result bounds.** 65,536 retained amplitudes completed at the trace
  boundary. Its mostly sparse states yielded about 1.04 MiB of JSON; other states
  serialize larger. An independent 8 MiB response cap remains enforced. Eight
  qubits also bound both quantum and classical count arrays before allocation.
- **Editor/input bounds.** 256 levels, 1,024 gates, 64 observable terms, one million
  input characters and 4,096 explicit dense cells are conservative allocation
  and UI bounds, not measured maximum capacities. The numeric matrix lower bound
  is 64 KiB; JSON, objects and temporary storage add overhead. Public boundary
  tests reject oversized inputs before simulation. Sampling may reject a valid
  observable while exact evaluation remains available.

## Direct bridge comparison

[browser.json](browser.json) records the updated #112 harness on the final
module, including JSON conversion, output bytes and boundary heap observations.
It excludes module loading, workers and rendering. Heap observations include
garbage and preceding workloads, omit transient peaks and are not RSS or a
worker-memory measurement. Compare like workloads and timing scopes; do not
infer a simulator regression from the worker totals above.

The [API policy](../../api/browser-bridge.md) lists enforcement points, including
the distinction between per-call work guards and the combined worker deadline.
