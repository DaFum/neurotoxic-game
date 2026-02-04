/**
 * Generates rhythm game notes for a given song and configuration.
 * @param {object} song - Song metadata (bpm, duration, difficulty).
 * @param {object} options - Configuration options.
 * @param {number} options.leadIn - Time in ms before first note (default 2000).
 * @param {Function} [options.random] - Optional random function (returns 0-1) for deterministic generation.
 * @returns {Array} Array of note objects.
 */
export const generateNotesForSong = (song, options = {}) => {
  const { leadIn = 2000, random = Math.random } = options
  const notes = []
  const beatInterval = 60000 / song.bpm
  const songDurationMs = song.duration * 1000
  const totalBeats = Math.floor(songDurationMs / beatInterval)
  const diff = song.difficulty || 2

  // Deterministic lane map
  const laneMap = [1, 0, 2, 0]

  for (let i = 0; i < totalBeats; i += 1) {
    const noteTime = leadIn + i * beatInterval
    // Ensure we don't exceed duration buffer
    if (noteTime < leadIn + songDurationMs) {
      // Difficulty Scaling: Higher diff = more density
      let shouldSpawn = false
      const beatInBar = i % 4

      if (diff <= 2) {
        // Easy: Downbeats (1) and sometimes 3
        shouldSpawn = beatInBar === 0 || (i % 8 === 4 && random() > 0.2)
      } else if (diff <= 4) {
        // Medium: Downbeats + Offbeats
        shouldSpawn = beatInBar === 0 || beatInBar === 2 || random() > 0.6
      } else {
        // Hard: Chaos / Stream
        shouldSpawn = random() > 0.3 // 70% density
      }

      if (shouldSpawn) {
        // Lane selection based on beat index
        let laneIndex = laneMap[i % 4]
        // Add some variation for harder levels
        if (diff > 3 && random() > 0.7) {
          laneIndex = Math.floor(random() * 3)
        }

        notes.push({
          time: noteTime,
          laneIndex,
          hit: false,
          visible: true,
          songId: song.id
        })
      }
    }
  }

  return notes
}

/**
 * Parses raw song notes into game notes.
 * Applies a 1-in-4 filter to reduce density and ensures single-lane gameplay.
 * @param {object} song - The song object containing notes and metadata.
 * @param {number} [leadIn=2000] - Lead-in time in milliseconds.
 * @returns {Array} Array of note objects formatted for the game loop.
 */
export const parseSongNotes = (song, leadIn = 2000) => {
  if (!song.notes || !Array.isArray(song.notes)) return []

  const tpb = Math.max(1, song.tpb || 480) // Prevent div by zero
  const bpm = Math.max(1, song.bpm || 120) // Prevent div by zero
  const msPerTick = 60000 / bpm / tpb

  const laneMap = {
    guitar: 0,
    drums: 1,
    bass: 2
  }

  // 1. Sort all valid notes by time
  const sortedNotes = song.notes
    .filter(n => typeof n.t === 'number' && isFinite(n.t))
    .sort((a, b) => a.t - b.t)

  // 2. Filter to keep only every 4th note
  // This satisfies: "Use only every 4th note for the lane to click at"
  const filteredNotes = sortedNotes.filter((_, index) => index % 4 === 0)

  // 3. Map to game note objects
  const gameNotes = filteredNotes
    .map(n => {
      const laneIndex = laneMap[n.lane]
      if (laneIndex === undefined) return null

      return {
        time: leadIn + n.t * msPerTick,
        laneIndex: laneIndex,
        hit: false,
        visible: true,
        songId: song.id,
        originalNote: n
      }
    })
    .filter(n => n !== null)

  // 4. Ensure no simultaneous notes (chords) - strictly single lane
  // Since we sorted by time, we can just check if current note has same time as previous.
  // The 'every 4th' filter likely spread them out, but if notes were identical in time,
  // index % 4 might pick the first of a chord, then the 5th note later.
  // However, if chords are tight (same 't'), picking every 4th index effectively breaks chords up
  // or skips them unless the chord has >4 notes.
  // To be safe and strict about "single lane used... not all lanes at same time",
  // we deduplicate by time.
  const uniqueTimeNotes = []
  let lastTime = -1

  for (const note of gameNotes) {
    // If this note is at the same time as the last valid one, skip it (or use a tiny offset?)
    // Requirement says "Ensure only one lane is used... not all lanes at same time".
    // Skipping duplicate timestamps enforces this.
    if (Math.abs(note.time - lastTime) > 1) {
      // Tolerance of 1ms
      uniqueTimeNotes.push(note)
      lastTime = note.time
    }
  }

  return uniqueTimeNotes
}

/**
 * Checks if a note is hit within the window.
 * @param {Array} notes - Array of note objects.
 * @param {number} laneIndex - The lane being triggered.
 * @param {number} elapsed - Current game time in ms.
 * @param {number} hitWindow - Allowed deviation in ms.
 * @returns {object|null} The hit note or null.
 */
export const checkHit = (notes, laneIndex, elapsed, hitWindow) => {
  return (
    notes.find(
      n =>
        n.visible &&
        !n.hit &&
        n.laneIndex === laneIndex &&
        Math.abs(n.time - elapsed) < hitWindow
    ) || null
  )
}
