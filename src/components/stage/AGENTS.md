# src/components/stage - Agent Instructions

## Scope

Applies to `src/components/stage/**`.

## Rules

- Stage gameplay timing must use `audioEngine.getGigTimeMs()`.
- End-of-song logic uses `setlistCompleted` and `isNearTrackEnd`; do not reintroduce `audioPlaybackEnded`.
- Agents must not use `audioPlaybackEnded`, perform low-level audio decoding, or alter setlist flow.
- Keep shared audio and rhythm contracts imported from `src/types/**`.

## Gotchas

- Preserve fallback behavior for procedural/MIDI playback when OGG assets are unavailable.
- Pixi.js v8 cleanup uses two distinct destroy args: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- `renderer.generateTexture` is method-bound; call it as `renderer.generateTexture(graphics)` (or `.call(renderer, graphics)` when destructured) and pass `resolution: getOptimalResolution()` to preserve HiDPI crispness without regressing perf. A bare `1` was a recent regression.
