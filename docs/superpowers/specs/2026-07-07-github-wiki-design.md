# GitHub Wiki (Issue #20) — Design

## Problem

jqapi currently has no GitHub Wiki. Reference material (API docs, user manual) lives in
`docs/api/*` and `docs/manual/*` inside the repo, versioned with the code. Issue #20 asks
for a Wiki as a more discoverable, browsable entry point for newcomers, without duplicating
existing reference content.

## Relationship between `docs/` and the Wiki

The Wiki is **complementary**, not a replacement:

- `docs/` remains the authoritative, versioned reference (API docs, user manual). It stays
  under PR review and evolves with the code.
- The Wiki is a **landing/orientation layer**: project overview, getting-started, contributing
  workflow, links to CI/quality dashboards, and pointers into `docs/` for anything that's
  already documented there.
- No content is duplicated between the two. Any page whose content already exists in `docs/`
  or `README.md` links to it rather than re-stating it.

## Page structure

Eight Wiki pages plus a curated `_Sidebar.md` for navigation:

| Page | Content source |
|---|---|
| `Home` | New — project overview, quick links to the other pages |
| `Getting-Started` | New — install/build/run instructions, links to `README.md` for prerequisites |
| `API-Reference` | Link-only — points to `docs/api/*` in the repo |
| `User-Manual` | Link-only — points to `docs/manual/*` in the repo |
| `Architecture` | New — short overview of the quantum simulation model (`Circuit`, `QuantumRegister`, `LocalSimulator`, `JQAPIConfig`) |
| `Contributing` | Link-only — points to `CONTRIBUTING.md` (issue guidelines, branch/PR flow) |
| `CI-and-Quality` | New — explains the CI pipeline (build, CodeQL, OWASP Dependency-Check, SonarCloud) and links to the live SonarCloud dashboard |
| `FAQ` | New — short list of common questions (e.g. "why deprecate `forSimulation`?", "how do I report a bug?") |

`_Sidebar.md` lists all eight pages in the order above, under a "jqapi Wiki" heading, so
every page shows consistent navigation.

## Publishing mechanics

GitHub Wikis are backed by a separate git repository (`jqapi.wiki.git`) that does not exist
until its first page is created. There is no REST API to create it.

Steps:
1. User creates the `Home` page once via the GitHub web UI, which initializes `jqapi.wiki.git`.
2. I clone `jqapi.wiki.git` locally.
3. I draft all eight pages plus `_Sidebar.md` and show the full content to the user for review.
4. Only after user approval, I push directly to the wiki repo. Wiki pushes have **no PR/review
   gate** — content goes live immediately, which is why review happens before push, not after.
5. Separately, a small PR (via the existing `feature-issue-20-github-wiki` branch/worktree,
   normal PR flow) adds a link to the Wiki from `README.md`.

## Verification

There is no code to test. Verification is manual, after push:
- Confirm the sidebar renders and every link resolves (no 404s).
- Confirm link-only pages point at the correct current paths in `docs/` and at `CONTRIBUTING.md`.
- Confirm the `README.md` PR's Wiki link resolves once merged.

## Out of scope

- No automation/CI for the Wiki (it isn't code-reviewable content in the same sense).
- No migration of existing `docs/` content into the Wiki — link-only pages avoid duplication.
