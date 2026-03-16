<!-- TODO: Implement this -->
---
name: dependency-pin-upgrade-blocker
description: enforce pinned dependency versions. Trigger when asked to upgrade packages, install new dependencies, or when reviewing package.json changes.
---

# Dependency Pin Guard

Strictly enforce pinned versions for critical dependencies to ensure stability and compatibility.

## Pinned Versions

| Package       | Pinned Major | Policy              |
| ------------- | ------------ | ------------------- |
| React         | 19.x         | **BLOCK** v20+      |
| React DOM     | 19.x         | **BLOCK** v20+      |
| Vite          | 7.x          | **BLOCK** v8+       |
| Tailwind CSS  | 4.x          | **BLOCK** v5+       |
| Framer Motion | 12.x         | **BLOCK** v13+      |
| Tone.js       | 15.x         | **BLOCK** v16+      |
| Pixi.js       | 8.x          | **BLOCK** v9+       |
| Node.js       | >= 22.13.0   | **BLOCK** < 22.13.0 |

## Workflow

1.  **Check `package.json`**
    Compare proposed changes against the pinned table.
    - _Minor/Patch upgrades_: Allowed (e.g., `18.2.0` -> `18.3.0`).
    - _Major upgrades_: **Blocked** unless explicitly authorized by a separate migration plan.

2.  **Verify Compatibility**
    - **Tailwind v4**: Must use `@import "tailwindcss"`. No `@tailwind` directives.
    - **Vite v7**: Ensure config and plugins stay v7-compatible.
    - **Pixi v8**: Ensure code uses v8 API (no `PIXI.InteractionManager`, use `eventMode`).

3.  **Validate Node Version**
    Ensure `.nvmrc` and `engines` both require Node >= 22.13.0.

## Example

**Input**: "Upgrade all packages to latest."

**Action**:

1.  Check `npm outdated`.
2.  See `react` wants to go to `20.0.0` (hypothetically).
3.  **Block**: "React 20 is not supported yet. Keeping at 19.x."
4.  See `lodash` wants to go to `4.17.21`.
5.  **Allow**: "Updating lodash."

**Output**:
"Upgraded minor dependencies. Held back React, Vite, and Pixi to pinned major versions to preserve stability."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-03-09._
