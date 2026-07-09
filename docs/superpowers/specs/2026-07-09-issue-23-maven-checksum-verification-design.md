# Design — Issue #23: Verify Maven plugin/dependency checksums in CI

- **Issue:** #23 `[SECURITY] Verify Maven plugin/dependency checksums in CI (dependency verification)`
- **Date:** 2026-07-09
- **Status:** Approved (design)

## Problem

The build downloads plugins and dependencies from Maven Central during CI. A
supply-chain compromise at that layer — a poisoned Central mirror, a hijacked
build number, or a tampered cached artifact — would currently go undetected.
`pom.xml` pins exact versions and `maven-enforcer-plugin` bans duplicate/upper-bound
drift, and GitHub Actions are pinned by commit SHA, but **artifact byte integrity
is not verified** during resolution.

## Goal

Fail the build if any resolved Maven artifact's bytes do not match a
known-good, committed checksum — with no third-party plugin and no meaningful
maintenance burden beyond regenerating the lockfile on a deliberate
dependency/plugin bump.

## Constraints

- Pure Java 21 project, zero runtime dependencies (only `junit-jupiter`, test scope).
- No third-party build plugins for this feature (consistent with the zero-deps ethos).
- Must not break the existing CI build (`mvn -B verify`, SonarCloud, OWASP Dependency-Check).
- Maven 3.9.x on the runner (Resolver 1.9.x) — confirmed locally as 3.9.15.

## Chosen approach: Maven Resolver "trusted checksums" (native lockfile) + `--strict-checksums`

Maven Resolver 1.9.x (shipped with Maven 3.9.x) provides a
`TrustedChecksumsArtifactResolverPostProcessor` that compares every resolved
artifact against a trusted checksum source and **fails resolution on mismatch**.
Used with the *summary file* source, this is a committed SHA-256 **lockfile** —
a Gradle/npm-style pin of exact artifact bytes.

This was validated empirically before adopting it (see *Validation* below):
record → verify (pass) → tamper one line → `BUILD FAILURE` with an explicit
`trusted checksum mismatch` message.

`--strict-checksums` is added as a cheap, orthogonal second layer: it makes Maven
enforce (rather than warn on) the Central-published checksum during download.

### Why not the alternatives

- **`--strict-checksums` only** — zero maintenance, but only defends against
  transit/mirror corruption where the checksum does not match; an attacker who
  controls the published checksum is not stopped. Kept as a layer, not the gate.
- **PGP signature verification (`pgpverify-maven-plugin`)** — stronger (survives
  trust-on-first-use), but adds a third-party plugin plus keysmap maintenance and
  unsigned-artifact handling. Overkill for a small library with a tiny, pinned
  dependency set.
- **Defer** — allowed by the acceptance criteria, but the native lockfile is
  low-cost enough that real protection is worth adopting now.

## Design

### 1. Configuration lives in `.mvn/maven.config`

A single file, auto-applied to **every** `mvn` invocation run from the repo root
(CI and local dev alike), so the three CI commands (`verify`, SonarCloud,
Dependency-Check) need no changes and no duplicated flags:

```
--strict-checksums
-Daether.trustedChecksumsSource.summaryFile=true
-Daether.trustedChecksumsSource.summaryFile.basedir=${maven.multiModuleProjectDirectory}/.mvn/checksums
-Daether.artifactResolver.postProcessor.trustedChecksums=true
-Daether.artifactResolver.postProcessor.trustedChecksums.checksumAlgorithms=SHA-256
-Daether.artifactResolver.postProcessor.trustedChecksums.failIfMissing=false
```

Applying it globally (not CI-only) means local developer builds are protected
too, and CI and local behavior stay identical.

> **Basedir must be non-relative (validated).** A plain relative
> `basedir=.mvn/checksums` is silently not honored by the summary-file source —
> the lockfile is neither written nor read there. The portable fix is
> `${maven.multiModuleProjectDirectory}/.mvn/checksums`: Maven expands
> `maven.multiModuleProjectDirectory` to the directory containing `.mvn/` (the
> repo root) on every machine and in CI. Confirmed empirically on Maven 3.9.15.

### 2. `failIfMissing=false` (deliberate)

The post-processor fails only when an artifact **present in the lockfile** has a
mismatching checksum. An artifact **absent** from the lockfile is allowed
through. Rationale:

- The three CI commands resolve different plugin trees (SonarCloud scanner,
  OWASP Dependency-Check pull large transitive sets). `failIfMissing=true` would
  require the lockfile to contain all of them, producing a huge, high-churn
  lockfile and a brittle build that breaks on every upgrade.
- Versions are pinned in `pom.xml` and `requireUpperBoundDeps` is enforced, so a
  tampered artifact arrives under an already-**known** coordinate → it is in the
  lockfile → mismatch → build fails. New coordinates only appear via a reviewed
  `pom.xml` change.

This is the pragmatic balance: real tamper-detection on the core build+test
artifact set, without cross-command brittleness.

### 3. Lockfile: committed, origin-aware

- Path: `.mvn/checksums/checksums-central.sha256` (the summary source names the
  file per remote repository id; Central → `checksums-central`).
- Format: `<sha256>  <groupPath>/<artifact>` lines, one per artifact.
- Committed to git. It is the source of truth for expected artifact bytes.

### 4. Lockfile regeneration workflow (manual, on dependency/plugin bump)

Documented command that re-records the lockfile. Because `.mvn/maven.config`
already enables the summary-file source, its basedir, and the post-processor,
regeneration only needs to add **record mode** (everything else is inherited):

```
mvn -Daether.artifactResolver.postProcessor.trustedChecksums.record=true verify
```

Record mode captures every artifact resolved during the build, including those
already present in the local `~/.m2` cache (validated: a warm-cache `verify`
records the full core set). To also pin the auxiliary tool chains, the
maintainer may append the SonarCloud and Dependency-Check goals to the same
record run. The regenerated file is reviewed in the diff and committed. (Record
mode is never run in CI — CI only verifies.)

### 5. CI impact

No change to the commands in `build.yml`; the flags are inherited from
`.mvn/maven.config`. The gate is implicit: a mismatch fails `mvn -B verify`.
Bonus: the post-processor verifies artifacts already present in the cached
`~/.m2` (restored by `setup-java`'s Maven cache), so cache tampering is caught,
not only fresh downloads.

### 6. Documentation

- This design doc.
- A short "Supply-chain / build integrity" section in the docs (developer-facing)
  covering: what the lockfile is, how verification works, and **the exact
  regeneration command** to run after bumping any dependency or plugin.
- The accepted residual risk (below), recorded so it is an explicit decision.

## Residual risk (accepted)

- **Trust on first use (TOFU).** The initial `record` trusts whatever is
  resolved at that moment. It pins integrity going forward but does not itself
  attest that the first-recorded bytes were themselves untampered. Mitigated by
  recording from a clean environment and reviewing the lockfile diff.
- **`failIfMissing=false`.** An artifact under a brand-new coordinate not yet in
  the lockfile is not blocked. Mitigated by pinned versions, `requireUpperBoundDeps`,
  and code review of `pom.xml` changes.
- These are documented and considered acceptable for this project's risk profile;
  `pgpverify` remains a future option if stronger guarantees are ever needed.

## Validation (already performed)

Against Maven 3.9.15 locally, using an isolated local repository and checksums
directory (no repo pollution):

1. **Record** run wrote `.../checksums-central.sha256` with `<sha256>  <path>` lines.
2. **Verify** with the intact lockfile (local repo wiped, artifacts re-resolved): `EXIT 0`.
3. **Tamper** one line (corrupted the SHA-256 of `junit-platform-engine-6.1.1.jar`)
   then verify: `BUILD FAILURE`, `EXIT 1`, message:
   `trusted checksum mismatch: summaryFile=deadbeef…; calculated=3ae22ca7…`.
4. **Warm-cache record**: recording against the already-populated default `~/.m2`
   (no fresh download) produced a complete 243-artifact lockfile including
   `junit-jupiter` and all core build plugins.
5. **Basedir resolution**: a plain relative `basedir=.mvn/checksums` wrote/read
   nothing; `${maven.multiModuleProjectDirectory}/.mvn/checksums` correctly
   resolved to the repo-root `.mvn/checksums/`.

## Acceptance criteria (from #23)

- [x] Decision made and documented: **native trusted-checksums lockfile (SHA-256)
      + `--strict-checksums`**, with `failIfMissing=false`; rationale and residual
      risk recorded here.
- [ ] Wired into the build via `.mvn/maven.config` and `.mvn/checksums/checksums-central.sha256`,
      verified not to break the existing build (`mvn -B verify`, SonarCloud, Dependency-Check).

## Out of scope

- PGP signature verification.
- A CI workflow to auto-regenerate the lockfile (kept as a documented manual step).
- Any change to runtime dependencies (there are none) or the `pom.xml` dependency set.
