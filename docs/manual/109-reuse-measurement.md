# Parameter binding reuse measurement

Recorded on 2026-09-28 using the clean implementation commit identified below.
The [reproduction command and workload](109-parametric.md#reuse-measurement-112-methodology)
use a 256 MiB fixed heap, 2,000 warmup operations, then seven batches of 1,000
bindings. This is one local JVM run; it is not a baseline comparison or speedup
claim. Samples trend downward, so JVM warmup remains a source of variation.
No performance threshold is asserted.

```text
Commit: 46da88542e67741bf62eb5ca9835ba2eb507e991
JVM: Java HotSpot(TM) 64-Bit Server VM 25.0.3+9-LTS-195
Heap max bytes: 268435456
Machine: Mac14,7 / Apple M2; OS: Mac OS X 26.6.2; arch: aarch64; processors: 8
Warmup: 2000; operations/repetition: 1000; repetitions: 7
Scope: reuse one two-qubit/two-level template; alternate two prebuilt bindings;
include concrete circuit allocation and volatile sink; exclude simulation and map creation.
repetition,ns/bind
1,10017.6
2,10066.8
3,9812.4
4,9416.5
5,8390.3
6,7995.8
7,7108.3
ns/bind min=7108.3 median=9416.5 max=10066.8
Exploratory local timing only; no speedup claim or CI performance threshold.
```
