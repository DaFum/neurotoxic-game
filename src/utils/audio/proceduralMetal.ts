import * as Tone from 'tone'
import { audioState } from './state'
import { prepareTransportPlayback } from './playbackUtils'
import { playDrumNote } from './drumMappings'
import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { selectRandomItem } from './selectionUtils'
import type { Song } from '../../types/audio'

/**
 * Generates a procedural riff pattern.
 * @param diff - Difficulty level.
 * @param random - Random number generator function.
 * @returns Array of note strings or nulls.
 */
function generateRiffPattern(
  diff: number,
  random: () => number
): Array<string | null> {
  const steps = 16
  const pattern: Array<string | null> = []
  const density = 0.3 + diff * 0.1

  for (let i = 0; i < steps; i++) {
    if (random() < density) {
      if (diff <= 2) pattern.push(random() > 0.8 ? 'E3' : 'E2')
      else if (diff <= 4)
        pattern.push(random() > 0.7 ? (random() > 0.5 ? 'F2' : 'G2') : 'E2')
      else {
        const notes = ['E2', 'A#2', 'F2', 'C3', 'D#3']
        pattern.push(selectRandomItem(notes, random))
      }
    } else {
      pattern.push(null)
    }
  }
  return pattern
}

/**
 * Plays procedural drums using modern drum mappings.
 * @param time - Audio time.
 * @param diff - Difficulty.
 * @param note - The guitar note played on this step.
 * @param random - Random number generator.
 */
function playProceduralDrums(
  time: number,
  diff: number,
  note: string | null,
  random: () => number
): void {
  if (!audioState.drumKit) return

  if (diff === 5) {
    playDrumNote(36, time, 1) // Kick
    if (random() > 0.5) {
      playDrumNote(38, time, 1) // Snare
    }
    playDrumNote(42, time, 0.7) // HiHat (0.7 velScale * 0.7 = ~0.49 velocity)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      playDrumNote(36, time, 1) // Kick
    }
    if (random() > 0.9) {
      playDrumNote(38, time, 1) // Snare
    }
    // Hihat on the beat — the 0.1 lower bound is intentional for musical density
    const beatPhase = time % 0.25
    if (beatPhase < 0.1 || beatPhase > 0.24) {
      playDrumNote(42, time, 1) // HiHat
    }
  }
}

// The actual generation logic
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param song - The song object containing metadata like BPM and difficulty.
 * @param delay - Delay in seconds before the audio starts. Defaults to `0`.
 * @param options - Playback options forwarded to transport setup.
 * - `options.useCleanPlayback` - Boolean that controls whether playback bypasses FX.
 * - `options.onEnded` - Callback invoked when playback ends.
 * - `options.stopAfterSeconds` - Number of seconds before playback stops.
 * - `options.startTimeSec` - Absolute Tone.js start time in seconds.
 * @param random - RNG function for deterministic generation. Defaults to `secureRandom`.
 * @returns Whether procedural playback started successfully after setup.
 */
export async function startMetalGenerator(
  song: Partial<Song>,
  delay = 0,
  options: Record<string, unknown> = {},
  random: () => number = secureRandom
): Promise<boolean> {
  const { success, reqId, normalizedOptions } =
    await prepareTransportPlayback(options)
  if (!success) return false
  const { onEnded } = normalizedOptions

  // Guard BPM against zero/negative/falsy values
  // Use ?? for difficulty to correctly handle 0 as a valid difficulty
  const rawBpm = song.bpm || 80 + (song.difficulty ?? 2) * 30
  const bpm = Math.max(1, rawBpm)

  Tone.getTransport().bpm.value = bpm

  const pattern = generateRiffPattern(song.difficulty ?? 2, random)

  audioState.loop = new Tone.Sequence<string | null>(
    (time, note: string | null) => {
      if (!audioState.guitar || !audioState.drumKit) return
      if (audioState.guitar.disposed || audioState.drumKit.kick.disposed) return
      try {
        if (note) audioState.guitar.triggerAttackRelease(note, '16n', time)
        playProceduralDrums(time, song.difficulty ?? 2, note, random)
      } catch (err) {
        if (err instanceof Error && err.name === 'InvalidStateError') {
          logger.warn(
            'AudioEngine',
            'Sequence callback InvalidStateError (context closing?)',
            err
          )
        } else {
          throw err
        }
      }
    },
    pattern,
    '16n'
  )

  if (audioState.loop) audioState.loop.start(0)

  // Explicit race condition check with cleanup for robustness
  if (reqId !== audioState.playRequestId) {
    if (audioState.loop) {
      audioState.loop.dispose()
      audioState.loop = null
    }
    return false
  }

  // Schedule Transport.start in advance to prevent pops/crackles
  // Using "+0.1" schedules 100ms ahead for reliable scheduling
  const startDelay = Math.max(0.1, delay)

  const duration =
    song.duration ||
    (song.excerptDurationMs ? song.excerptDurationMs / 1000 : 0)

  if (duration > 0 && onEnded) {
    Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded()
    }, duration)
  }

  Tone.getTransport().start(`+${startDelay}`)
  return true
}
