---
name: dependency-pin-upgrade-blocker
description: Prevent upgrades to pinned dependencies (React 18, Vite 5, Tailwind 4) and enforce Node >= 20. Use when asked to update dependencies or follow upgrade guides.
---

# Dependency Pin Guard

## Pinned Versions

| Package      | Pinned Major | Current |
| ------------ | ------------ | ------- |
| React        | 18.x         | ^18.2.0 |
| React DOM    | 18.x         | ^18.2.0 |
| Vite         | 5.x          | ^5.0.0  |
| Tailwind CSS | 4.x          | ^4.0.0  |
| Pixi.js      | 8.x          | ^8.0.0  |
| Node.js      | >= 20        | —       |

## Key Files

- `package.json` — dependency versions and lockfile
- `AGENTS.md` — Critical Constraints section lists pinned versions
- `vite.config.js` — Vite configuration (must stay v5 compatible)

## Workflow

1. Check `package.json` for any version changes beyond the pinned majors listed above.
2. Block upgrades to React 19+, Vite 6+, Tailwind 5+, or Pixi.js 9+.
3. Remind that Node >= 20 is required (check `.nvmrc` or `engines` if present).
4. Allow patch/minor upgrades within pinned majors (e.g., React 18.2.0 → 18.3.x is OK).
5. For Tailwind: ensure v4 syntax is used (`@import "tailwindcss"`, not `@tailwind base`).

## Output

- Provide a clear warning and the allowed version boundaries.

## Related Skills

- `convention-keeper-brutalist-ui` — Tailwind v4 syntax depends on the pinned version
- `ci-hardener` — CI should enforce version constraints
