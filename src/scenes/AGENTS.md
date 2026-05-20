# src/scenes - Agent Instructions

## Rules

- Scene transitions must use provided scene callbacks and existing routing hooks.
- Preserve direct reachability of legacy actions when reorganizing menus or overlays.
- Use i18n keys for visible scene text and update EN/DE together.
- Use shared asset/audio utilities rather than direct Pixi/Tone shortcuts.

## Gotchas

- UI controls hidden behind refactors still need reachability assertions.
