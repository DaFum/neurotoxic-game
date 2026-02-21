import { resolveSongPlaybackWindow } from './audio/songUtils'

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
  const beatInterval = 60000 / Math.max(1, song.bpm || 120)
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
      const beatInBar = i % 4

      const shouldSpawn =
        diff <= 2
          ? beatInBar === 0 || (i % 8 === 4 && random() > 0.2)
          : diff <= 4
            ? beatInBar === 0 || beatInBar === 2 || random() > 0.6
            : random() > 0.3 // 70% density

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
 * Preprocesses the tempo map to add cumulative time to each entry.
 * This enables O(log N) lookups in calculateTimeFromTicks.
 * @param {Array} tempoMap - Array of tempo changes [{ tick, usPerBeat }].
 * @param {number} tpb - Ticks per beat.
 * @returns {Array} New tempo map with accumulatedMicros.
 */
export const preprocessTempoMap = (tempoMap, tpb) => {
  if (!tempoMap || tempoMap.length === 0) return []

  const processed = []
  let currentTick = 0
  let totalTimeMicros = 0

  for (let i = 0; i < tempoMap.length; i++) {
    const currentTempo = tempoMap[i]
    const nextTempo = tempoMap[i + 1]

    // Store the state at the START of this segment
    // _startTick aligns with the 'currentTick' iterator from the legacy calculation loop
    processed.push({
      ...currentTempo,
      _startTick: currentTick,
      _accumulatedMicros: totalTimeMicros
    })

    if (nextTempo) {
      const durationTicks = Math.max(0, nextTempo.tick - currentTick)
      if (durationTicks > 0) {
        totalTimeMicros += durationTicks * (currentTempo.usPerBeat / tpb)
      }
      currentTick = nextTempo.tick
    }
  }
  return processed
}

/**
 * Finds the active tempo segment for a given tick using binary search.
 * @param {Array} processedMap - Preprocessed tempo map.
 * @param {number} ticks - Target ticks.
 * @returns {object} The tempo map entry active for this tick.
 */
const findTempoSegment = (processedMap, ticks) => {
  let lo = 0
  let hi = processedMap.length - 1
  let candidate = processedMap[0]

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const entry = processedMap[mid]

    if (entry._startTick <= ticks) {
      // Valid candidate, try to find a later one
      candidate = entry
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return candidate
}


/**
 * Ensures tempo map entries contain preprocessed timing metadata.
 * @param {Array} tempoMap - Raw or preprocessed tempo map.
 * @param {number} tpb - Ticks per beat.
 * @returns {Array} Preprocessed tempo map.
 */
const ensureProcessedTempoMap = (tempoMap, tpb) => {
  if (!Array.isArray(tempoMap) || tempoMap.length === 0) return []
  if (typeof tempoMap[0]?._accumulatedMicros === 'number') return tempoMap
  return preprocessTempoMap(tempoMap, tpb)
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
  const processedTempoMap = ensureProcessedTempoMap(tempoMap, tpb)
  if (processedTempoMap.length === 0) return 0

  // divisor: if 'ms', we want (us / 1000). if 's', we want (us / 1000000).
  const divisor = unit === 's' ? 1000000 : 1000
  const segment = findTempoSegment(processedTempoMap, ticks)
  const offsetTicks = Math.max(0, ticks - segment._startTick)
  // usPerBeat / tpb = microseconds per tick
  const offsetMicros = offsetTicks * (segment.usPerBeat / tpb)
  return (segment._accumulatedMicros + offsetMicros) / divisor
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
  const { excerptStartMs, excerptDurationMs: rawExcerptDuration } =
    resolveSongPlaybackWindow(song, { defaultDurationMs: 0 })
  const excerptDurationMs = rawExcerptDuration > 0 ? rawExcerptDuration : null

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

  // Optimization: Preprocess tempo map once if available
  const activeTempoMap = useTempoMap
    ? preprocessTempoMap(song.tempoMap, tpb)
    : []

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

      const fallbackTimeMs = (n.t / tpb) * (60000 / bpm)
      const calculatedTimeMs = useTempoMap
        ? calculateTimeFromTicks(n.t, tpb, activeTempoMap, 'ms')
        : fallbackTimeMs

      // Final sanity check on time
      const timeMs = Number.isFinite(calculatedTimeMs)
        ? calculatedTimeMs
        : fallbackTimeMs

      const excerptRelativeTimeMs = timeMs - excerptStartMs
      if (excerptRelativeTimeMs < 0) {
        return null
      }
      if (
        Number.isFinite(excerptDurationMs) &&
        excerptRelativeTimeMs > excerptDurationMs
      ) {
        return null
      }

      return {
        time: leadIn + excerptRelativeTimeMs,
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
 * Finds the insertion point (lower bound) for `target` in a sorted notes array.
 * Uses binary search on `note.time` for O(log n) performance.
 * @param {Array} notes - Sorted array of note objects.
 * @param {number} target - Target time in ms.
 * @returns {number} Index of the first note with `time >= target`.
 */
const lowerBound = (notes, target) => {
  let lo = 0
  let hi = notes.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (notes[mid].time < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Checks if a note is hit within the window.
 * Uses binary search to narrow the candidate range (O(log n + k) where
 * k = notes inside the time window), instead of scanning every note.
 * @param {Array} notes - Array of note objects sorted by time.
 * @param {number} laneIndex - The lane being triggered.
 * @param {number} elapsed - Current game time in ms.
 * @param {number} hitWindow - Allowed deviation in ms.
 * @returns {object|null} The hit note or null.
 */
export const checkHit = (notes, laneIndex, elapsed, hitWindow) => {
  if (!Number.isFinite(elapsed)) return null

  const windowStart = elapsed - hitWindow
  const windowEnd = elapsed + hitWindow

  // Binary search to find the first note that could be in range
  let i = lowerBound(notes, windowStart)

  // Scan forward through candidates within the time window
  while (i < notes.length && notes[i].time <= windowEnd) {
    const n = notes[i]
    if (
      n.visible &&
      !n.hit &&
      n.laneIndex === laneIndex &&
      n.type === 'note' &&
      Math.abs(n.time - elapsed) < hitWindow
    ) {
      return n
    }
    i++
  }
  return null
}
