---
name: audio-debugger-ambient-vs-gig
description: Debug ambient vs gig playback behavior (full tracks vs excerpts, start/stop timing). Use when audio stutters, plays incorrectly, or needs additional logging.
---

# Audio Debugger (Ambient vs Gig)

## Key Files

- `src/utils/AudioManager.js` — singleton managing Tone.js playback and MIDI loading
- `src/utils/audioEngine.js` — low-level audio scheduling and context management
- `src/utils/audioPlaybackUtils.js` — ambient vs gig playback helpers
- `src/utils/audioSelectionUtils.js` — song/track selection logic
- `src/hooks/useAudioControl.js` — React hook bridging audio into components
- `src/assets/rhythm_songs.json` — MIDI track metadata and excerpt offsets
- `src/data/songs.js` — song definitions with duration and offset data

## Workflow

1. Read `src/utils/AudioManager.js` and trace how ambient playback starts on "Start Tour" (full MIDI tracks via Tone.js/audioEngine).
2. Read `src/utils/audioPlaybackUtils.js` and trace gig playback — confirm excerpts start at the configured offset and stop at the expected duration.
3. Cross-check `src/assets/rhythm_songs.json` offsets against `src/data/songs.js` definitions.
4. Add targeted logging via `src/utils/logger.js` around start/stop calls, timing offsets, and duration scheduling.
5. Ensure AudioContext/Tone.js is initialized on a user gesture (check `useAudioControl.js`).

## Output

- Summarize likely causes and the exact files to change.
- Propose minimal logging to validate behavior without leaking sensitive data.

## Related Skills

- `webaudio-reliability-fixer` — for autoplay gating and AudioContext lifecycle issues
- `debug-ux-upgrader` — for adding debug overlays and audio state visualization
