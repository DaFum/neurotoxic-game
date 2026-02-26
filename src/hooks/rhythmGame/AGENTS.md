# src/hooks/rhythmGame/ — Gotchas

- `useRhythmGameState` initializes `accuracy` at `100` and exposes `setAccuracy` — other hooks must destructure it from there.
- `useRhythmGameAudio` merges `calculateGigPhysics` multipliers into `gameStateRef.current.modifiers` (as `drumMultiplier`, `guitarScoreMult`). The scoring hook reads them from there — don't re-derive.
- `useRhythmGameAudio` returns `{ retryAudioInitialization }` only — no `initializeGigState` alias.
- **Audio stop**: When JSON notes are present, OGG/MIDI playback is capped to `maxNoteTime + NOTE_TAIL_MS` (1s). `totalDuration` = `maxNoteTime + 4s`. For procedural songs (no JSON notes), `totalDuration` = `Math.max(noteDuration, audioDuration)`.
- `useRhythmGameScoring` reads `state.modifiers.drumMultiplier` with fallback to static closure value for drum lane points. Calls `setAccuracy(calculateAccuracy(...))` after every hit/miss.
