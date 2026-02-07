---
name: audio-debugger-ambient-vs-gig
description: Debug ambient vs gig playback behavior (full tracks vs excerpts, start/stop timing). Use when audio stutters, plays incorrectly, or needs additional logging.
---

# Audio Debugger (Ambient vs Gig)

## Workflow

1. Locate the ambient start/stop logic and confirm it plays full MIDI tracks.
2. Locate gig playback logic and confirm excerpts start at the configured offset and stop at the expected duration.
3. Add targeted logging around start/stop calls, timing offsets, and duration scheduling.
4. Ensure AudioContext/Tone.js is initialized on a user gesture when required.

## Output

- Summarize likely causes and the exact files to change.
- Propose minimal logging to validate behavior without leaking sensitive data.
