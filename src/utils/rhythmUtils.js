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
          songId: song.id,
          type: 'note'
        })
      }
    }
  }

  return notes
}

/**
 * Calculates the time for a given tick count using the song's tempo map.
 * @param {number} ticks - The MIDI tick timestamp.
 * @param {number} tpb - Ticks per beat.
 * @param {Array} tempoMap - Array of tempo changes [{ tick, usPerBeat }].
 * @param {string} [unit='ms'] - Output unit: 'ms' (milliseconds) or 's' (seconds).
 * @returns {number} Time in the specified unit.
 */
export const calculateTimeFromTicks = (ticks, tpb, tempoMap, unit = 'ms') => {
  if (!tempoMap || tempoMap.length === 0) return 0

  let totalTime = 0
  let currentTick = 0
  // divisor: if 'ms', we want (us / 1000). if 's', we want (us / 1000000).
  const divisor = unit === 's' ? 1000000 : 1000

  for (let i = 0; i < tempoMap.length; i++) {
    const currentTempo = tempoMap[i]
    const nextTempo = tempoMap[i + 1]
    const endTick = nextTempo ? nextTempo.tick : ticks

    if (currentTick >= ticks) break

    const segmentTicks = Math.min(endTick, ticks) - currentTick
    if (segmentTicks > 0) {
      // usPerBeat / tpb = microseconds per tick
      const timePerTick = currentTempo.usPerBeat / tpb / divisor
      totalTime += segmentTicks * timePerTick
      currentTick += segmentTicks
    }
  }

  return totalTime
}

/**
 * Parses raw song notes into game notes.
 * Applies a 1-in-4 filter to reduce density and ensures single-lane gameplay.
 * @param {object} song - The song object containing notes and metadata.
 * @param {number} [leadIn=2000] - Lead-in time in milliseconds.
 * @param {object} [options={}] - Options object.
 * @param {Function} [options.onWarn] - Callback for warnings (e.g. unknown lanes).
 * @returns {Array} Array of note objects formatted for the game loop.
 */
export const parseSongNotes = (song, leadIn = 2000, { onWarn } = {}) => {
  if (!song.notes || !Array.isArray(song.notes)) return []

  const tpb = Math.max(1, song.tpb || 480) // Prevent div by zero
  const bpm = Math.max(1, song.bpm || 120) // Prevent div by zero

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

  // Determine timing strategy: Tempo Map vs Constant BPM
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0

  // 3. Map to game note objects
  const gameNotes = filteredNotes
    .map(n => {
      const laneIndex = laneMap[n.lane]
      if (laneIndex === undefined) {
        if (onWarn) {
          onWarn(
            `parseSongNotes: Unknown lane "${n.lane}" for note at tick ${n.t}. Skipping.`
          )
        }
        return null
      }

      let timeMs = 0
      if (useTempoMap) {
        // If calculateTimeFromTicks returns 0/NaN due to bad data, fallback logic?
        // calculateTimeFromTicks is robust for empty maps (returns 0), but if map is invalid?
        // We already checked length > 0.
        timeMs = calculateTimeFromTicks(n.t, tpb, song.tempoMap, 'ms')
      } else {
        // Fallback: ticks -> ms using constant BPM
        timeMs = (n.t / tpb) * (60000 / bpm)
      }

      // Final sanity check on time
      if (!Number.isFinite(timeMs)) {
        // Should realistically assume constant BPM if map failed, but here we just drop it or default to 0
        timeMs = (n.t / tpb) * (60000 / bpm)
      }

      return {
        time: leadIn + timeMs,
        laneIndex, // Shorthand property notation
        hit: false,
        visible: true,
        songId: song.id,
        originalNote: n,
        type: 'note' // Explicit type for future projectiles
      }
    })
    .filter(n => n !== null && Number.isFinite(n.time))

  // 4. Ensure no simultaneous notes (chords) - strictly single lane
  const uniqueTimeNotes = []
  let lastTime = null

  for (const note of gameNotes) {
    // If this note is at the same time as the last valid one, skip it
    if (lastTime !== null && Math.abs(note.time - lastTime) <= 1) {
      continue
    }
    uniqueTimeNotes.push(note)
    lastTime = note.time
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
        // For standard notes, check lane match. For projectiles (future), might differ.
        n.type === 'note' &&
        Math.abs(n.time - elapsed) < hitWindow
    ) || null
  )
}
