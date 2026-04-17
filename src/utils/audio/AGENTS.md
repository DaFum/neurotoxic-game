# src/utils/audio — Agent Instructions

## Scope

Applies to `src/utils/audio/**`.

## Audio Timing Authority

- Use `audioEngine.getGigTimeMs()` as the canonical gig clock source.
- Do not introduce direct Tone.js timing reads in gameplay logic.

## Asset/Playback Rules

- Keep fallback path intact when OGG assets are unavailable (MIDI/procedural path must still work).
- Preserve existing cleanup/dispose semantics in setup/playback/dispose helpers.

## Migration Rules

- Keep conversions behavior-preserving; separate refactors from type-shape changes.
- If adding types for song/note data, align with `src/types/audio.d.ts` contracts.
