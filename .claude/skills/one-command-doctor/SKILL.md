---
name: one-command-doctor
description: diagnose environmental and build issues. Trigger when the repo is broken, tests fail mysteriously, or setup is needed. Checks Node version, dependencies, and build status.
---

# One-Command Doctor

Quickly diagnose the health of the repository and development environment.

## Usage

Run the bundled diagnostic script (using `bash` or `sh` to ensure execution):

```bash
bash .claude/skills/one-command-doctor/scripts/doctor.sh
```

## Workflow

1.  **Environment Check**
    - Node version (>= 20).
    - pnpm version.
    - Lockfile sync status.

2.  **Build Check**
    - Does `pnpm install` work?
    - Does `pnpm run build` succeed?

3.  **Lint/Test Check**
    - Basic linting pass.
    - Smoke tests.

## Diagnosis & Fixes

- **Node Version Mismatch**: "Please use `nvm use` to switch to Node 20+."
- **Lockfile Error**: "Run `pnpm install --frozen-lockfile` to restore clean state."
- **Build Fail**: "Check `vite.config.js` or missing assets."

## Example

**Input**: "I can't start the dev server."

**Action**:
Run `.claude/skills/one-command-doctor/scripts/doctor.sh`.

**Output**:

```text
[FAIL] Node version is v16.14.0. Required: >=20.
[PASS] Lockfile is in sync.
```

"Your Node version is too old. Run `nvm install 20 && nvm use 20`."

_Skill sync: compatible with React 19.2.6 / Vite 8.0.10 / Tailwind 4.2.4 baseline as of 2026-05-20._
