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
