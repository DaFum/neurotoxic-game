# AGENTS.md — `src/ui/shared/`

Scope: Applies to shared UI primitives in this directory.

## Purpose

Reusable controls consumed by scene/ui components:

- `SettingsPanel.jsx`
- `VolumeSlider.jsx`
- `index.jsx` (exports)

## Best Practices

1. Keep components presentation-focused and prop-driven.
2. Use existing design tokens/CSS variables (no hardcoded colors).
3. Keep controls keyboard accessible and screen-reader friendly.
4. Keep API surface stable and documented through prop names/defaults.

## Styling Rules

- Tailwind v4 syntax only.
- Maintain brutalist visual consistency with parent UI components.
- Preserve consistent spacing/typography conventions from `src/ui/`.

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
