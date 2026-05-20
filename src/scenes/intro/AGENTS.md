# src/scenes/intro - Agent Instructions

## Accessibility

- Skip and autoplay overlays must preserve keyboard and pointer accessibility paths; do not gate skip behind autoplay-only state.
- If accessibility and timing behavior conflict, manual skip wins: it must still route to the menu immediately and stay testable by click or keyboard.

## Timing

- Intro timing/skip behavior should remain deterministic for tests. Do not add hidden or uncontrolled timers (`setTimeout`, animation callbacks, delayed video handlers) unless the delay or trigger can be controlled by tests.
