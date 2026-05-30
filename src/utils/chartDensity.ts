import { buildMidiTrackEvents } from './audio/midiUtils'
import { isFiniteNumber } from './finiteNumber'
import type { Song } from '../types/audio'

export interface ChartDensityBar {
  timestamp: number
  count: number
  intensity: number
}

const toMidiTime = (tick: unknown, tpb: number, bpm: number): number | null => {
  if (!isFiniteNumber(tick) || tick < 0) return null
  return (tick / tpb) * (60 / bpm)
}

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
  const counts = Array.from({ length: safeBucketCount }, () => 0)

  for (const event of events) {
    const index = Math.min(
      safeBucketCount - 1,
      Math.max(0, Math.floor((event.time / duration) * safeBucketCount))
    )
    const current = counts[index]
    if (current !== undefined) counts[index] = current + 1
  }

  const peak = Math.max(1, ...counts)
  return counts.map((count, index) => ({
    timestamp: (index / safeBucketCount) * duration,
    count,
    intensity: count / peak
  }))
}

export const buildSetlistChartDensity = (
  songs: Array<Pick<Song, 'notes' | 'tpb' | 'bpm' | 'duration'>>,
  bucketCount = 16
): ChartDensityBar[] => {
  const densitySets = songs
    .map(song => buildSongChartDensity(song, bucketCount))
    .filter(bars => bars.length > 0)
  const firstSet = densitySets[0]
  if (!firstSet) return []

  const numBuckets = firstSet.length
  const counts = new Array(numBuckets).fill(0)
  const numSets = densitySets.length

  for (let i = 0; i < numSets; i++) {
    const bars = densitySets[i]
    if (!bars) continue
    for (let j = 0; j < numBuckets; j++) {
      counts[j] += bars[j]?.count ?? 0
    }
  }

  let peak = 1
  for (let i = 0; i < numBuckets; i++) {
    if (counts[i] > peak) peak = counts[i]
  }

  const result = new Array(numBuckets)
  for (let index = 0; index < numBuckets; index++) {
    const count = counts[index]
    result[index] = {
      timestamp: firstSet[index]?.timestamp ?? index,
      count,
      intensity: count / peak
    }
  }

  return result
}
