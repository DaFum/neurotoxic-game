# src/components/stage - Agent Instructions

## Scope

Applies to `src/components/stage/**`.

## Rules

- Stage gameplay timing must use `audioEngine.getGigTimeMs()`.
- End-of-song logic uses `setlistCompleted` and `isNearTrackEnd`; do not reintroduce `audioPlaybackEnded`.
- Keep shared audio and rhythm contracts imported from `src/types/**`.

## Gotchas

- Preserve fallback behavior for procedural/MIDI playback when OGG assets are unavailable.
