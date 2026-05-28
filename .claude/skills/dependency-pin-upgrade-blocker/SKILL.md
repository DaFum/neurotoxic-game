---
name: dependency-pin-upgrade-blocker
description: enforce pinned dependency versions. Trigger when asked to upgrade packages, install new dependencies, or when reviewing package.json changes.
---

# Dependency Pin Guard

## Overview

Strictly enforce pinned versions for critical dependencies to ensure stability and compatibility.

## When to Use

- Trigger when asked to upgrade packages, install new dependencies, or when reviewing package.json changes.

## Quick Reference (Pinned Versions)

| Package       | Pinned Major | Policy              |
| ------------- | ------------ | ------------------- |
| React         | 19.x         | **BLOCK** v20+      |
| React DOM     | 19.x         | **BLOCK** v20+      |
| Vite          | 8.x          | **BLOCK** v9+       |
| Tailwind CSS  | 4.x          | **BLOCK** v5+       |
| Framer Motion | 12.x         | **BLOCK** v13+      |
| Tone.js       | 15.x         | **BLOCK** v16+      |
| Pixi.js       | 8.x          | **BLOCK** v9+       |
| Node.js       | >= 22.13.0   | **BLOCK** < 22.13.0 |

## Quick Reference (Workflow)

1.  **Check `package.json`**
    Compare proposed changes against the pinned table.
    - _Minor/Patch upgrades_: Allowed (e.g., `19.2.0` -> `19.2.6`).
    - _Major upgrades_: **Blocked** unless explicitly authorized by a separate migration plan.

2.  **Verify Compatibility**
    - **Tailwind v4**: Must use `@import "tailwindcss"`. No `@tailwind` directives.
    - **Vite v8**: Ensure config and plugins stay v8-compatible.
    - **Pixi v8**: Ensure code uses v8 API (no `PIXI.InteractionManager`, use `eventMode`).

3.  **Validate Node Version**
    Ensure `.nvmrc` and `engines` both require Node >= 22.13.0.

## Common Mistakes

- Upgrading packages without explicitly checking the pinned versions table.
- Relying on `npm update` instead of `pnpm` which can break the lockfile consistency.

## Red Flags - STOP and Start Over

- Running bulk updates (e.g., `pnpm update -i`) without targeted constraints.
- Modifying `package.json` to bump major versions of core libraries (React, Vite, Pixi) without explicit architectural authorization.

## Example

**Input**: "Upgrade all packages to latest."

**Action**:

1.  Check `pnpm outdated`.
2.  See `react` wants to go to `20.0.0` (hypothetically).
3.  **Block**: "React 20 is not supported yet. Keeping at 19.x."
4.  See `lodash` wants to go to `4.17.21`.
5.  **Allow**: "Updating lodash."

**Output**:
"Upgraded minor dependencies. Held back React, Vite, and Pixi to pinned major versions to preserve stability."

_Skill sync: compatible with React 19.2.6 / Vite 8.0.10 / Tailwind 4.2.4 baseline as of 2026-05-20._
