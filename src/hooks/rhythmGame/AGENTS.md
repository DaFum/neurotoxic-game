# src/hooks/rhythmGame - Agent Instructions

- End detection uses `setlistCompleted` plus `isNearTrackEnd` (not `audioPlaybackEnded`).
- JSON-note OGG/MIDI tracks cap playback at `maxNoteTime + NOTE_TAIL_MS`; procedural songs use full excerpt duration.
- MIDI note times in `public/data/rhythm_songs.json` are excerpt-relative (tick 0 = start of excerpt window). Do NOT subtract `excerptStartMs` from note times — that field is only for the OGG seek offset. `excerptDurationMs` is still used to cap which notes get scheduled. Regression guard in `tests/node/rhythmUtils.test.js`.
- `useRhythmGameAudio` must not re-initialize on state re-renders. Gate setup on stable refs/IDs (song, gigId), not derived values that change every tick — otherwise playback becomes flaky and the init lock can starve.
