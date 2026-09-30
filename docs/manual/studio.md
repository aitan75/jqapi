# Studio: QASM, observables and execution limits

**Import QASM** opens a UTF-8 `.qasm` file as editable gates, preserving operation
order, parameters and dependencies. Qubit 0 remains the most significant bit.
Failed imports preserve the current circuit. Editing while a file is loading
discards that pending import.

QASM error summaries follow the selected language. The original Java diagnostic
is available in a collapsed **Technical details (English)** section.

**Export QASM** downloads OpenQASM 2. Unsupported gates cause an explicit error;
use **Save JSON** for arbitrary matrices or the controlled-phase gates of QFT.
Exports may lower SWAP/CSWAP and rename/split classical registers. Barriers are
validated but not retained as editor operations. See the [QASM subset](../api/openqasm.md).

Classical imports require one classical bit per qubit, `measure q[i] -> c[i]`,
and conditions on H, X, Y, Z, S, T, RX, RY, RZ, PHASE or U3. For conditions,
declare separate one-bit registers, e.g. `creg a[1]; creg b[1]; if(a==1) x q[1];`.
Multi-bit comparisons, other classical layouts, custom gate bodies and
density/noise simulation are unavailable through this editor path. The Java API
supports additional layouts; Studio never silently remaps classical addresses.

The existing **Shots** and **Run simulation** controls produce counts plus
optional observable results. Enter one weighted Pauli string per line, such as
`0.5 ZZ`. Exact values require a unitary circuit; sampled estimates support
measurement/reset/conditions and report standard error and total shots separately
from shots per term. Identity terms are exact and use no shots. Uncertainty
requires at least two shots. Exact and sampled failures are independent: a
sampled work-budget rejection can leave the exact answer available.

The Shots field shows circuit-specific work-budget limits for counts and sampled
observables and warns before a request exceeds them. The global maximum remains
10,000: for eight qubits and nine single-target structured gates, the counts
budget permits only 7,812 shots. These hints do not guarantee admission under
the other resource limits or completion before the deadline.

JSON compatibility: `MULTI_CONTROLLED` imports now require an X base matrix, or
a phase matrix with exactly one control. Earlier validation accepted arbitrary
base matrices even though the canvas could not represent them faithfully and
could reinterpret them as controlled X. Such imports now fail while preserving
the current circuit. Use the Java API for other controlled matrices.

Open **Capabilities and resource limits** for the policy. Eight qubits bound full
amplitude/probability views and histograms to 256 states; traces have a separate
total-amplitude limit. Raising capacity requires new browser measurements and
reduced/paged views, rather than changing a constant alone.

Simulation and QASM conversion run in Web Workers. **Cancel** terminates active
work, including synchronous TeaVM execution. Circuit edits invalidate pending
results. Each job has a five-second deadline including startup. After a timeout,
cancellation or error, the editor remains usable and the next job starts a fresh
worker. Reduce steps, shots or observable terms after a budget rejection.

See the [browser API](../api/browser-bridge.md) and
[recorded measurements](../benchmarks/2026-09-30/README.md).
