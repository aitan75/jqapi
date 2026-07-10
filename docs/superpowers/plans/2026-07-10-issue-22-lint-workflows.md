# Lint GitHub Actions Workflows — Issue #22 Execution Plan

**Goal:** Add static linting of `.github/workflows/**` (actionlint + zizmor) as a CI gate on push/PR touching workflows, closing #22, so workflow security posture can't silently drift.

**Constraints:** tool versions pinned; findings fail the check; runs on push and pull_request touching `.github/workflows/**`.

## Decisions

- **Dedicated workflow** `.github/workflows/lint-workflows.yml`, `paths: ['.github/workflows/**']` on both `push` and `pull_request`. `permissions: contents: read`; `concurrency` cancel-in-progress.
- **Two complementary linters**:
  - **actionlint 1.7.12** — correctness + shellcheck of `run:` blocks. Installed in a `run:` step by downloading the official release binary and **verifying its SHA-256** (`8aca8db9…a3d8`) before use — no third-party action to trust, pinned by version **and** checksum.
  - **zizmor 1.26.1** — security auditor (template injection, excessive permissions, unpinned uses, artipacked, …). Run via `pipx run --spec zizmor==1.26.1` (version-pinned), with `GH_TOKEN: ${{ github.token }}` for its online audits.
- **Fail on findings**: both tools exit non-zero on findings → the check fails. Default (permissive) severity to start, per the issue; tighten later if noisy.
- No untrusted input in any `run:` step (only `${{ github.token }}` via `env`) → no workflow-injection surface.

## Verification (local, before pushing)

Ran actionlint 1.7.12 and zizmor 1.26.1 over all workflows (`build`, `codeql`, `gitleaks`, `nvd-cache-warm`, and the new `lint-workflows` itself):
- actionlint: **0 findings**.
- zizmor: **No findings** (informational-only suppressed).

The new workflow passes its own linters. CI is the live gate going forward.

## Acceptance criteria (#22)

- [x] Workflow linter runs on every push and pull_request touching `.github/workflows/**`.
- [x] Tool version pinned (actionlint 1.7.12 by version+SHA-256; zizmor 1.26.1 via `pipx run --spec`).
- [x] Findings fail the check (non-zero exit), not just a warning.
