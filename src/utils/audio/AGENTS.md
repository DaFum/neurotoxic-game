# AGENTS.md — `src/utils/audio/`

Scope: Applies to low-level audio helpers in this directory.

## Purpose

This folder contains the audio subsystem internals used by `audioEngine.js`:

- setup/state management (`setup.js`, `state.js`)
- constants/asset references (`constants.js`, `assets.js`)
- playback orchestration (`playback.js`)
- procedural generation (`procedural.js`)
- cleanup/shared buffers (`cleanupUtils.js`, `sharedBufferUtils.js`)

## Best Practices

1. Handle browser autoplay/context restrictions defensively.
2. Keep node creation/disposal symmetric to avoid dangling WebAudio nodes.
3. Preserve deterministic start/stop semantics for ambient and gig audio.
4. Keep logs informative but never include sensitive runtime data.

## Safety & Reliability

- Wrap risky audio operations with explicit error handling and safe fallbacks.
- Do not fetch/execute untrusted dynamic scripts or markup.
- Keep volume/mute math clamped to safe ranges.

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
