import { resolveSongPlaybackWindow } from './audio/songUtils'
import { secureRandom } from './crypto'
import type { Note, Song } from '../types/audio'

type RandomFn = () => number

interface TempoMapEntry {
  tick: number
  usPerBeat: number
}

interface ProcessedTempoMapEntry extends TempoMapEntry {
  _startTick: number
  _accumulatedMicros: number
}

interface ParsedGameNote {
  time: number
  laneIndex: number
  hit: boolean
  visible: boolean
  songId: string
  originalNote?: Note
  type: 'note'
}

/**
 * Generates rhythm game notes for a given song and configuration.
 * @param {object} song - Song metadata (bpm, duration, difficulty).
 * @param {object} options - Configuration options.
 * @param {number} options.leadIn - Time in ms before first note (default 2000).
 * @param {Function} [options.random] - Optional random function (returns 0-1) for deterministic generation.
 * @returns {Array} Array of note objects.
 */
export const generateNotesForSong = (
  song: Pick<Song, 'id' | 'bpm' | 'duration' | 'difficulty'>,
  options: { leadIn?: number; random?: RandomFn } = {}
): ParsedGameNote[] => {
  const { leadIn = 2000, random = secureRandom } = options
  const notes: ParsedGameNote[] = []
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
export const preprocessTempoMap = (
  tempoMap: TempoMapEntry[] | undefined,
  tpb: number
): ProcessedTempoMapEntry[] => {
  if (!tempoMap || tempoMap.length === 0) return []
  const processed: ProcessedTempoMapEntry[] = []
  let currentTick = 0
  let totalTimeMicros = 0

  for (let i = 0; i < tempoMap.length; i++) {
    const currentTempo = tempoMap[i] as TempoMapEntry
    const nextTempo = tempoMap[i + 1] as TempoMapEntry | undefined

    // Store the state at the START of this segment
    processed.push({
      tick: currentTempo.tick,
      usPerBeat: currentTempo.usPerBeat,
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
const findTempoSegment = (
  processedMap: ProcessedTempoMapEntry[],
  ticks: number
): ProcessedTempoMapEntry => {
  let lo = 0
  let hi = processedMap.length - 1
  let candidate = processedMap[0] as ProcessedTempoMapEntry

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const entry = processedMap[mid]

    if (!entry) {
      // Tempo map should be dense after preprocessing. A missing entry indicates
      // a corrupted or sparse tempo map; fail loudly to avoid subtle binary
      // search corruption.
      throw new Error(`findTempoSegment: sparse tempo map at index ${mid}`)
    }

    if (entry._startTick <= ticks) {
      // Valid candidate, try to find a later one
      candidate = entry
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return candidate!
}

/**
 * Ensures tempo map entries contain preprocessed timing metadata.
 * @param {Array} tempoMap - Raw or preprocessed tempo map.
 * @param {number} tpb - Ticks per beat.
 * @returns {Array} Preprocessed tempo map.
 */
const ensureProcessedTempoMap = (
  tempoMap: (TempoMapEntry | ProcessedTempoMapEntry)[] | undefined,
  tpb: number
): ProcessedTempoMapEntry[] => {
  if (!Array.isArray(tempoMap) || tempoMap.length === 0) return []
  if (
    typeof (tempoMap[0] as ProcessedTempoMapEntry)?._accumulatedMicros ===
    'number'
  ) {
    return tempoMap as ProcessedTempoMapEntry[]
  }
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
export const calculateTimeFromTicks = (
  ticks: number,
  tpb: number,
  tempoMap: (TempoMapEntry | ProcessedTempoMapEntry)[] | undefined,
  unit: 'ms' | 's' = 'ms'
): number => {
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
export const parseSongNotes = (
  song: Song,
  leadIn = 2000,
  { onWarn }: { onWarn?: (message: string) => void } = {}
): ParsedGameNote[] => {
  if (!song.notes || !Array.isArray(song.notes)) return []

  const tpb = Math.max(1, song.tpb || 480) // Prevent div by zero
  const bpm = Math.max(1, song.bpm || 120) // Prevent div by zero
  const {
    excerptStartMs: _excerptStartMs,
    excerptDurationMs: rawExcerptDuration
  } = resolveSongPlaybackWindow(song, { defaultDurationMs: 0 })
  const excerptDurationMs = rawExcerptDuration > 0 ? rawExcerptDuration : null

  const laneMap: Record<string, number> = {
    guitar: 0,
    drums: 1,
    bass: 2
  }

  // ⚡ BOLT OPTIMIZATION: Replaced multiple O(N) array passes (filter, sort, filter, map, filter) with a more efficient pipeline
  const validNotes: Note[] = []
  for (let i = 0; i < song.notes.length; i++) {
    const n = song.notes[i]
    if (!n) continue
    if (typeof n.t === 'number' && Number.isFinite(n.t)) {
      validNotes.push(n)
    }
  }

  // 1. Sort valid notes by time
  validNotes.sort((a, b) => (a.t ?? 0) - (b.t ?? 0))

  // Determine timing strategy: Tempo Map vs Constant BPM
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0
  const rawTempoMap = useTempoMap
    ? (song.tempoMap as TempoMapEntry[])
    : undefined
  const activeTempoMap = useTempoMap ? preprocessTempoMap(rawTempoMap, tpb) : []

  // 2. Map and filter in a single pass, processing only every 4th note
  const gameNotes: ParsedGameNote[] = []
  for (let i = 0; i < validNotes.length; i += 4) {
    const n = validNotes[i]
    if (!n) continue

    const noteTick = n.t ?? 0
    const laneKey = typeof n.lane === 'string' ? n.lane : undefined
    const laneIndex = laneKey ? laneMap[laneKey] : undefined

    if (laneIndex === undefined) {
      if (onWarn)
        onWarn(
          `parseSongNotes: Unknown lane "${String(n.lane)}" for note at tick ${String(n.t)}. Skipping.`
        )
      continue
    }

    const fallbackTimeMs = (noteTick / tpb) * (60000 / bpm)
    const calculatedTimeMs = useTempoMap
      ? calculateTimeFromTicks(noteTick, tpb, activeTempoMap, 'ms')
      : fallbackTimeMs

    const timeMs = Number.isFinite(calculatedTimeMs)
      ? calculatedTimeMs
      : fallbackTimeMs
    const excerptRelativeTimeMs = timeMs

    if (
      excerptRelativeTimeMs < 0 ||
      (excerptDurationMs !== null && excerptRelativeTimeMs > excerptDurationMs)
    ) {
      continue
    }

    if (!Number.isFinite(excerptRelativeTimeMs)) {
      continue
    }

    gameNotes.push({
      time: leadIn + excerptRelativeTimeMs,
      laneIndex,
      hit: false,
      visible: true,
      songId: song.id,
      originalNote: n,
      type: 'note'
    })
  }

  // 4. Ensure no simultaneous notes (chords) - strictly single lane
  const uniqueTimeNotes: ParsedGameNote[] = []
  let lastTime: number | null = null

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
 * Uses binary search to narrow the candidate range (O(log n + k) where
 * k = notes inside the time window), instead of scanning every note.
 * @param {Array} notes - Array of note objects sorted by time.
 * @param {number} laneIndex - The lane being triggered.
 * @param {number} elapsed - Current game time in ms.
 * @param {number} hitWindow - Allowed deviation in ms.
 * @returns {object|null} The hit note or null.
 */
export const checkHit = (
  notes: ParsedGameNote[],
  laneIndex: number,
  elapsed: number,
  hitWindow: number
): ParsedGameNote | null => {
  if (!Number.isFinite(elapsed)) return null

  const windowStart = elapsed - hitWindow
  const windowEnd = elapsed + hitWindow

  // Binary search to find the first note that could be in range
  let lo = 0
  let hi = notes.length - 1
  let firstValidIndex = notes.length

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const midNote = notes[mid]
    if (!midNote) {
      lo = mid + 1
      continue
    }
    if (midNote.time >= windowStart) {
      firstValidIndex = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  // Scan forward through candidates within the time window
  for (let i = firstValidIndex; i < notes.length; i++) {
    const n = notes[i]
    if (!n) continue
    if (n.time >= windowEnd) break

    if (
      n.visible &&
      !n.hit &&
      n.laneIndex === laneIndex &&
      n.type === 'note' &&
      n.time > windowStart &&
      Math.abs(n.time - elapsed) < hitWindow
    ) {
      return n
    }
  }
  return null
}
