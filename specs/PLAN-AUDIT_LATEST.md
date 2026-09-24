# Issue #110 implementation plan

The original scaffold did not implement classical execution. The completed work
uses the [v2 design](../docs/api/classical-design.md), written before replacing that
scaffold, and the following sequence:

1. Define classical register addresses, measurement destinations, gate predicates,
   ordering, validation, and version/migration semantics.
2. Connect them to simulator execution and independent-shot sampling.
3. Replace placeholder tests with analytic conditional, teleportation, syndrome,
   round-trip, rejection, and shot-isolation checks.
4. Rebuild the TeaVM bridge under JDK 25 and coordinate editor capability handling.
5. Run core, bridge, web, and browser verification; document the public API.

The implementation excludes loops and general classical computation. Grid editing
and ASCII display of classical wires remain unsupported and reject such circuits.

See [the verification report](verifications/AUDIT-110.md) for executed commands,
results, coverage of each acceptance criterion, and compatibility boundaries.
