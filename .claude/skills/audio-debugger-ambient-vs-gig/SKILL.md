---
name: audio-debugger-ambient-vs-gig
description: Debug audio playback issues. Trigger when music fails to start, plays the wrong track, stutters, or when ambient/gig transitions fail. Covers Tone.js, AudioContext, and asset loading.
---

# Audio Debugger (Ambient vs Gig)

Troubleshoot and resolve audio playback issues in the game, focusing on the distinction between ambient (background) music and gig (rhythm game) tracks.

## Workflow

1.  **Identify the Context**
    Determine if the issue is with **Ambient** (Tour/Overworld) or **Gig** (Rhythm Game) audio.
    *   **Ambient**: Controlled by `AudioSystem.startAmbient()`. Uses OGG buffers (preferred) or MIDI synthesis (fallback).
    *   **Gig**: Controlled by `useRhythmGameAudio`. Plays specific MIDI slices/excerpts synchronized with gameplay.

2.  **Verify Audio Context State**
    Audio requires a user gesture to unlock.
    *   Check if `Tone.context.state` is `'running'`.
    *   Ensure `audioManager.ensureAudioContext()` is called after a click/interaction.

3.  **Trace the Execution**
    *   **Ambient**: Check `src/utils/AudioManager.js`. Look for `startAmbient()` call. Check if it falls back to MIDI.
    *   **Gig**: Check `src/utils/audioPlaybackUtils.js`. Verify `startPlayback` receives correct `songId` and `offset`.

4.  **Inspect Data Integrity**
    *   Open `src/assets/rhythm_songs.json`.
    *   Verify `file` paths exist.
    *   Verify `offset` and `bpm` are correct numbers.

5.  **Check Logs**
    Look for `[AudioSystem]` or `[AudioEngine]` logs in the console.

## Common Issues & Fixes

### Music Doesn't Start on Load
*   **Cause**: Browser autoplay policy blocked the AudioContext.
*   **Fix**: Ensure the user clicks a "Start" or "Enter" button that calls `audioManager.ensureAudioContext()`.

### Ambient Music Overlaps with Gig
*   **Cause**: `stopMusic()` wasn't called or failed before gig start.
*   **Fix**: Ensure `useRhythmGameAudio` calls `audioManager.stopMusic()` in its cleanup or initialization phase.

### Gig Audio is Out of Sync
*   **Cause**: `AudioContext.currentTime` drift or incorrect `offset` in song data.
*   **Fix**: Check `src/utils/rhythmUtils.js` timing logic. Verify `offset` in `rhythm_songs.json`.

## Example

**Input**: "The gig music for 'Neon Highway' is silent, but notes are moving."

**Process**:
1.  Check console for "Loading song: Neon Highway".
2.  Verify `rhythm_songs.json` has a valid `file` entry for "Neon Highway".
3.  Check if `Tone.Transport.start()` was called.
4.  Inspect `useRhythmGameAudio.js` to see if `initAudio` completed successfully.

**Output**:
"The MIDI file for 'Neon Highway' is missing from `src/assets/`, causing the synth to have no notes to play. Please add the file."
