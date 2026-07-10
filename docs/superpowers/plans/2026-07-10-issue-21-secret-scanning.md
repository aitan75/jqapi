# Secret Scanning (gitleaks) — Issue #21 Execution Plan

**Goal:** Add automated secret scanning (gitleaks) as a CI gate on push and pull_request, closing #21.

**Constraints:** action pinned by commit SHA (repo convention); least-privilege permissions; fail the build on a detected secret; handle false positives via allowlist/baseline, not by disabling the scan. No new runtime deps (CI-only).

## Decisions

- **Dedicated workflow** `.github/workflows/gitleaks.yml` (separate concern, like `codeql.yml`), not folded into `build.yml`.
- **Action**: `gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7` (v2.3.9), pinned by SHA. Free for personal accounts / public repos (a `GITLEAKS_LICENSE` is required only for GitHub Organizations, which does not apply here).
- **Checkout**: `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` (v7.0.0, the SHA already used in the repo), `fetch-depth: 0` so gitleaks scans full history, `persist-credentials: false`.
- **Permissions**: `contents: read` only. PR comments disabled (`GITLEAKS_ENABLE_COMMENTS: false`) to avoid needing `pull-requests: write`; no SARIF upload, so no `security-events: write`.
- **Baseline / FP handling**: `.gitleaks.toml` with `[extend] useDefault = true` and an `[allowlist]`. gitleaks 8.x rejects an empty allowlist, so it carries one real, legitimate entry: the `.mvn/checksums/checksums-central.sha256` lockfile (SHA-256 hashes, not secrets). Future FPs are added here (paths/regexes/commits), never by disabling the scan.
- **Fail on detection**: default gitleaks-action behavior (non-zero exit) fails the check.

## Steps (executed)

1. `.github/workflows/gitleaks.yml` — dedicated workflow (triggers, permissions, pinned actions, config env).
2. `.gitleaks.toml` — extend default + allowlist for the checksums lockfile.
3. Local verification with the gitleaks 8.30.1 CLI on the full history (111 commits): **0 findings**, config parses cleanly.
4. CI is the live gate: the `Secret scanning` workflow runs on push/PR.

## Validation

- `gitleaks detect --source=<repo> --config=.gitleaks.toml` → `no leaks found`, exit 0 (run locally before pushing).
- Workflow YAML and no `run:` steps consuming untrusted input (no injection surface).

## Acceptance criteria (#21)

- [x] Secret scanning runs on every push and pull_request.
- [x] Action pinned by commit SHA.
- [x] Least-privilege permissions block (`contents: read`).
- [x] False positives handled via allowlist/baseline (`.gitleaks.toml`), not by disabling the scan.
