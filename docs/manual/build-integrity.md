# Build integrity — Maven artifact checksum verification

jqapi verifies the **byte integrity** of every Maven plugin and dependency it
resolves, using Maven Resolver's native *trusted checksums* feature (Maven
3.9+). No third-party plugin is involved.

## How it works

- `.mvn/maven.config` enables `--strict-checksums` plus the trusted-checksums
  post-processor (SHA-256), reading a committed lockfile at
  `.mvn/checksums/checksums-central.sha256`.
- Because the config lives in `.mvn/maven.config`, **every** `mvn` invocation
  (CI and local) inherits it — the build fails if a resolved artifact's bytes do
  not match the lockfile. Artifacts not present in the lockfile are allowed
  through (`failIfMissing=false`), so the large auxiliary tool trees (SonarCloud,
  OWASP Dependency-Check) do not need to be pinned.

## Regenerating the lockfile (after bumping any dependency or plugin)

Any change to a dependency or plugin version changes artifact bytes, so the
lockfile must be re-recorded and committed:

```bash
mvn -Daether.artifactResolver.postProcessor.trustedChecksums.record=true verify
git add .mvn/checksums/checksums-central.sha256
git commit -m "build: refresh trusted-checksums lockfile"
```

Review the diff before committing: the changed lines should correspond exactly to
the artifacts you intended to bump.

## Residual risk (accepted)

- **Trust on first use:** the initial record trusts whatever is resolved at that
  moment; regenerate from a clean environment and review the diff.
- **`failIfMissing=false`:** an artifact under a brand-new coordinate not yet in
  the lockfile is not blocked; mitigated by pinned versions in `pom.xml`,
  `maven-enforcer` `requireUpperBoundDeps`, and code review of `pom.xml` changes.

See the design record in
`docs/superpowers/specs/2026-07-09-issue-23-maven-checksum-verification-design.md`.
