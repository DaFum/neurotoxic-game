---
name: webaudio-reliability-fixer
description: Diagnose and fix Web Audio and Tone.js issues. Trigger when audio crackles, fails to start, or desyncs. Handles autoplay policies and context lifecycle.
---

# WebAudio Reliability Fixer

Ensure stable audio playback across all browsers and devices.

## Workflow

1.  **Check Autoplay Policy**
    *   **Rule**: `AudioContext` must start in `suspended` state.
    *   **Resume**: Must call `Tone.start()` or `context.resume()` inside a `click` or `keydown` event.
    *   **Diag**: Check `Tone.context.state` on load.

2.  **Inspect Scheduling**
    *   **Lookahead**: Is `Tone.context.lookAhead` sufficient? (Default 0.1s).
    *   **Latency**: Is the main thread blocked? Audio runs on a separate thread, but scheduling happens on main.

3.  **Verify Cleanup**
    *   **Oscillators**: Must call `stop()` and `dispose()`.
    *   **Effects**: Connect/Disconnect properly to avoid graph leaks.

4.  **Buffer Management**
    *   Are buffers loaded before playback starts?
    *   Check `Tone.loaded()` promise.

## Example

**Input**: "Audio crackles during the game."

**Action**:
1.  Check `audioEngine.js`.
2.  See extensive object creation in the render loop.
3.  **Fix**: Reuse synth instances. Pre-calculate notes.
4.  Increase `Tone.context.lookAhead` if CPU usage is high.

**Output**:
"Optimized synth pooling in `audioEngine.js` to reduce garbage collection pauses. Increased lookahead to 0.2s."
