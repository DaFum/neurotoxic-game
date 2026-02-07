---
name: convention-keeper-brutalist-ui
description: Enforce brutalist UI conventions, naming, and import order for components. Use when refactoring UI or aligning components with design system guidance.
---

# Brutalist UI Convention Keeper

## Key Files

- `src/ui/` — all UI components (`HUD.jsx`, `EventModal.jsx`, `GlitchButton.jsx`, `ToastOverlay.jsx`, etc.)
- `src/ui/shared/` — reusable shared components (`SettingsPanel.jsx`, `VolumeSlider.jsx`, `index.jsx`)
- `src/ui/AGENTS.md` — authoritative UI conventions and styling rules
- `src/index.css` — CSS variable definitions (`--toxic-green`, `--void-black`, etc.)
- `src/components/` — game components that must follow the same conventions

## Workflow

1. Verify UI components use CSS variables (`var(--toxic-green)`, `var(--void-black)`) — never hardcoded hex/rgb/hsl.
2. Check for Tailwind v4 syntax: use `bg-(--void-black)` not `bg-[var(--void-black)]` (v3 style).
3. Prefer shared components from `src/ui/shared/` — check `index.jsx` exports before creating new ones.
4. Consult `src/ui/AGENTS.md` for component-specific naming and styling rules.
5. Maintain import ordering: React, libraries, local modules, styles. Avoid unused imports.
6. Verify Framer Motion animations follow existing patterns in the codebase.

## Output

- Provide a checklist of violations with file paths and suggested fixes.

## Related Skills

- `tailwind-v4-css-variables-enforcer` — automated scanning for Tailwind/CSS variable violations
- `skill-aligner` — for aligning skill descriptions with these conventions
