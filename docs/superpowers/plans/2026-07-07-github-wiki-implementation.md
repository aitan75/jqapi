# GitHub Wiki (Issue #20) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a GitHub Wiki for jqapi (8 pages + sidebar) that orients newcomers and links into the existing `docs/` reference, without duplicating any content.

**Architecture:** The Wiki is a separate git repository (`jqapi.wiki.git`), unrelated to the main `jqapi` repo's branches/PRs. It must be initialized once via the GitHub web UI, then cloned, populated, and pushed directly (no PR mechanism exists for wiki content). A small follow-up PR against `README.md` (via the already-created `feature/issue-20-github-wiki` branch) links to the new Wiki.

**Tech Stack:** Plain Markdown files (GitHub wiki flavor — filenames map to page names, hyphens render as spaces, `_Sidebar.md` is a reserved filename for the nav panel). Git for both the wiki repo and the main repo's PR.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-07-07-github-wiki-design.md` (committed `0930b44` on `feature/issue-20-github-wiki`).
- **No content duplication**: pages whose content already exists in `docs/`, `README.md`, or elsewhere in the repo must be link-only — never restate that content.
- **No push before review**: Wiki pushes have no PR/review gate — content goes live immediately. All 8 pages + sidebar must be drafted and shown to the user for approval (Task 11) before any `git push` to `jqapi.wiki.git` (Task 12).
- **Wiki link convention**: internal links use the bare page filename without `.md` (e.g. `[Getting Started](Getting-Started)`), matching GitHub wiki's relative-link resolution.
- This plan has no automated tests — the deliverable is static Markdown content, not executable code. Each task's "Verify" step is a manual content/link check instead of a test run.

---

## File structure

New files, all in a fresh clone of the wiki repo at `/Users/aitan/workspace/jqapi.wiki` (sibling to `/Users/aitan/workspace/jqapi`, since it's a distinct git remote, not a branch of the main repo):

- `Home.md` — landing page, links to every other page
- `Getting-Started.md` — install/build/run + first program
- `API-Reference.md` — link-only, points into `docs/api/*`
- `User-Manual.md` — link-only, points into `docs/manual/*`
- `Architecture.md` — internal design overview
- `Contributing.md` — link-only, points into `README.md#contributing`
- `CI-and-Quality.md` — CI pipeline + quality gates overview
- `FAQ.md` — short Q&A
- `_Sidebar.md` — nav panel shown on every page

One modified file in the main repo, on `feature/issue-20-github-wiki`:

- `README.md` — add a link to the Wiki under the existing `## Documentation` section

---

### Task 1: Initialize and clone the wiki repository

**Files:**
- None yet — this task only initializes the remote and verifies local clone access.

**Interfaces:**
- Produces: a reachable `https://github.com/aitan75/jqapi.wiki.git` remote, and a local clone at `/Users/aitan/workspace/jqapi.wiki`.

- [ ] **Step 1: Ask the user to create the wiki's first page via the GitHub web UI**

There is no REST API to create a wiki repository. Ask the user to:
1. Open `https://github.com/aitan75/jqapi/wiki`
2. Click "Create the first page"
3. Use title `Home`, any placeholder body (e.g. `placeholder — replaced by automation`), and save

Wait for explicit confirmation from the user that this is done before continuing.

- [ ] **Step 2: Clone the wiki repository**

```bash
git clone https://github.com/aitan75/jqapi.wiki.git /Users/aitan/workspace/jqapi.wiki
```

Expected: clone succeeds and `/Users/aitan/workspace/jqapi.wiki/Home.md` exists with the placeholder body. If it fails with a 404/"repository not found", the first page has not been created yet — go back to Step 1.

- [ ] **Step 3: Verify remote push access**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git remote -v
```

Expected: both `fetch` and `push` URLs point at `https://github.com/aitan75/jqapi.wiki.git`. Do not push anything yet — later tasks only edit files locally until Task 12.

---

### Task 2: Draft `Home.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/Home.md`
- Verify: manual — every link target below must match a filename created by Tasks 3–10 (`Getting-Started`, `API-Reference`, `User-Manual`, `Architecture`, `Contributing`, `CI-and-Quality`, `FAQ`).

**Interfaces:**
- Consumes: page filenames produced by Tasks 3–10.
- Produces: `Home.md`, linked from `_Sidebar.md` (Task 10).

- [ ] **Step 1: Write the file**

```markdown
# jqapi Wiki

**jqapi** is a Java library for building and simulating quantum-computing circuits with a local state-vector simulator — no quantum hardware or cloud account required.

This Wiki is a starting point for newcomers. The versioned reference documentation (API reference, user manual) lives in the repository itself under `docs/`, linked from here — nothing is duplicated between the two.

## Where to go next

- **New to jqapi?** → [Getting Started](Getting-Started)
- **Building against the library?** → [API Reference](API-Reference)
- **Learning the concepts?** → [User Manual](User-Manual)
- **Curious how it's built internally?** → [Architecture](Architecture)
- **Want to contribute?** → [Contributing](Contributing)
- **Wondering how CI/quality checks work?** → [CI and Quality](CI-and-Quality)
- **Have a quick question?** → [FAQ](FAQ)

## Project links

- [Source code](https://github.com/aitan75/jqapi)
- [Open issues](https://github.com/aitan75/jqapi/issues)
- [SonarCloud dashboard](https://sonarcloud.io/summary/new_code?id=aitan75_jqapi)
```

- [ ] **Step 2: Verify**

Confirm each of the 7 linked page names (`Getting-Started`, `API-Reference`, `User-Manual`, `Architecture`, `Contributing`, `CI-and-Quality`, `FAQ`) exactly matches a filename (minus `.md`) that Tasks 3–10 create. Fix any mismatch now.

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add Home.md
```

---

### Task 3: Draft `Getting-Started.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/Getting-Started.md`

**Interfaces:**
- Consumes: `README.md#requirements` (main repo), `User-Manual` and `API-Reference` filenames (Tasks 5, 4).
- Produces: `Getting-Started.md`.

- [ ] **Step 1: Write the file**

```markdown
# Getting Started

## Requirements

- Java 21+
- Maven 3.9+

(See the [repository README](https://github.com/aitan75/jqapi#requirements) for the up-to-date list.)

## Clone and build

```bash
git clone https://github.com/aitan75/jqapi.git
cd jqapi
mvn clean package
```

The build produces `target/jqapi-1.0.0.jar`.

## Run the test suite

```bash
mvn verify
```

This also generates a JaCoCo coverage report at `target/site/jacoco/index.html`.

## Your first program

```java
Circuit circuit = new Circuit(1);
CircuitLevel level = new CircuitLevel();
level.addGate(new Hadamard(0));
circuit.addLevel(level);

QuantumSimulator simulator = new LocalSimulator(circuit);
simulator.execute();
QuantumRegister qreg = simulator.getQuantumRegister();
qreg.measure();
System.out.println(qreg.getResult()[0]);
```

This builds a single-qubit circuit, applies a Hadamard gate, runs it on the local simulator, and measures the result — each run randomly yields `|0>` or `|1>` with roughly equal probability.

## Next steps

- Work through the [User Manual](User-Manual) for a task-oriented introduction to qubits, gates, circuits and measurement.
- Browse the [API Reference](API-Reference) once you know what you're looking for.
```

- [ ] **Step 2: Verify**

Confirm the code block is a valid Java snippet using only classes documented in `docs/api/quantum.md` and `docs/api/simulator.md` on the main repo (`Circuit`, `CircuitLevel`, `Hadamard`, `QuantumSimulator`, `LocalSimulator`, `QuantumRegister`). It matches the "Getting Started" example already in `README.md`, trimmed to the essential lines.

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add Getting-Started.md
```

---

### Task 4: Draft `API-Reference.md` (link-only)

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/API-Reference.md`

**Interfaces:**
- Consumes: `docs/api/README.md`, `docs/api/quantum.md`, `docs/api/gates.md`, `docs/api/simulator.md`, `docs/api/math.md` (main repo, `main` branch).
- Produces: `API-Reference.md`.

- [ ] **Step 1: Write the file**

```markdown
# API Reference

The full class-by-class API reference lives in the repository, versioned alongside the code it documents:

- [API Reference index](https://github.com/aitan75/jqapi/blob/main/docs/api/README.md)
  - [Quantum](https://github.com/aitan75/jqapi/blob/main/docs/api/quantum.md) — `Circuit`, `QuantumRegister`, `Qubit` and gates
  - [Gates](https://github.com/aitan75/jqapi/blob/main/docs/api/gates.md)
  - [Simulator](https://github.com/aitan75/jqapi/blob/main/docs/api/simulator.md)
  - [Math](https://github.com/aitan75/jqapi/blob/main/docs/api/math.md)

This page is intentionally a pointer, not a copy — the reference evolves with the code and is reviewed in the same pull requests, so keeping a single source of truth avoids the two drifting apart.
```

- [ ] **Step 2: Verify**

Confirm all five linked paths exist on `main` in the jqapi repo (they were listed via `git ls-tree origin/main` during design: `docs/api/README.md`, `docs/api/gates.md`, `docs/api/math.md`, `docs/api/quantum.md`, `docs/api/simulator.md`).

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add API-Reference.md
```

---

### Task 5: Draft `User-Manual.md` (link-only)

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/User-Manual.md`

**Interfaces:**
- Consumes: `docs/manual/README.md`, `docs/manual/concepts.md`, `docs/manual/examples.md` (main repo, `main` branch); `Getting-Started` filename (Task 3).
- Produces: `User-Manual.md`.

- [ ] **Step 1: Write the file**

```markdown
# User Manual

The task-oriented user manual lives in the repository:

- [User Manual index](https://github.com/aitan75/jqapi/blob/main/docs/manual/README.md) — what jqapi is, requirements, installation, your first program
- [Core concepts](https://github.com/aitan75/jqapi/blob/main/docs/manual/concepts.md) — qubits, gates, circuits, levels, registers, the simulator, measurement
- [Worked examples](https://github.com/aitan75/jqapi/blob/main/docs/manual/examples.md) — Bell state, two-coin flip, quantum teleportation, Deutsch–Jozsa, Grover search

If you're brand new, start with [Getting Started](Getting-Started) instead — it gets you to a running program faster.
```

- [ ] **Step 2: Verify**

Confirm all three linked paths exist on `main` (`docs/manual/README.md`, `docs/manual/concepts.md`, `docs/manual/examples.md`).

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add User-Manual.md
```

---

### Task 6: Draft `Architecture.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/Architecture.md`

**Interfaces:**
- Consumes: `docs/api/quantum.md` (main repo); `API-Reference` filename (Task 4); README's "Measured ceilings" anchor; issue #15.
- Produces: `Architecture.md`.

- [ ] **Step 1: Write the file**

```markdown
# Architecture

A short internal-design overview. For usage, see the [API Reference](API-Reference).

## Core types

- **`Circuit`** — a sequence of `CircuitLevel`s, each holding one or more gates. Accepts a `JQAPIConfig` to bound the maximum number of qubits.
- **`QuantumRegister`** — holds the `2^n`-amplitude state vector for `n` qubits. Also accepts a `JQAPIConfig`, mirroring `Circuit`.
- **`LocalSimulator`** (`QuantumSimulator` implementation) — executes a `Circuit` against a `QuantumRegister` by applying each gate's operator directly to the state vector, level by level.
- **`JQAPIConfig`** — bounds resource usage (`maxQubits`, `maxSearchQubits`) to protect against the exponential (`2^n`) memory growth of state vectors. Configurable per-instance or via JVM system properties; out-of-range configuration throws `JQApiLimitException`.

## Why gates apply directly to the state vector

Building the full `2^n x 2^n` operator matrix for a circuit level would itself cost `O(4^n)` memory, defeating the purpose of bounding `n`. Instead, `LocalSimulator` applies each gate's effect directly to the `2^n`-sized state vector, so a 20-qubit circuit runs in a few seconds instead of exhausting memory. This also means gates can act on arbitrary, non-adjacent qubits without materializing a larger matrix.

## Where the exception is: Grover search

`Algorithm.search` (Grover search) currently *does* build a dense `2^n x 2^n` oracle matrix, so its practical qubit ceiling is much lower than a plain register's (see the [measured ceilings](https://github.com/aitan75/jqapi/blob/main/README.md#measured-ceilings-benchmark) in the README). This is tracked in [issue #15](https://github.com/aitan75/jqapi/issues/15).

## Conventions

- Qubit `0` is the most significant bit of the state index.
- In multi-qubit gates, the first declared qubit is the most significant (e.g. the control in `ControlledNot(control, target)`).

See the [API Reference](API-Reference) for the full class-by-class detail behind this overview.
```

- [ ] **Step 2: Verify**

Confirm `issue #15` still refers to Grover search / dense matrices (it was open and unstarted as of this plan). Confirm the `#measured-ceilings-benchmark` anchor matches the `### Measured ceilings (benchmark)` heading in `README.md` (GitHub slugifies headings to lowercase, spaces→hyphens, parens stripped).

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add Architecture.md
```

---

### Task 7: Draft `Contributing.md` (link-only)

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/Contributing.md`

**Interfaces:**
- Consumes: `README.md#contributing` section (main repo).
- Produces: `Contributing.md`.

- [ ] **Step 1: Write the file**

```markdown
# Contributing

Contribution guidelines live in the repository README, next to the code they govern:

- [Contributing section](https://github.com/aitan75/jqapi#contributing) — pull request expectations, test requirements
- Issue guidelines — every issue needs a matching **type**, **title prefix**, and **label**:

  | Type | Title prefix | Label | Use for |
  |------|--------------|-------|---------|
  | Feature | `[FEATURE] - ` | `enhancement` | New functionality or capability |
  | Bug | `[BUG] - ` | `bug` | Defects and robustness/edge-case fixes |
  | Security | `[SECURITY] - ` | `security` | Security hardening / DevSecOps |

  A good issue includes a **Summary**, **Motivation**, **Proposed solution**, **Acceptance criteria**, and **References** to affected code. See the [README's Contributing section](https://github.com/aitan75/jqapi#contributing) for ready-to-follow example issues.

- [Open issues](https://github.com/aitan75/jqapi/issues)
```

- [ ] **Step 2: Verify**

Confirm the type/prefix/label table matches `README.md`'s `## Contributing` → `### Opening issues` table verbatim (it was read from `origin/main:README.md` during planning — 3 rows: Feature/Bug/Security).

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add Contributing.md
```

---

### Task 8: Draft `CI-and-Quality.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/CI-and-Quality.md`

**Interfaces:**
- Consumes: `.github/workflows/build.yml`, `.github/workflows/codeql.yml`, `.github/workflows/nvd-cache-warm.yml` (main repo, `main` branch, all merged as of this plan).
- Produces: `CI-and-Quality.md`.

- [ ] **Step 1: Write the file**

```markdown
# CI and Quality

Every push to `main` and every pull request runs the [Build workflow](https://github.com/aitan75/jqapi/actions/workflows/build.yml):

1. **Build and test** — `mvn -B verify`, including the JUnit test suite and JaCoCo coverage instrumentation.
2. **SonarCloud analysis** — static analysis and coverage reporting to the [SonarCloud dashboard](https://sonarcloud.io/summary/new_code?id=aitan75_jqapi). Runs only when a `SONAR_TOKEN` secret is available (e.g. skipped on forked-repo pull requests).
3. **OWASP Dependency-Check (SCA)** — scans dependencies against the NVD vulnerability database. Non-blocking (`continue-on-error`) and capped at 15 minutes, since NVD's own API can be slow; a report is uploaded as a build artifact when it completes.

A separate [CodeQL workflow](https://github.com/aitan75/jqapi/actions/workflows/codeql.yml) runs static application security testing (SAST) on push, pull request, and a weekly schedule.

A [scheduled NVD cache warm-up workflow](https://github.com/aitan75/jqapi/actions/workflows/nvd-cache-warm.yml) refreshes the shared OWASP Dependency-Check data cache every 6 hours, so the PR-gating build usually only needs a fast incremental update rather than a slow cold sync.

## Quality gates

- There is currently **no enforced coverage threshold** — coverage is tracked and visible via the badge and SonarCloud, not gating.
- OWASP Dependency-Check is visibility-only (non-blocking); CVSS ≥ 7 findings are reported but don't fail the build.
- All GitHub Actions are pinned to a commit SHA (not a floating tag) for supply-chain integrity.
```

- [ ] **Step 2: Verify**

Confirm the three build.yml steps, the CodeQL schedule (`cron: '0 6 * * 1'`, weekly), and the nvd-cache-warm schedule (`cron: '0 */6 * * *'`, every 6h) match the actual workflow files on `main` at review time — re-read them if CI has changed since this plan was written.

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add CI-and-Quality.md
```

---

### Task 9: Draft `FAQ.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/FAQ.md`

**Interfaces:**
- Consumes: `Contributing`, `Architecture`, `CI-and-Quality` filenames (Tasks 7, 6, 8); issues #16, #15; `docs/manual/examples.md`.
- Produces: `FAQ.md`.

- [ ] **Step 1: Write the file**

```markdown
# FAQ

**Why is `QuantumRegister.forSimulation(...)` deprecated?**
`Circuit` and `QuantumRegister` now both accept a `JQAPIConfig` directly via their constructors, so config injection works identically for both. The `forSimulation(...)` static factories are kept as thin, working wrappers for backward compatibility, but new code should use `new QuantumRegister(size, config)` instead. See [issue #16](https://github.com/aitan75/jqapi/issues/16).

**Why isn't there an enforced code-coverage threshold?**
Coverage is tracked and visible (badge + SonarCloud dashboard) but not gating, so it doesn't block contributions while the test suite is still maturing. See [CI and Quality](CI-and-Quality).

**Why does Grover search have a much lower qubit ceiling than a plain register?**
`Algorithm.search` builds a dense `2^n x 2^n` oracle matrix, unlike the rest of the simulator, which applies gates directly to the state vector. This is tracked in [issue #15](https://github.com/aitan75/jqapi/issues/15). See [Architecture](Architecture).

**How do I report a bug or request a feature?**
Open an issue following the guidelines on the [Contributing](Contributing) page — every issue needs a matching type, title prefix, and label.

**Where do I find runnable examples?**
The [User Manual's worked examples](https://github.com/aitan75/jqapi/blob/main/docs/manual/examples.md) page, and the tests under `src/test/java/org/aitan/jqapi/test/` in the repository.
```

- [ ] **Step 2: Verify**

Confirm issue #16 is closed (it was merged as PR #25, `504c48f`, prior to this plan) — the FAQ entry describes the shipped behavior, not a pending change, so this is safe to state as fact. Confirm issue #15 is still open.

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add FAQ.md
```

---

### Task 10: Draft `_Sidebar.md`

**Files:**
- Create: `/Users/aitan/workspace/jqapi.wiki/_Sidebar.md`

**Interfaces:**
- Consumes: all 8 page filenames from Tasks 2–9.
- Produces: `_Sidebar.md` (GitHub's reserved filename for the persistent nav panel shown on every wiki page).

- [ ] **Step 1: Write the file**

```markdown
### jqapi Wiki

- [Home](Home)
- [Getting Started](Getting-Started)
- [API Reference](API-Reference)
- [User Manual](User-Manual)
- [Architecture](Architecture)
- [Contributing](Contributing)
- [CI and Quality](CI-and-Quality)
- [FAQ](FAQ)
```

- [ ] **Step 2: Verify**

Confirm this lists exactly the 8 filenames created by Tasks 2–9, in the same order as `Home.md`'s "Where to go next" list, with no extra or missing entries.

- [ ] **Step 3: Stage locally (no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add _Sidebar.md
```

- [ ] **Step 4: Commit locally (still no push)**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git commit -m "Add jqapi wiki: Home, Getting Started, API Reference, User Manual, Architecture, Contributing, CI and Quality, FAQ, sidebar"
```

---

### Task 11: Present all pages for user review

**Files:**
- None — this is a review checkpoint, not a code change.

**Interfaces:**
- Consumes: the local commit from Task 10, Step 4.
- Produces: explicit user approval to push (or a list of requested changes).

- [ ] **Step 1: Show the full content of all 9 files to the user**

```bash
cd /Users/aitan/workspace/jqapi.wiki && for f in Home.md Getting-Started.md API-Reference.md User-Manual.md Architecture.md Contributing.md CI-and-Quality.md FAQ.md _Sidebar.md; do echo "=== $f ==="; cat "$f"; echo; done
```

Present this output to the user (per the earlier commitment: "Ti mostrerò tutte le pagine per revisione prima di pushare").

- [ ] **Step 2: Wait for explicit approval**

Do not proceed to Task 12 until the user approves. If they request changes, amend the relevant file(s) from Tasks 2–10, re-stage, and amend the local commit:

```bash
cd /Users/aitan/workspace/jqapi.wiki && git add -A && git commit --amend --no-edit
```

Return to Step 1 to re-present.

---

### Task 12: Push the wiki and verify it's live

**Files:**
- None — this pushes the already-committed content from Task 10.

**Interfaces:**
- Consumes: the approved local commit from Task 11.
- Produces: a live, published GitHub Wiki at `https://github.com/aitan75/jqapi/wiki`.

- [ ] **Step 1: Push**

```bash
cd /Users/aitan/workspace/jqapi.wiki && git push origin master
```

(GitHub wikis use `master` as the default branch name regardless of the main repo's default branch — confirm with `git branch` in the clone before pushing if unsure.)

- [ ] **Step 2: Verify the sidebar renders**

Open `https://github.com/aitan75/jqapi/wiki` and confirm the sidebar (from `_Sidebar.md`) appears with all 8 entries, and the default landing page is `Home`.

- [ ] **Step 3: Verify every internal link resolves**

Click through all 8 sidebar entries once each. Expected: no 404s. Then click every external link on each page (`docs/api/*`, `docs/manual/*`, `README.md#contributing`, `README.md#measured-ceilings-benchmark`, the three workflow URLs, the SonarCloud dashboard, issues #15/#16) and confirm each resolves to the intended target.

---

### Task 13: Link the Wiki from README.md

**Files:**
- Modify: `README.md` (main repo, branch `feature/issue-20-github-wiki`)

**Interfaces:**
- Consumes: the live Wiki URL from Task 12.
- Produces: a merged PR adding the Wiki link to `main`.

- [ ] **Step 1: Fix branch upstream tracking**

The worktree's branch currently tracks `origin/main` (a side effect of `git worktree add ... -b feature/issue-20-github-wiki origin/main`). Fix this on first push:

```bash
cd /Users/aitan/workspace/jqapi-worktrees/feature-issue-20-github-wiki
git branch --unset-upstream feature/issue-20-github-wiki 2>/dev/null; true
```

- [ ] **Step 2: Edit `README.md`**

In `/Users/aitan/workspace/jqapi-worktrees/feature-issue-20-github-wiki/README.md`, find the `## Documentation` section:

```markdown
## Documentation

- **User Manual** — start here: [overview & first program](docs/manual/README.md), [core concepts](docs/manual/concepts.md), [worked examples](docs/manual/examples.md)
- **API Reference** — [index](docs/api/README.md): [quantum](docs/api/quantum.md), [gates](docs/api/gates.md), [simulator](docs/api/simulator.md), [math](docs/api/math.md)
```

Add a third bullet immediately after:

```markdown
- **Wiki** — [project wiki](https://github.com/aitan75/jqapi/wiki) for a guided overview, architecture notes, CI/quality explainer, and FAQ
```

- [ ] **Step 3: Verify**

```bash
grep -A4 '## Documentation' /Users/aitan/workspace/jqapi-worktrees/feature-issue-20-github-wiki/README.md
```

Expected: the new Wiki bullet appears as the third line under `## Documentation`, and the two existing bullets are unchanged.

- [ ] **Step 4: Commit and push**

```bash
cd /Users/aitan/workspace/jqapi-worktrees/feature-issue-20-github-wiki
git add README.md
git commit -m "docs: link the GitHub Wiki from README"
git push -u origin feature/issue-20-github-wiki
```

- [ ] **Step 5: Open the PR and merge following the established pattern**

Open a PR from `feature/issue-20-github-wiki` to `main` (title referencing issue #20), wait for the `build` check to go green, then squash-merge and delete the branch — same flow used for issues #2/#4/#10/#11/#16.

---

## Self-Review Notes

- **Spec coverage:** all three spec sections are covered — relationship to `docs/` (Global Constraints + every link-only page), the 8-page structure + sidebar (Tasks 2–10), publishing mechanics (Tasks 1, 11, 12), verification (Task 12 Steps 2–3). The spec's out-of-scope items (no Wiki CI, no docs/ migration) are respected — no task adds either.
- **Placeholder scan:** none found — every task has complete, copy-pasteable content.
- **Type/name consistency:** all internal link targets (`Getting-Started`, `API-Reference`, `User-Manual`, `Architecture`, `Contributing`, `CI-and-Quality`, `FAQ`, `Home`) are spelled identically everywhere they appear (`Home.md`, `_Sidebar.md`, and cross-links between pages) and match the filenames created in Tasks 2–10.
