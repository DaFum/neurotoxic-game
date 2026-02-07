---
name: debug-ux-upgrader
description: Add or improve debug UX (overlays, logs, toggles, feature flags). Use when asked to add diagnostics or developer-friendly tooling.
---

# Debug UX Upgrader

## Key Files

- `src/utils/logger.js` — existing logger utility (use this for all debug output)
- `src/ui/DebugLogViewer.jsx` — existing debug log viewer component
- `src/ui/CrashHandler.jsx` — error boundary with diagnostic display
- `src/utils/errorHandler.js` — centralized error handling
- `src/components/GigHUD.jsx` — in-game HUD (candidate for debug overlays)
- `src/ui/HUD.jsx` — main HUD component

## Workflow

1. Identify the debug signals needed (audio state, FPS, scene transitions, game state).
2. Extend `DebugLogViewer.jsx` or add toggleable overlays with minimal visual disruption.
3. Use `logger.js` for all structured logging — it already supports namespaced levels (debug, error).
4. Wire debug toggles through a URL param or keyboard shortcut, not a visible UI element.
5. Ensure no sensitive data (player state internals, error stack traces) leaks into production logs.

## Output

- Provide implementation notes and how to enable/disable debugging.
- Reference existing utilities to avoid duplication.

## Related Skills

- `audio-debugger-ambient-vs-gig` — for audio-specific debug logging
- `one-command-doctor` — for automated diagnostic checks
