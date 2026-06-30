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

const isValidMidiPitch = (p: unknown): boolean => {
  const midiPitch = Number(p)
  return Number.isFinite(midiPitch) && midiPitch >= 0 && midiPitch <= 127
}

/**
 * Builds normalized note-density buckets for one song chart.
 *
 * @param song - Song timing and note data used to derive event density.
 * @param bucketCount - Number of timeline buckets to produce.
 * @returns Density bars with per-bucket counts and normalized intensity.
 */
export const buildSongChartDensity = (
  song: Pick<Song, 'notes' | 'tpb' | 'bpm' | 'duration'>,
  bucketCount = 16
): ChartDensityBar[] => {
  const safeBucketCount =
    Number.isFinite(bucketCount) && bucketCount > 0
      ? Math.floor(bucketCount)
      : 16
  const tpb = isFiniteNumber(song.tpb) && song.tpb > 0 ? song.tpb : 480
  const bpm = isFiniteNumber(song.bpm) && song.bpm > 0 ? song.bpm : 120
  const notes = Array.isArray(song.notes) ? song.notes : []

  let duration = 1
  if (isFiniteNumber(song.duration) && song.duration > 0) {
    duration = song.duration
  } else {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      if (!note) continue
      const time = toMidiTime(note.t, tpb, bpm)
      if (time !== null && time > duration && isValidMidiPitch(note.p)) {
        duration = time
      }
    }
  }

  const counts = new Int32Array(safeBucketCount)
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (!note) continue
    const time = toMidiTime(note.t, tpb, bpm)
    if (time === null || !isValidMidiPitch(note.p)) continue

    const index = Math.min(
      safeBucketCount - 1,
      Math.max(0, Math.floor((time / duration) * safeBucketCount))
    )
    counts[index]++
  }

  let peak = 1
  for (let i = 0; i < safeBucketCount; i++) {
    if (counts[i] > peak) {
      peak = counts[i]
    }
  }

  const result = new Array<ChartDensityBar>(safeBucketCount)
  for (let index = 0; index < safeBucketCount; index++) {
    const count = counts[index]
    result[index] = {
      timestamp: (index / safeBucketCount) * duration,
      count,
      intensity: count / peak
    }
  }
  return result
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
    Number.isFinite(bucketCount) && bucketCount > 0
      ? Math.floor(bucketCount)
      : 16

  if (!songs || songs.length === 0) return []

  const counts = new Int32Array(safeBucketCount)
  let firstSetDuration = 0
  let hasFirstSet = false

  for (let s = 0; s < songs.length; s++) {
    const song = songs[s]
    if (!song) continue

    const tpb = isFiniteNumber(song.tpb) && song.tpb > 0 ? song.tpb : 480
    const bpm = isFiniteNumber(song.bpm) && song.bpm > 0 ? song.bpm : 120
    const notes = Array.isArray(song.notes) ? song.notes : []

    let duration = 1
    if (isFiniteNumber(song.duration) && song.duration > 0) {
      duration = song.duration
    } else {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        if (!note) continue
        const time = toMidiTime(note.t, tpb, bpm)
        if (time !== null && time > duration && isValidMidiPitch(note.p)) {
          duration = time
        }
      }
    }

    if (!hasFirstSet) {
      firstSetDuration = duration
      hasFirstSet = true
    }

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      if (!note) continue
      const time = toMidiTime(note.t, tpb, bpm)
      if (time === null || !isValidMidiPitch(note.p)) continue

      const index = Math.min(
        safeBucketCount - 1,
        Math.max(0, Math.floor((time / duration) * safeBucketCount))
      )
      counts[index]++
    }
  }

  if (!hasFirstSet) return []

  let peak = 1
  for (let i = 0; i < safeBucketCount; i++) {
    if (counts[i] > peak) {
      peak = counts[i]
    }
  }

  const result = new Array<ChartDensityBar>(safeBucketCount)
  for (let index = 0; index < safeBucketCount; index++) {
    const count = counts[index]
    result[index] = {
      timestamp: (index / safeBucketCount) * firstSetDuration,
      count,
      intensity: count / peak
    }
  }
  return result
}
