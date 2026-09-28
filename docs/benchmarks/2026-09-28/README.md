# 2026-09-28: initial post-#15 baseline

Simulator source commit: `0df12f0c13144d3c9764ec2ea43fc50536b4ded6` (includes the
merged U3 fix). The working tree contains the issue #112 test/documentation and
benchmark additions; no production Java or bridge code changed for these runs.
The browser uses the committed vendored module, identified independently by the
payload SHA-256 in the raw result; it was not rebuilt for this harness-only change.
The reviewed harness sources are identified in [harness-sha256.txt](harness-sha256.txt).
After measurement, review changed the Playwright import to the declared dependency
and removed a redundant sampling-budget check; timed workloads are unchanged.
The recorded working-tree label has been normalized to `dirty`.

Environment: Apple M2, 8 logical CPUs, 24 GiB physical RAM, macOS (Java reports
26.6.2, Node Darwin kernel 25.6.0), aarch64/arm64. JVM: Oracle HotSpot JDK
25.0.3+9-LTS-195, `-Xms256m -Xmx1g`, sequential execution. Browser: Playwright's
headless Chromium 153.0.8010.12, Node v24.15.0. Machine power/thermal
state and background desktop activity were not controlled. Each harness ran in
its own fresh process, sequentially with no overlap between benchmark harnesses.
These are single-session observations; no maximum-capacity claim or stable
cross-platform timing guarantee is made.

## JVM

Workload harness: 3 warmups + 7 timed repetitions per case. Gate harness:
50 warmups + 200 timed repetitions per case. All timings are milliseconds per
whole operation, not per amplitude or per shot. The 1000-shot sampling row
includes all independent trajectories.

| Workload | Qubits | Median ms | Heap pool peak sum MiB |
| --- | --- | --- | --- |
| H-all-X-H-all-including-construction | 20 | 119.723 | 371.13 |
| grover-excluding-list-construction | 12 | 0.878 | 245.63 |
| sample-H-all-shots-1000 | 8 | 11.023 | 334.36 |
| H-q0-existing-register | 20 | 6.431 | 268.70 |
| CNOT-q0-qLast-existing-register | 20 | 6.640 | 269.07 |

Raw samples, ranges, JVM flags and timestamp:
[jvm-workloads.txt](jvm-workloads.txt), [jvm-gates.txt](jvm-gates.txt).
Heap numbers include garbage/earlier workloads and sum non-simultaneous pool
maxima. The 20-qubit numeric vector alone is 16 MiB; these heap observations are
not a formula for per-register storage. Grover searches 4096 items at 12 qubits
using the post-#15 in-place oracle/diffusion path. The marked result is checked.

## Browser

3 warmups + 7 timed repetitions per case. Timings include the bridge JSON round
trip, excluding module import, network transfer and UI rendering.

| Workload | Qubits | Shots | Median ms | Observed boundary heap high-water MiB | Output JSON bytes |
| --- | --- | --- | --- | --- | --- |
| run-H-all-CNOT-including-JSON | 8 | 0 | 2.700 | 5.56 | 9242 |
| run-H-all-CNOT-including-JSON | 16 | 0 | 129.800 | 114.05 | 2490394 |
| sample-H-all-CNOT-including-JSON | 8 | 1000 | 131.700 | 80.53 | 550 |

TeaVM module: **649,788 raw bytes**, **120,788 gzip bytes**.
These sizes exclude the React editor and output JSON. Raw environment, memory
method, per-call samples and SHA-256: [browser.json](browser.json).

The heap values are boundary observations, a lower-bound estimate of actual
peak JS heap, not RSS. Transient in-call allocations and array buffers may be
missing. Accumulated garbage and previous cases are included. The 16-qubit numeric
state alone is 1 MiB; serialization adds strings and objects.

## Limits versus completed workloads

The JVM completed the selected 20-qubit circuit/gates, 12-qubit Grover search,
and 8-qubit 1000-shot sampler. Chromium completed the selected 16-qubit bridge
execution and 8-qubit 1000-shot sampler. No larger sizes were attempted in this
bounded run: these are demonstrated examples, not ceilings.

Core defaults remain 24 register qubits / 12 search qubits; browser guards remain
24 qubits, 10,000 shots and 1,000,000,000 sampling work units. A configured guard
does not establish that the device can execute every permitted circuit. Historical
pre-#15 dense-oracle figures cannot be compared as a speedup benchmark here.

See the [protocol](../README.md) for exact commands, option bounds and timing scope.
