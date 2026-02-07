---
name: tailwind-v4-css-variables-enforcer
description: Audit UI changes for Tailwind v4 class syntax and CSS-variable color usage. Use when checking design-system violations, hardcoded colors, or Tailwind syntax regressions.
---

# Enforce Tailwind v4 + CSS Variables

## Workflow

1. Scan for hardcoded colors (hex, rgb, hsl, Tailwind palette classes).
2. Scan for Tailwind v3-style CSS variable usage (e.g., `bg-[var(--...)]`).
3. Replace violations with v4 variable syntax like `bg-(--void-black)` and `text-(--toxic-green)`.

## Command

- Prefer the bundled script: `./.agents/skills/tailwind-v4-css-variables-enforcer/scripts/audit-tailwind-v4.sh`

## Output

- Report any matches with file paths and line numbers.
- Suggest compliant replacements.
