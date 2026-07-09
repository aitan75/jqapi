# Maven Checksum Verification (Issue #23) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fail the Maven build (CI and local) if any resolved plugin/dependency artifact's bytes differ from a committed, known-good SHA-256 lockfile.

**Architecture:** Use Maven Resolver's native "trusted checksums" post-processor (Maven 3.9.x, no third-party plugin) driven by a committed summary-file lockfile. All flags live in `.mvn/maven.config` so every `mvn` invocation — the three CI commands and local dev — inherits them with no `build.yml` change. Verification is `failIfMissing=false`: a byte mismatch on any *recorded* artifact fails the build; unrecorded artifacts (auxiliary tool trees) pass.

**Tech Stack:** Maven 3.9.x / Maven Resolver 1.9.x, GitHub Actions (`build.yml`), SHA-256 summary lockfile.

## Global Constraints

- Maven 3.9.x native mechanism only — **no third-party build plugins** for this feature.
- Pure Java 21 project, zero runtime dependencies; do not touch the `pom.xml` dependency set.
- Must not break the existing CI build: `mvn -B verify`, SonarCloud, OWASP Dependency-Check.
- Summary-file basedir MUST be `${maven.multiModuleProjectDirectory}/.mvn/checksums` — a plain relative path is silently not honored (validated).
- `failIfMissing=false` is deliberate (see spec §2); do not change it to `true`.
- Checksum algorithm: `SHA-256`.
- Lockfile committed at `.mvn/checksums/checksums-central.sha256`.
- No `Co-Authored-By` trailer in commits.

**Reference:** design spec `docs/superpowers/specs/2026-07-09-issue-23-maven-checksum-verification-design.md`.

---

### Task 1: Configure verification and commit the lockfile

**Files:**
- Create: `.mvn/maven.config`
- Create (generated, then committed): `.mvn/checksums/checksums-central.sha256`

**Interfaces:**
- Produces: a live build-integrity gate inherited by every `mvn` run from the repo root. Later tasks (docs) reference the exact `.mvn/maven.config` contents and the regeneration command defined here.

- [ ] **Step 1: Create `.mvn/maven.config`**

Create the file `.mvn/maven.config` with exactly this content (one arg per line):

```
--strict-checksums
-Daether.trustedChecksumsSource.summaryFile=true
-Daether.trustedChecksumsSource.summaryFile.basedir=${maven.multiModuleProjectDirectory}/.mvn/checksums
-Daether.artifactResolver.postProcessor.trustedChecksums=true
-Daether.artifactResolver.postProcessor.trustedChecksums.checksumAlgorithms=SHA-256
-Daether.artifactResolver.postProcessor.trustedChecksums.failIfMissing=false
```

- [ ] **Step 2: Record the lockfile (inherits config, adds record mode)**

The `.mvn/maven.config` from Step 1 is now active, so only record mode must be added on the command line:

Run:
```bash
mvn -Daether.artifactResolver.postProcessor.trustedChecksums.record=true verify
```
Expected: `BUILD SUCCESS`, and the file `.mvn/checksums/checksums-central.sha256` now exists.

- [ ] **Step 3: Verify the lockfile was written and is non-trivial**

Run:
```bash
wc -l .mvn/checksums/checksums-central.sha256
grep -c 'junit-jupiter' .mvn/checksums/checksums-central.sha256
grep -Ec 'maven-compiler-plugin|maven-surefire|jacoco|maven-enforcer' .mvn/checksums/checksums-central.sha256
```
Expected: line count in the low hundreds (~240); `junit-jupiter` count ≥ 1; core-plugin count ≥ 4. Each line is `<64-hex-sha256>  <group/path/artifact>`.

- [ ] **Step 4: Confirm the gate PASSES on the intact lockfile (config-only, no record flag)**

Run:
```bash
mvn -B verify
```
Expected: `BUILD SUCCESS`. This proves the committed lockfile is *read* and every resolved artifact matches. (`--strict-checksums` is also active here; a passing build confirms it does not break normal resolution.)

- [ ] **Step 5: Adversarially confirm the gate FAILS on tampering**

Corrupt one recorded checksum, re-run, confirm failure, then restore:
```bash
cp .mvn/checksums/checksums-central.sha256 /tmp/lockfile.bak
# flip the first hex digits of the junit-platform-engine jar line
perl -i -pe 's/^[0-9a-f]{8}(.*junit-platform-engine.*\.jar)$/deadbeef$1/ if /junit-platform-engine.*\.jar$/' .mvn/checksums/checksums-central.sha256
rm -rf ~/.m2/repository/org/junit/platform/junit-platform-engine   # force re-resolution
mvn -B verify; echo "EXIT=$?"
cp /tmp/lockfile.bak .mvn/checksums/checksums-central.sha256        # restore intact lockfile
```
Expected: `BUILD FAILURE` with `trusted checksum mismatch: ...` and `EXIT=1`. After restore, the file is byte-identical to the committed intent.

- [ ] **Step 6: Confirm the lockfile is intact after restore, then re-verify**

Run:
```bash
mvn -B verify
```
Expected: `BUILD SUCCESS` (the restore in Step 5 returned the lockfile to its correct state).

- [ ] **Step 7: Commit**

```bash
git add .mvn/maven.config .mvn/checksums/checksums-central.sha256
git commit -m "build: verify Maven artifact checksums via native trusted-checksums lockfile (#23)"
```

---

### Task 2: Document the workflow and close out the spec

**Files:**
- Create: `docs/manual/build-integrity.md`
- Modify: `docs/manual/README.md` (add a link to the new page)
- Modify: `docs/superpowers/specs/2026-07-09-issue-23-maven-checksum-verification-design.md` (tick the last acceptance criterion)

**Interfaces:**
- Consumes: the `.mvn/maven.config` contents and the regeneration command from Task 1.

- [ ] **Step 1: Write the developer-facing build-integrity doc**

Create `docs/manual/build-integrity.md` with this content:

````markdown
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
````

- [ ] **Step 2: Link the new page from the manual index**

In `docs/manual/README.md`, add a bullet linking to the new page in the section
that lists the manual's pages (match the existing link style in that file, e.g.):

```markdown
- [Build integrity](build-integrity.md) — how the build verifies Maven artifact checksums
```

If the exact section/wording differs, follow the file's existing list format;
the requirement is a working relative link to `build-integrity.md`.

- [ ] **Step 3: Tick the remaining acceptance criterion in the spec**

In `docs/superpowers/specs/2026-07-09-issue-23-maven-checksum-verification-design.md`,
change the second acceptance-criteria checkbox from unchecked to checked:

Find:
```markdown
- [ ] Wired into the build via `.mvn/maven.config` and `.mvn/checksums/checksums-central.sha256`,
```
Replace the leading `- [ ]` with `- [x]` (leave the text unchanged).

- [ ] **Step 4: Confirm docs build/links are sane**

Run:
```bash
test -f docs/manual/build-integrity.md && grep -q 'build-integrity.md' docs/manual/README.md && echo OK
```
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add docs/manual/build-integrity.md docs/manual/README.md docs/superpowers/specs/2026-07-09-issue-23-maven-checksum-verification-design.md
git commit -m "docs: document build-integrity checksum verification and close #23 spec (#23)"
```

---

### Task 3: Push branch and open the pull request

**Files:** none (git/remote only).

**Interfaces:**
- Consumes: the two commits from Tasks 1–2 on `feature/issue-23-maven-checksum-verification`.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feature/issue-23-maven-checksum-verification
```
Expected: branch published.

- [ ] **Step 2: Open the PR via the REST API (token from osxkeychain; no gh CLI)**

Create the PR against `main`, body referencing issue #23 with a `Closes #23`
line, using the git-credential token (per this repo's workflow). Confirm the PR
number and URL are returned.

- [ ] **Step 3: Report CI status**

After the PR's `Build` workflow runs, confirm it is green (the trusted-checksums
gate is now part of `mvn -B verify`). Report the result. Do **not** merge — the
maintainer reviews and merges.

---

## Self-Review

- **Spec coverage:** §1 config file → Task 1 Step 1; §2 `failIfMissing=false` → Global Constraints + Task 1 Step 1; §3 committed origin-aware lockfile → Task 1 Steps 2–3, 7; §4 regeneration workflow → Task 2 Step 1; §5 CI impact (no `build.yml` change) → Architecture + Task 3 Step 3; §6 documentation → Task 2 Steps 1–2; residual risk → Task 2 Step 1; both acceptance criteria → Task 1 (wiring) + Task 2 Step 3 (tick). Validation (record/verify/tamper) → Task 1 Steps 2–6. All covered.
- **Placeholder scan:** none — every step has exact file content or commands with expected output. The one conditional ("if the exact section/wording differs") gives a concrete fallback rule, not a TODO.
- **Type/name consistency:** file paths, property names, the lockfile path `.mvn/checksums/checksums-central.sha256`, and the basedir expansion are identical across all tasks and match the spec.
