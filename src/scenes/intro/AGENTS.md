# src/scenes/intro - Agent Instructions

## Gotchas

- Skip and autoplay overlays must preserve keyboard and pointer accessibility paths; do not gate skip behind autoplay-only state.
- Intro timing/skip behavior should remain deterministic for tests; avoid adding implicit timers without injectable control points.
