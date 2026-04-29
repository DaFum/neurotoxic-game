# src/components/hud - Agent Instructions

## Scope

Applies to `src/components/hud/**`.

## Rules

- HUD values must reflect canonical state after clamps; do not reimplement clamp math in display components.
- Keep audio indicators tied to shared audio contracts from `src/types/audio.d.ts`.
- Preserve keyboard and overlay event handling so Escape or audio toggles do not race with scene-level handlers.

## Gotchas

- If HUD toasts or counters show deltas, show the applied delta, not the requested value.
- Do not read Tone.js time directly for gig progress displays; use the audio engine clock.
