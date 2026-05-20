# src/components/hud - Agent Instructions

## Audio & Timing

- Audio indicators consume shared contracts from `src/types/audio.d.ts`.
- Gig progress displays read `audioEngine.getGigTimeMs()`, not Tone.js time directly.

## Input

- Preserve keyboard and overlay event ordering so Escape/audio toggles do not double-handle events or override scene-level handlers.
