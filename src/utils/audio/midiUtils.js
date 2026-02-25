/**
 * Determines if a MIDI track should be treated as percussion.
 * @param {object} track - Track metadata from the MIDI parser.
 * @returns {boolean} True when the track is percussion-focused.
 */
export const isPercussionTrack = track =>
  Boolean(track?.instrument?.percussion || track?.channel === 9)

/**
 * Normalizes a MIDI pitch to a finite, in-range value.
 * @param {object} note - Note payload from the MIDI parser.
 * @returns {number|null} MIDI pitch between 0-127, or null if invalid.
 */
export const normalizeMidiPitch = note => {
  const midiPitch = Number(note?.midi)
  if (!Number.isFinite(midiPitch)) return null
  if (midiPitch < 0 || midiPitch > 127) return null
  return midiPitch
}

/**
 * Validates whether a MIDI note has a usable pitch for scheduling.
 * @param {object} note - Note payload from the MIDI parser.
 * @returns {boolean} True if the note contains a finite MIDI pitch.
 */
export const isValidMidiNote = note => normalizeMidiPitch(note) !== null

/**
 * Builds normalized MIDI track events from raw notes.
 * @param {Array} notes - Note list from the MIDI parser.
 * @param {boolean} percussionTrack - Whether the track is percussion.
 * @returns {Array} Normalized events with pitch and timing metadata.
 */
export const buildMidiTrackEvents = (notes, percussionTrack) => {
  if (!Array.isArray(notes)) return []

  return notes.reduce((events, note) => {
    if (!Number.isFinite(note?.time) || note.time < 0) return events
    const midiPitch = normalizeMidiPitch(note)
    if (midiPitch == null) return events

    events.push({
      time: note.time,
      midiPitch,
      duration: note.duration,
      velocity: note.velocity,
      percussionTrack
    })

    return events
  }, [])
}

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
]
const NOTE_CACHE = new Array(128)

// Pre-compute note names for MIDI 0-127
// Format matches Tone.Frequency(midi, "midi").toNote()
// 0 -> "C-1", 60 -> "C4", 69 -> "A4"
for (let i = 0; i < 128; i++) {
  const octave = Math.floor(i / 12) - 1
  const note = NOTE_NAMES[i % 12]
  NOTE_CACHE[i] = `${note}${octave}`
}

/**
 * Returns the cached note name for a given MIDI pitch.
 * @param {number} midiPitch - The MIDI pitch (0-127).
 * @returns {string|null} The note name (e.g., "C4") or null if invalid.
 */
export const getNoteName = midiPitch => {
  if (!Number.isFinite(midiPitch) || midiPitch < 0 || midiPitch > 127) {
    return null
  }
  return NOTE_CACHE[midiPitch | 0] || null
}
