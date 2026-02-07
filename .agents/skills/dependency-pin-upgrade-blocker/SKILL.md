---
name: dependency-pin-upgrade-blocker
description: Prevent upgrades to pinned dependencies (React 18, Vite 5, Tailwind 4) and enforce Node >= 20. Use when asked to update dependencies or follow upgrade guides.
---

# Dependency Pin Guard

## Workflow

1. Check `package.json` and lockfile for version changes.
2. Block updates to React, Vite, and Tailwind beyond pinned major versions.
3. Remind that Node >= 20 is required.
4. Suggest safe alternatives (e.g., patch/minor upgrades only when allowed).

## Output

- Provide a clear warning and the allowed version boundaries.
