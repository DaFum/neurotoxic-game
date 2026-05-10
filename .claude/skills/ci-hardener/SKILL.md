---
name: ci-hardener
description: improve CI reliability, speed, and clarity. Trigger when CI is slow, flaky, fails silently, or needs optimization. focus on GitHub Actions workflows.
---

# CI Hardener

Optimize and harden Continuous Integration (CI) workflows.

## Workflow

1.  **Audit Current Workflows**
    List all workflows in `.github/workflows/`. Identify:
    - **Triggers**: Are they correct (push, pull_request)?
    - **Jobs**: Are they parallelized?
    - **Steps**: Are they caching dependencies?

2.  **Apply Hardening Patterns**
    - **Caching**: Use `actions/setup-node` with `cache: 'pnpm'` and `pnpm/action-setup`.
    - **Timeouts**: Set `timeout-minutes` on every job to prevent hangs.
    - **Concurrency**: Use `concurrency` groups to cancel outdated runs on PRs.
    - **Permissions**: Use least-privilege `permissions` blocks.

3.  **Optimize Speed**
    - Run independent jobs (`lint`, Test) in parallel.
    - Make `Build` depend on `Test` and `Lint`.
    - Use `pnpm install --frozen-lockfile` for deterministic installs.

4.  **Verify**
    Ensure the changes are valid YAML and follow GitHub Actions syntax.

## Checklist

- [ ] `timeout-minutes` is set.
- [ ] `concurrency` is set for PRs.
- [ ] `actions/checkout` uses `fetch-depth: 0` if needed (otherwise default is 1).
- [ ] `pnpm install --frozen-lockfile` is used.
- [ ] Node version is pinned (e.g., `node-version: 20`).

## Example

**Input**: "The build takes too long because it installs dependencies in every job."

**Action**:
Update `.github/workflows/main.yml`:

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      # Cache node_modules for other jobs if needed, or rely on setup-node cache
```

**Output**:
"Added `pnpm/action-setup` with caching to the install step. This will speed up subsequent runs by reusing the pnpm cache."

_Skill sync: compatible with React 19.2.5 / Vite 8.0.10 baseline as of 2026-05-10._
