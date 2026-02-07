---
name: ci-hardener
description: Improve CI reliability and speed (caching, parallelism, clearer failures). Use when CI is slow, flaky, or missing checks.
---

# CI Hardener

## Key Files

- `.github/workflows/super-linter.yml` — MegaLinter-style linting CI
- `.github/workflows/lint-fix-preview.yml` — lint fix preview workflow
- `.github/workflows/deploy.yml` — production deployment workflow
- `package.json` — `scripts.lint`, `scripts.test`, `scripts.build` define the quality gate

## Workflow

1. Read all files in `.github/workflows/` to understand current CI setup.
2. Check for `npm ci` caching (node_modules or npm cache) — add if missing.
3. Look for parallelization opportunities (lint and test can run concurrently).
4. Ensure the quality gate order is enforced: lint → test → build.
5. Add timeout limits to prevent hung jobs.
6. Summarize changes and expected speed/reliability impact.

## Output

- Provide updated workflow changes and reasoning.

## Related Skills

- `one-command-quality-gate` — the local equivalent of CI checks
- `perf-budget-enforcer` — for adding bundle size checks to CI
- `mega-lint-snapshot` — for comprehensive linting diagnostics
