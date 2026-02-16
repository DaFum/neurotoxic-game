---
name: ci-hardener
description: improve CI reliability, speed, and clarity. Trigger when CI is slow, flaky, fails silently, or needs optimization. focus on GitHub Actions workflows.
---

# CI Hardener

Optimize and harden Continuous Integration (CI) workflows.

## Workflow

1.  **Audit Current Workflows**
    List all workflows in `.github/workflows/`. Identify:
    *   **Triggers**: Are they correct (push, pull_request)?
    *   **Jobs**: Are they parallelized?
    *   **Steps**: Are they caching dependencies?

2.  **Apply Hardening Patterns**
    *   **Caching**: Use `actions/setup-node` with `cache: 'npm'`.
    *   **Timeouts**: Set `timeout-minutes` on every job to prevent hangs.
    *   **Concurrency**: Use `concurrency` groups to cancel outdated runs on PRs.
    *   **Permissions**: Use least-privilege `permissions` blocks.

3.  **Optimize Speed**
    *   Run independent jobs (Lint, Test) in parallel.
    *   Make `Build` depend on `Test` and `Lint`.
    *   Use `npm ci` instead of `npm install` for deterministic installs.

4.  **Verify**
    Ensure the changes are valid YAML and follow GitHub Actions syntax.

## Checklist

- [ ] `timeout-minutes` is set.
- [ ] `concurrency` is set for PRs.
- [ ] `actions/checkout` uses `fetch-depth: 0` if needed (otherwise default is 1).
- [ ] `npm ci` is used.
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      # Cache node_modules for other jobs if needed, or rely on setup-node cache
```

**Output**:
"Added `actions/setup-node` with caching to the install step. This will speed up subsequent runs by reusing the npm cache."
