---
name: tailwind-v4-css-variables-enforcer
description: Audit UI changes for Tailwind v4 class syntax and CSS-variable color usage. Use when checking design-system violations, hardcoded colors, or Tailwind syntax regressions.
---

# Enforce Tailwind v4 + CSS Variables

## Key Files

- `src/index.css` — CSS variable definitions (`--toxic-green`, `--void-black`, etc.)
- `src/ui/` — primary location for UI components using Tailwind classes
- `src/components/` — game components that may use Tailwind
- `src/scenes/` — scene components with styled markup

## Correct Syntax Examples

| Wrong (v3 / hardcoded) | Correct (v4) |
|------------------------|--------------|
| v3 bracket-variable syntax (avoid) | `bg-(--void-black)` |
| v3 bracket-variable syntax (avoid) | `text-(--toxic-green)` |
| `bg-gray-900` | `bg-(--void-black)` |
| `#00ff00` | `var(--toxic-green)` |
| `@tailwind base` | `@import "tailwindcss"` |

## Workflow

1. Scan `src/` for hardcoded colors: hex (`#xxx`), `rgb()`, `hsl()`, Tailwind palette classes (`bg-gray-*`, `text-red-*`).
2. Scan for Tailwind v3-style bracket-variable usage and replace with v4 `bg-(--token)` syntax.
3. Check `src/index.css` for the authoritative list of CSS variables.
4. Replace violations with v4 variable syntax using the examples above.

## Command

- Prefer the bundled script: `./.agents/skills/tailwind-v4-css-variables-enforcer/scripts/audit-tailwind-v4.sh`

## Output

- Report any matches with file paths and line numbers.
- Suggest compliant replacements using project CSS variables.

## Related Skills

- `convention-keeper-brutalist-ui` — broader UI convention enforcement
- `dependency-pin-upgrade-blocker` — ensures Tailwind stays at v4
