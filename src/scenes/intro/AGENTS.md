# src/scenes/intro - Agent Instructions

## Scope

Applies to `src/scenes/intro/**`.

## Purpose

Intro agents manage intro-scene presentation controls (skip/autoplay overlays), localized copy, and deterministic interaction behavior that must stay testable.

## Limitations

- Preserve deterministic timing and testability; avoid hidden timers without controllable hooks.
- Keep skip/autoplay paths accessible via keyboard and pointer.
- Follow parent `src/scenes/AGENTS.md` for scene transitions and localized text requirements.

## When to use

Use this scope when editing intro overlays, skip/autoplay interaction behavior, or intro-only accessibility flows. Use parent scene guidance for routing ownership and shared scene-level transition policy.

## Gotchas

- Skip and autoplay overlays must preserve keyboard and pointer accessibility paths; do not gate skip behind autoplay-only state.
- Intro timing/skip behavior should remain deterministic for tests; avoid adding implicit timers without injectable control points.
