/**
 * Determines if a MIDI track should be treated as percussion.
 * @param track - Track metadata from the MIDI parser.
 * @returns True when the track is percussion-focused.
 */
export const isPercussionTrack = (track: unknown): boolean => {
  if (typeof track !== 'object' || track === null) return false
  const t = track as {
    instrument?: { percussion?: unknown }
    channel?: unknown
  }
  return Boolean(t.instrument?.percussion || t.channel === 9)
}

/**
 * Normalizes a MIDI pitch to a finite, in-range value.
 * @param note - Note payload from the MIDI parser.
 * @returns MIDI pitch between 0-127, or null if invalid.
 */
export const normalizeMidiPitch = (note: unknown): number | null => {
  const midi = (note as { midi?: unknown })?.midi
  const midiPitch = Number(midi)
  if (!Number.isFinite(midiPitch)) return null
  if (midiPitch < 0 || midiPitch > 127) return null
  return midiPitch
}

/**
 * Builds normalized MIDI track events from raw notes.
 * @param notes - Note list from the MIDI parser.
 * @param percussionTrack - Whether the track is percussion.
 * @returns Normalized events with pitch and timing metadata.
 */
export const buildMidiTrackEvents = (
  notes: unknown,
  percussionTrack = false
): Array<{
  time: number
  midiPitch: number
  duration?: unknown
  velocity?: unknown
  percussionTrack: boolean
}> => {
  if (!Array.isArray(notes)) return []

  const events: Array<{
    time: number
    midiPitch: number
    duration?: unknown
    velocity?: unknown
    percussionTrack: boolean
  }> = []
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i] as {
      time?: unknown
      duration?: unknown
      velocity?: unknown
    }
    const time = Number(note?.time)
    if (!Number.isFinite(time) || time < 0) continue
    const midiPitch = normalizeMidiPitch(note)
    if (midiPitch == null) continue

    events.push({
      time,
      midiPitch,
      duration: note.duration,
      velocity: note.velocity,
      percussionTrack
    })
  }
  return events
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
 * @param midiPitch - The MIDI pitch (0-127).
 * @returns The note name (e.g., "C4") or null if invalid.
 */
export const getNoteName = (midiPitch: number): string | null => {
  if (!Number.isFinite(midiPitch) || midiPitch < 0 || midiPitch > 127) {
    return null
  }
  return NOTE_CACHE[midiPitch | 0] || null
}
