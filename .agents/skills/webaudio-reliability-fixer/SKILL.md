---
name: webaudio-reliability-fixer
description: diagnose and fix Web Audio and Tone.js issues. Trigger when audio crackles, fails to start, or desyncs. Handles autoplay policies and context lifecycle. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Stabilize Web Audio startup, context lifecycle, and sync reliability under browser policy constraints.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'audio'
  keywords: ['audio', 'webaudio', 'reliability', 'edge-cases']
  maturity: 'stable'
license: 'Proprietary. See LICENSE.txt for terms'
---

# WebAudio Reliability Fixer

Ensure stable audio playback across all browsers and devices.

## Workflow

1.  **Check Autoplay Policy**
    - **Rule**: `AudioContext` must start in `suspended` state.
    - **Resume**: Must call `Tone.start()` or `context.resume()` inside a `click` or `keydown` event.
    - **Diag**: Check `Tone.context.state` on load.

2.  **Inspect Scheduling**
    - **Lookahead**: Is `Tone.context.lookAhead` sufficient? (Default 0.1s).
    - **Latency**: Is the main thread blocked? Audio runs on a separate thread, but scheduling happens on main.

3.  **Verify Cleanup**
    - **Oscillators**: Must call `stop()` and `dispose()`.
    - **Effects**: Connect/Disconnect properly to avoid graph leaks.

4.  **Buffer Management**
    - Are buffers loaded before playback starts?
    - Check `Tone.loaded()` promise.

## Example

**Input**: "Audio crackles during the game."

**Action**:

1.  Check `audioEngine.js`.
2.  See extensive object creation in the render loop.
3.  **Fix**: Reuse synth instances. Pre-calculate notes.
4.  Increase `Tone.context.lookAhead` if CPU usage is high.

**Output**:
"Optimized synth pooling in `audioEngine.js` to reduce garbage collection pauses. Increased lookahead to 0.2s."

_Skill sync: compatible with React 19.2.4 / Vite 8.0.1 baseline as of 2026-03-18._
