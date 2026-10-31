# src/hooks/rhythmGame - Agent Instructions

## End Of Gig

- Detecting final song/setlist completion uses `setlistCompleted` plus `isNearTrackEnd` in `processRhythmGameTick`; do not use or fall back to `audioPlaybackEnded`. The one exception is a stopped transport (`transportState === 'stopped'`) with `setlistCompleted`: a zero-length final song never starts the transport, so the clock is reset and `totalDuration` is stale, and the tick finalizes on `setlistCompleted` alone. A `paused` transport (overlay pause, deferred start) never takes that path.

## Playback Windows

- JSON-note OGG/MIDI tracks cap playback at `maxNoteTime + NOTE_TAIL_MS`; procedural songs use full excerpt duration.
- Normalize excerpt metadata with `resolveSongPlaybackWindow`; missing or non-finite `excerptStartMs` becomes `0`, and duration falls back through `excerptEndMs`, `excerptDurationMs`, `durationMs`, then the caller default.
- MIDI note times in `src/assets/rhythm_songs.json` are excerpt-relative (tick 0 = start of excerpt window). Do NOT subtract `excerptStartMs` from note times — that field is only for the OGG seek offset. `excerptDurationMs` is still used to cap which notes get scheduled. Regression guard in `tests/node/rhythmUtils.test.js`.

## Initialization

- `useRhythmGameAudio` must not re-initialize on state re-renders. Gate setup on values that stay fixed for the current gig setup, such as the song identity or `gigId`, not per-tick derived values like progress, score, or elapsed time; otherwise playback becomes flaky and the init lock can starve.
