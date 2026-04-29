# src/components/stage - Agent Instructions

## Purpose

Stage agents manage stage playback timing and end-of-song decisions by using `audioEngine.getGigTimeMs()` plus the `setlistCompleted` and `isNearTrackEnd` signals. They coordinate with shared audio and rhythm contracts instead of inventing scene-local timing rules.

## Limitations

Agents must not use `audioPlaybackEnded`, perform low-level audio decoding, or alter setlist flow. Preserve fallback behavior for procedural/MIDI playback when OGG assets are missing.

## Scope

Applies to `src/components/stage/**`.

## Rules

- Stage gameplay timing must use `audioEngine.getGigTimeMs()`.
- End-of-song logic uses `setlistCompleted` and `isNearTrackEnd`; do not reintroduce `audioPlaybackEnded`.
- Keep shared audio and rhythm contracts imported from `src/types/**`.

## Gotchas

- Preserve fallback behavior for procedural/MIDI playback when OGG assets are unavailable.
- Pixi.js v8 cleanup uses two distinct destroy args: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
