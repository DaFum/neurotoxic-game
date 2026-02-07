---
name: webaudio-reliability-fixer
description: Analyze and improve WebAudio/Tone.js reliability (autoplay gating, AudioContext lifecycle, scheduling, CPU hotspots). Use when audio dropouts or autoplay issues appear.
---

# WebAudio Reliability Fixer

## Workflow

1. Verify user-gesture gating for AudioContext/Tone.js start.
2. Check start/stop scheduling and ensure timers are cleared.
3. Inspect transport scheduling density and avoid excessive scheduling.
4. Add minimal debug logging around context state transitions.

## Output

- Provide the highest-impact fixes first.
