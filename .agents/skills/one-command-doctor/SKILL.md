---
name: one-command-doctor
description: diagnose environmental and build issues. Trigger when the repo is broken, tests fail mysteriously, or setup is needed. Checks Node version, dependencies, and build status. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Diagnose environment/setup breakage quickly and return one-command recovery steps where possible.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'diagnostics'
  keywords: ['diagnostics', 'health-check', 'troubleshooting']
  maturity: 'stable'
license: 'MIT. See /LICENSE for terms'
---

# One-Command Doctor

Quickly diagnose the health of the repository and development environment.

## Usage

Run the bundled diagnostic script (using `bash` or `sh` to ensure execution):

```bash
bash .agents/skills/one-command-doctor/scripts/doctor.sh
```

## Workflow

1.  **Environment Check**
    - Node version (>= 22.13.0).
    - pnpm version.
    - Lockfile sync status.

2.  **Build Check**
    - Does `pnpm install --frozen-lockfile` work?
    - Does `pnpm run build` succeed?

3.  **Lint/Test Check**
    - Basic linting pass.
    - Smoke tests.

## Diagnosis & Fixes

- **Node Version Mismatch**: "Please use `nvm use` to switch to Node 22.13.0+."
- **Lockfile Error**: "Run `pnpm install --frozen-lockfile` to restore clean state."
- **Build Fail**: "Check `vite.config.js` or missing assets."

## Example

**Input**: "I can't start the dev server."

**Action**:
Run `.agents/skills/one-command-doctor/scripts/doctor.sh`.

**Output**:

```text
[FAIL] Node version is v16.14.0. Required: >=22.13.0.
[PASS] Lockfile is in sync.
```

"Your Node version is too old. Run `nvm install 22.13.0 && nvm use 22.13.0`."

_Skill sync: compatible with React 19.2.4 / Vite 8.0.1 baseline as of 2026-03-18._
