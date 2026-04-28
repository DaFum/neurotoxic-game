# src/scenes/kabelsalat/components/overlays — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/overlays/**`.

## Domain Gotchas

- Win/loss overlays must expose a manual continue action wired to the same finalize pathway as auto-timers.
- Overlay copy must remain i18n-driven and include both EN/DE locale updates in the same change.
- Keep overlay content responsive inside the board container (`aspect-[4/3]`) with wrapping/scroll safety for small viewports.

## Recent Findings (2026-04)

- StrictMode timer regressions can strand players on overlays; always preserve an immediate manual escape path to `GAME_PHASES.GIG`.
