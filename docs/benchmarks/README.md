# Reproducible simulator benchmarks

These optional measurements extend `MemoryLimitBenchmark` and
`QuantumRegisterHotLoopBenchmark`. They are not unit tests, and CI never fails
because of a timing threshold. Run on an otherwise idle machine, sequentially;
record power mode, competing workloads and thermal throttling when relevant.
For trends, use the same JDK/browser, heap, workload, warmup and repetition count
and repeat in fresh processes. A single process is an observation, not a rigorous
cross-machine ranking or maximum-capacity search.

## JVM protocol

Compile first, then run directly with `java` to keep Maven and JaCoCo out of timings:

```bash
mvn -B test-compile
java -Xms256m -Xmx1g \
  -Dbenchmark.commit="$(git rev-parse HEAD)" \
  -Dbenchmark.tree="$(test -z "$(git status --porcelain)" && echo clean || echo dirty)" \
  -Dbenchmark.machine="YOUR-CPU-CORES-RAM" \
  -cp target/classes:target/test-classes \
  org.aitan.jqapi.benchmark.MemoryLimitBenchmark --baseline
java -Xms256m -Xmx1g \
  -Dbenchmark.commit="$(git rev-parse HEAD)" \
  -Dbenchmark.tree="$(test -z "$(git status --porcelain)" && echo clean || echo dirty)" \
  -Dbenchmark.machine="YOUR-CPU-CORES-RAM" \
  -cp target/classes:target/test-classes \
  org.aitan.jqapi.benchmark.QuantumRegisterHotLoopBenchmark --baseline
```

Both print UTC time, source commit/tree state, JVM/version/flags, OS/architecture,
processor count, maximum heap, warmup/repetitions, all individual timed samples,
min/median/max and memory metrics. Supply the metadata properties; `UNRECORDED`
means the output is not suitable as a published baseline.

| Property (`-Dbenchmark.NAME=value`) | Workload harness default | Gate harness default | Accepted range |
| --- | --- | --- | --- |
| `warmup` | 3 | 50 | 1–1000 |
| `repetitions` | 7 | 200 | 1–1000 |
| `qubits` | 20 | 20 | 2–24 |
| `searchQubits` | 12 | — | 2–16 |
| `sampleQubits` | 8 | — | 2–12 |
| `shots` | 1000 | — | 1–10000 |

The bounded mode preflights a conservative `64 * 2^n <= maxHeap/2` estimate.
The sampling API enforces its own default work budget. This is not an OOM
guarantee. The existing no-argument exhaustion mode remains available explicitly
for capacity investigations and may run until OOM; do not use it for routine CI.

The workload harness times: construction plus H on every qubit, X on q0, then H
on every qubit; production `Algorithm.search` with one marked item (excluding
input-list construction, including oracle scan and retries); and independent-shot
sampling of H on every qubit (circuit construction excluded). Sampling uses seed
112. Grover uses the production `SecureRandom`, so rare retries can change timing.
Gate measurements apply H(q0) and non-adjacent CNOT(q0,qLast) on an existing
register. All bounded runs use sequential execution; use the existing parallel
harness separately for scaling studies. This baseline does not measure parallel
throughput or replace the existing allocation benchmarks.

`heapPoolPeakSumBytes` sums JVM heap-pool high-water marks reset after warmup.
It includes accumulated garbage and objects from prior workloads; pool maxima
can occur at different times. It is neither simultaneous live peak nor process
RSS. `stateVectorLowerBoundBytes` is exactly `16 * 2^n`, not total memory.

## Browser protocol

```bash
cd jqapi-web
npm ci --ignore-scripts
npx playwright install chromium
npm run --silent benchmark:browser > /tmp/jqapi-browser-baseline.json
```

The standalone script serves the committed TeaVM ES2015 JavaScript module on an
ephemeral loopback port, launches headless Chromium and closes both afterward.
It records source commit/tree state, payload SHA-256, CPU/RAM/OS, Node and browser
versions, browser flags, random-source policy, input sizes, raw timing samples,
warmup/repetitions, output JSON bytes and raw/gzip module bytes. It measures the
bridge including input stringify and output parse; module import, UI rendering,
network/download and browser launch are excluded. No timing assertions are added
to Playwright or Vitest. The raw module gzip size is a compression estimate, not
the full Vite app's network transfer size.

Defaults are 3 warmups and 7 timed repetitions for 8-qubit H-all/CNOT
execution, plus 1000-shot sampling at 8 qubits. Optional environment variables:
`BENCHMARK_WARMUP` and `BENCHMARK_REPETITIONS` (1–100), `BENCHMARK_QUBITS` (2–8),
`BENCHMARK_SHOTS` (1–10000). The current bridge policy caps execution at eight
qubits, matching Studio. The September 28 report retains the historical
16-qubit observation under the previous bridge policy.
The bridge has no seeded sampling API; distributions/count totals, not identical
draws, are the browser contract.

`observedHeapHighWaterBytes` is a **lower-bound estimate of peak JS heap**, sampled
at call boundaries with Chromium precise-memory reporting enabled. It includes
prior workload garbage and measurement/validation objects, may omit array buffers,
and misses transient allocations inside synchronous calls. It is not RSS or a
measured capacity ceiling. The numeric state-vector lower bound is also recorded.
For a true device ceiling, collect a browser/OS memory trace in a separate run.

## Recorded baseline

The Studio worker protocol is available with `npm run benchmark:studio` (or
`node benchmarks/studio.mjs` for clean JSON stdout). It runs the actual worker
client in Chromium, with three warmups and seven repetitions: an eight-qubit
trace, a trace at the 65,536-amplitude boundary, counts, combined exact/sampled
observables, and counts near the work budget. Worker startup, module loading,
JSON conversion and structured cloning are included; React rendering is excluded.
A 10 ms main-thread heartbeat records scheduling opportunities, without latency
assertions. No worker heap measurement is claimed. Run separately from tests or
other benchmarks; [September 30](2026-09-30/README.md) records this policy baseline.

The [2026-09-28 observation](2026-09-28/README.md) includes raw JVM and Chromium
results. The historical pre-#15 dense-oracle search figures are superseded for
current-workload guidance; do not infer a speedup ratio across different harnesses,
heaps or machines, and do not equate demonstrated workload sizes with limits.
