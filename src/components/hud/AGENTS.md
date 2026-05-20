# src/components/hud - Agent Instructions

- Audio indicators consume shared contracts from `src/types/audio.d.ts`.
- Gig progress displays read `audioEngine.getGigTimeMs()`, not Tone.js time directly.
- Preserve keyboard and overlay event handling so Escape/audio toggles do not race with scene-level handlers.
