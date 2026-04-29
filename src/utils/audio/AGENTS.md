# src/utils/audio - Agent Instructions

## Scope

Applies to `src/utils/audio/**`.

## Rules

- `audioEngine.getGigTimeMs()` is the canonical gig clock source.
- Keep OGG-unavailable fallback paths intact for MIDI/procedural playback.
- Preserve setup/playback/dispose cleanup semantics.
- Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.ts`; import with `import type`.
- Rely on bundled Tone.js and @tonejs/midi declarations; do not add stub `.d.ts` shims.

## Gotchas

- Narrow array/map lookups before use; this domain is under stricter CheckJS.
- Snapshot consumers should prefer `getStateSnapshot()` and normalize partial snapshots to complete `AudioSnapshot` shapes.
- Native subscription is valid only when `subscribe` is a function; otherwise polling must stay active.
