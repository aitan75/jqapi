# Issue #110 verification

Verified on 2026-09-24 on `feature/110-classical-measurement-conditional`.
This report records executed checks; it does not claim independent reviewers.

| Acceptance criterion | Implementation and evidence |
| --- | --- |
| Measure/store/conditional X and Z; teleportation | Addressed `Measurement.into`, per-placement `ConditionalGate`, execution-owned register. `Issue110ConditionalCircuitTest` tests both outcomes/expectations and nonzero targets; `BellTeleportationClassicalTest` checks five input states over all four measurement branches. |
| Writes, uninitialized bits, reset, invalid references, same-level dependencies | Zero initialization, last write wins across levels, quantum reset preserves records, bounds validation and rejection of same-level read/write or write/write conflicts. Covered in `Issue110ClassicalDependenciesTest` and parser tests. |
| Isolated shots and #107 integration | `SamplingOptions.withClassicalBits`, immutable selected-address histogram in `SamplingResult`, fresh classical state for every shot. `Issue110IndependentShotsTest` checks isolation, preserved pre-reset records, selection order, repeatability, initial state and budget limits. |
| v1 meaning, lossless new semantics, unsupported capabilities | v1 remains readable; v2 serializes classical addresses on gate placements. Full value assertions cover JSON/Circuit round-trips. Unknown versions, malformed references, v1 with classical metadata and ambiguous prototype metadata are rejected. ASCII rendering rejects classical circuits. |
| Java/bridge/editor coordination | TeaVM JS rebuilt with JDK 25 and copied into the web app. Bridge returns records and classical histograms. The editor rejects unsupported imports through files and shared URLs. JVM/Node cross-checks, web tests and a browser test verify this behavior. |
| Standalone fixtures for #46/#6 | `Issue46StandaloneFixtureTest` executes parity-syndrome measurement and feed-forward for both syndromes; conditional and teleportation fixtures execute independently of those consumers. The fixture follows Surefire naming and is discovered. |

## Executed validation

- `mvn -B clean verify`: PASS, 308 tests, no failures/errors/skips; coverage gates pass.
- Core installed locally for the bridge build.
- `mvn -f jqapi-wasm/pom.xml -B package`: PASS, 10 tests, no failures/errors/skips, including generated JavaScript through Node.
- Generated `jqapi-wasm/target/js/jqapi.js` copied to `jqapi-web/src/wasm/jqapi.js`.
- `npm run build`: PASS; existing large-bundle warning.
- `npm run test`: PASS, 38 tests.
- `npm run lint`: PASS; three existing React warnings.
- `npm run test:e2e`: PASS, 10 Chromium tests.
- `git diff --check`: PASS.

## Compatibility boundary

The unfinished v2 prototype's global `measurementRecords`/`conditions` and
value-capturing `Condition` constructor were replaced. They could not describe
which operation a predicate guarded or where a measurement wrote. Their JSON is
rejected explicitly. Published v1 semantics and existing quantum-only constructors
remain supported. The grid editor and ASCII renderer do not yet display classical
wires; they reject these circuits instead of presenting an incomplete circuit.

See [the execution/schema design](../../docs/api/classical-design.md) and
[the manual example](../../docs/manual/examples.md#10-classical-feed-forward).
