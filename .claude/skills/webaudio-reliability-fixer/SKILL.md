---
name: webaudio-reliability-fixer
description: Analyze and improve WebAudio/Tone.js reliability (autoplay gating, AudioContext lifecycle, scheduling, CPU hotspots). Use when audio dropouts or autoplay issues appear.
---

# WebAudio Reliability Fixer

## Key Files

- `src/utils/AudioManager.js` — singleton that orchestrates Tone.js playback via `audioEngine.js`
- `src/utils/audioEngine.js` — low-level AudioContext/Tone.js (v15) scheduling
- `src/utils/audioPlaybackUtils.js` — start/stop helpers for ambient and gig modes
- `src/hooks/useAudioControl.js` — React hook that gates audio on user gesture
- `src/components/PixiStage.jsx` — may trigger audio transitions on scene changes

## Workflow

1. Verify user-gesture gating in `useAudioControl.js` — AudioContext/Tone.js must not start before interaction.
2. Check start/stop scheduling in `audioEngine.js` and ensure timers and Transport events are cleared on scene transitions.
3. Inspect `AudioManager.js` for scheduling density — avoid queueing overlapping Tone.js players/events.
4. Review scene transitions in `src/scenes/` for audio lifecycle gaps (e.g., Gig → PostGig).
5. Add minimal debug logging via `src/utils/logger.js` around context state transitions.

## Output

- Provide the highest-impact fixes first.
- Reference specific files and line ranges for each fix.

## Related Skills

- `audio-debugger-ambient-vs-gig` — for ambient vs gig playback-specific bugs
- `pixi-lifecycle-memory-leak-sentinel` — audio leaks often accompany Pixi.js lifecycle issues
