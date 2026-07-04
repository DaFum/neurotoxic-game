import { buildMidiTrackEvents } from './audio/midiUtils'
import { isFiniteNumber } from './finiteNumber'
import type { Song } from '../types/audio'

/**
 * Aggregated note density for one chart timeline bucket.
 */
export interface ChartDensityBar {
  /** Bucket start time in seconds. */
  timestamp: number
  /** Number of note events inside the bucket. */
  count: number
  /** Bucket density normalized against the busiest bucket. */
  intensity: number
}

const toMidiTime = (tick: unknown, tpb: number, bpm: number): number | null => {
  if (!isFiniteNumber(tick) || tick < 0) return null
  return (tick / tpb) * (60 / bpm)
}

/**
 * Builds the MIDI events and effective duration for one song chart. Shared by
 * {@link buildSetlistChartDensity}.
 */
const buildSongDensityEvents = (
  song: Pick<Song, 'notes' | 'tpb' | 'bpm' | 'duration'>
): { events: ReturnType<typeof buildMidiTrackEvents>; duration: number } => {
  const tpb = isFiniteNumber(song.tpb) && song.tpb > 0 ? song.tpb : 480
  const bpm = isFiniteNumber(song.bpm) && song.bpm > 0 ? song.bpm : 120
  const notes = Array.isArray(song.notes) ? song.notes : []
  const midiNotes: Array<{ time: number; midi: unknown; velocity?: unknown }> =
    []

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (!note) continue
    const time = toMidiTime(note?.t, tpb, bpm)
    if (time === null) continue
    midiNotes.push({
      time,
      midi: note?.p,
      velocity: note?.velocity
    })
  }

  const events = buildMidiTrackEvents(midiNotes)
  let duration = 1
  if (isFiniteNumber(song.duration) && song.duration > 0) {
    duration = song.duration
  } else {
    for (const event of events) {
      if (event.time > duration) {
        duration = event.time
      }
    }
  }

  return { events, duration }
}

/**
 * Buckets a song's MIDI events into a shared count array, normalized against the
 * supplied effective duration. Shared by the per-song and setlist builders.
 */
const accumulateDensityCounts = (
  events: ReturnType<typeof buildMidiTrackEvents>,
  duration: number,
  counts: Int32Array,
  safeBucketCount: number
): void => {
  for (const event of events) {
    const index = Math.min(
      safeBucketCount - 1,
      Math.max(0, Math.floor((event.time / duration) * safeBucketCount))
    )
    counts[index] = (counts[index] ?? 0) + 1
  }
}

/**
 * Combines multiple song density charts into one setlist-level density profile.
 *
 * @param songs - Songs whose note charts should be merged.
 * @param bucketCount - Number of timeline buckets to compute per song.
 * @returns Density bars using summed counts across the setlist.
 */
export const buildSetlistChartDensity = (
  songs: Array<Pick<Song, 'notes' | 'tpb' | 'bpm' | 'duration'>>,
  bucketCount = 16
): ChartDensityBar[] => {
  const safeBucketCount =
    Number.isFinite(bucketCount) && bucketCount >= 1
      ? Math.floor(bucketCount)
      : 16

  if (!songs || songs.length === 0) return []

  const counts = new Int32Array(safeBucketCount)
  let firstSetDuration = 0
  let hasFirstSet = false

  for (let s = 0; s < songs.length; s++) {
    const song = songs[s]
    if (!song) continue

    const { events, duration } = buildSongDensityEvents(song)

    if (!hasFirstSet) {
      firstSetDuration = duration
      hasFirstSet = true
    }

    accumulateDensityCounts(events, duration, counts, safeBucketCount)
  }

  if (!hasFirstSet) return []

  let peak = 1
  for (let i = 0; i < safeBucketCount; i++) {
    const currentCount = counts[i] ?? 0
    if (currentCount > peak) peak = currentCount
  }

  const result = new Array<ChartDensityBar>(safeBucketCount)
  for (let index = 0; index < safeBucketCount; index++) {
    const count = counts[index] ?? 0
    result[index] = {
      timestamp: (index / safeBucketCount) * firstSetDuration,
      count,
      intensity: count / peak
    }
  }

  return result
}
