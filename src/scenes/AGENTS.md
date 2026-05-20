# src/scenes - Agent Instructions

## Routing / Reachability

- Scene transitions must use provided scene callbacks and existing routing hooks.
- When reorganizing menus or overlays, keep legacy actions reachable from the same scene without adding an extra modal, hidden prerequisite, or longer click/keyboard path.

## Copy / Utilities

- Use i18n keys for visible scene text and update EN/DE together.
- Use shared asset/audio utilities rather than direct Pixi/Tone shortcuts.

## Tests

- UI controls moved or hidden behind refactors still need automated reachability tests: assert the control can be found by role/text and triggers the same callback or scene transition.
