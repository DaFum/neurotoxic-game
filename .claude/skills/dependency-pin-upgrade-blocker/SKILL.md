---
name: dependency-pin-upgrade-blocker
description: Enforce pinned dependency versions. Trigger when asked to upgrade packages, install new dependencies, or when reviewing package.json changes.
---

# Dependency Pin Guard

Strictly enforce pinned versions for critical dependencies to ensure stability and compatibility.

## Pinned Versions

| Package      | Pinned Major | Policy |
| ------------ | ------------ | ------ |
| React        | 18.x         | **BLOCK** v19+ |
| React DOM    | 18.x         | **BLOCK** v19+ |
| Vite         | 5.x          | **BLOCK** v6+  |
| Tailwind CSS | 4.x          | **BLOCK** v5+  |
| Pixi.js      | 8.x          | **BLOCK** v9+  |
| Node.js      | >= 20        | **BLOCK** < 20 |

## Workflow

1.  **Check `package.json`**
    Compare proposed changes against the pinned table.
    *   *Minor/Patch upgrades*: Allowed (e.g., `18.2.0` -> `18.3.0`).
    *   *Major upgrades*: **Blocked** unless explicitly authorized by a separate migration plan.

2.  **Verify Compatibility**
    *   **Tailwind v4**: Must use `@import "tailwindcss"`. No `@tailwind` directives.
    *   **Vite v5**: Ensure config uses v5 plugins.
    *   **Pixi v8**: Ensure code uses v8 API (no `PIXI.InteractionManager`, use `eventMode`).

3.  **Validate Node Version**
    Ensure `.nvmrc` or `engines` field specifies Node >= 20.

## Example

**Input**: "Upgrade all packages to latest."

**Action**:
1.  Check `npm outdated`.
2.  See `react` wants to go to `19.0.0` (hypothetically).
3.  **Block**: "React 19 is not supported yet. Keeping at 18.x."
4.  See `lodash` wants to go to `4.17.21`.
5.  **Allow**: "Updating lodash."

**Output**:
"Upgraded minor dependencies. Held back React, Vite, and Pixi to pinned major versions to preserve stability."
