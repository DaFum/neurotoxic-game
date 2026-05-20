# src/components/stage - Agent Instructions

- Stage gameplay timing uses `audioEngine.getGigTimeMs()`. End-of-song logic uses `setlistCompleted` + `isNearTrackEnd`; do not reintroduce `audioPlaybackEnded`.
- Preserve fallback behavior for procedural/MIDI playback when OGG assets are missing.
- Pixi.js v8 cleanup takes two distinct destroy args: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- `renderer.generateTexture` is method-bound — call as `renderer.generateTexture(graphics)` (or `.call(renderer, graphics)` when destructured) and pass `resolution: getOptimalResolution()`. A bare `1` was a recent HiDPI regression.
