# src/hooks/rhythmGame - Agent Instructions

## Scope

Applies to `src/hooks/rhythmGame/**`.

## Rules

- Use `audioEngine.getGigTimeMs()` for timing.
- Import shared note/song/gig contracts from `src/types/audio.d.ts` and `src/types/rhythmGame.ts`.
- Narrow array/map lookups before use under `noUncheckedIndexedAccess`.

## Gotchas

- End detection uses `setlistCompleted` plus `isNearTrackEnd`.
- JSON-note tracks cap playback to `maxNoteTime + NOTE_TAIL_MS`.
