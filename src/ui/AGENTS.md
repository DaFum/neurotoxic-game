# AGENTS.md — `src/ui/`

Scope: Applies to all files in `src/ui/` and `src/ui/shared/`.

## Purpose

Nested override: `src/ui/shared/AGENTS.md` for shared control components.

UI components define reusable interface primitives and overlays:

- Core UI: `HUD.jsx`, `EventModal.jsx`, `ToastOverlay.jsx`, `GlitchButton.jsx`, `DebugLogViewer.jsx`, `CrashHandler.jsx`, `BandHQ.jsx`
- Shared controls: `shared/SettingsPanel.jsx`, `shared/VolumeSlider.jsx`, `shared/index.jsx`

## Design Constraints

1. Follow brutalist visual language and existing token system.
2. Use CSS variables (`--toxic-green`, `--void-black`, etc.); no hardcoded colors.
3. Keep components reusable and composable with clear props.
4. Preserve toast taxonomy: `success`, `error`, `warning`, `info`.

## Accessibility & UX

- Keep keyboard-friendly interactions.
- Maintain readable contrast and clear interaction states.
- Keep modal and overlay layering predictable with existing z-index strategy.

## Validation Checklist

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
