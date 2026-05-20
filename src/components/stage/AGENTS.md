# src/components/stage - Agent Instructions

## Timing & Audio

- Stage gameplay timing uses `audioEngine.getGigTimeMs()`. End-of-song logic uses `setlistCompleted` + `isNearTrackEnd`; do not reintroduce `audioPlaybackEnded`.
- Preserve the OGG-to-MIDI/procedural fallback: when an OGG asset is missing or unavailable, route through the existing MIDI/procedural playback path in `rhythmGameAudioUtils` instead of failing the song.

## Pixi Lifecycle

- Pixi.js v8 cleanup takes two distinct destroy args: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- For `renderer.generateTexture`, keep method binding (`renderer.generateTexture(...)` or `.call(renderer, ...)` when destructured). When using the texture-generator options form, pass `resolution: getOptimalResolution()`; do not hardcode `resolution: 1`, which caused a HiDPI regression.
