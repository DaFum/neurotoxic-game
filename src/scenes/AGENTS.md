# src/scenes - Agent Instructions

## Scope

Applies to `src/scenes/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Scene transitions must use provided scene callbacks and existing routing hooks.
- Preserve direct reachability of legacy actions when reorganizing menus or overlays.
- Use i18n keys for visible scene text and update EN/DE together.
- Use shared asset/audio utilities rather than direct Pixi/Tone shortcuts.

## Gotchas

- `useArrivalLogic` owns arrival routing, including direct PreGig entry.
- UI controls hidden behind refactors still need reachability assertions.
