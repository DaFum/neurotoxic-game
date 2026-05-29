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
  const duration =
    isFiniteNumber(song.duration) && song.duration > 0
      ? song.duration
      : Math.max(1, ...events.map(event => event.time))
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

  const counts = firstSet.map((_, index) =>
    densitySets.reduce((sum, bars) => sum + (bars[index]?.count ?? 0), 0)
  )
  const peak = Math.max(1, ...counts)

  return counts.map((count, index) => ({
    timestamp: firstSet[index]?.timestamp ?? index,
    count,
    intensity: count / peak
  }))
}
