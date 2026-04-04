import * as Tone from 'tone'
import { audioState } from './state.js'
import { getNoteName } from './midiUtils.js'
import { playDrumNote } from './drumMappings.js'

/**
 * Internal helper to trigger instrument notes.
 */
export function triggerInstrumentNote(
  lane,
  midiPitch,
  time,
  velocity,
  noteName = null
) {
  if (lane === 'drums') {
    playDrumNote(midiPitch, time, velocity)
  } else if (lane === 'bass') {
    if (audioState.bass) {
      audioState.bass.triggerAttackRelease(
        noteName ?? getNoteName(midiPitch),
        '8n',
        time,
        velocity
      )
    }
  } else if (audioState.guitar) {
    audioState.guitar.triggerAttackRelease(
      noteName ?? getNoteName(midiPitch),
      '16n',
      time,
      velocity
    )
  }
}

/**
 * Plays a specific note at a scheduled Tone.js time.
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} whenSeconds - Tone.js time in seconds.
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNoteAtTime(midiPitch, lane, whenSeconds, velocity = 127) {
  if (!audioState.isSetup) return
  const now = Number.isFinite(whenSeconds) ? whenSeconds : Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))
  triggerInstrumentNote(lane, midiPitch, now, vel)
}
