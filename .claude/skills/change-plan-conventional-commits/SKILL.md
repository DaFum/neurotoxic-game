---
name: change-plan-conventional-commits
description: Create a concise change plan, identify risks, and propose Conventional Commit messages and PR checklist items. Use when planning work or drafting commits/PRs.
---

# Change Plan + Conventional Commits

## Commit Prefixes

This repo uses Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

## Key Files

- `AGENTS.md` — Git Workflow section defines branch naming and commit conventions
- `package.json` — `scripts` section lists the quality gate commands

## Workflow

1. Summarize the requested change and identify affected areas (use `src/*/AGENTS.md` for domain routing).
2. List implementation steps with validation checkpoints (`npm run lint`, `npm run test`, `npm run build`).
3. Propose Conventional Commit message(s) — use `feat:` for new features, `fix:` for bugs, `refactor:` for restructuring.
4. Draft a short PR checklist: tests pass, no lint errors, build succeeds, no version pin violations.

## Output

- Provide a plan, commit message(s), and a short checklist.

## Related Skills

- `release-notes-synthesizer` — uses these commit messages to generate changelogs
- `one-command-quality-gate` — for running the validation checkpoints
