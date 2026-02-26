import * as Tone from 'tone'
import { audioState } from './state.js'
import { ensureAudioContext } from './setup.js'
import { stopAudioInternal } from './playback.js'
import { normalizeMidiPlaybackOptions } from './playbackUtils.js'

/**
 * Generates a procedural riff pattern.
 * @param {number} diff - Difficulty level.
 * @param {Function} random - Random number generator function.
 * @returns {Array} Array of note strings or nulls.
 */
function generateRiffPattern(diff, random) {
  const steps = 16
  const pattern = []
  const density = 0.3 + diff * 0.1

  for (let i = 0; i < steps; i++) {
    if (random() < density) {
      if (diff <= 2) pattern.push(random() > 0.8 ? 'E3' : 'E2')
      else if (diff <= 4)
        pattern.push(random() > 0.7 ? (random() > 0.5 ? 'F2' : 'G2') : 'E2')
      else {
        const notes = ['E2', 'A#2', 'F2', 'C3', 'D#3']
        pattern.push(notes[Math.floor(random() * notes.length)])
      }
    } else {
      pattern.push(null)
    }
  }
  return pattern
}

/**
 * Plays procedural drums based on legacy logic.
 * @param {number} time - Audio time.
 * @param {number} diff - Difficulty.
 * @param {string|null} note - The guitar note played on this step.
 * @param {Function} random - Random number generator.
 */
function playDrumsLegacy(time, diff, note, random) {
  if (diff === 5) {
    audioState.drumKit.kick.triggerAttackRelease('C1', '16n', time)
    if (random() > 0.5) {
      audioState.drumKit.snare.triggerAttackRelease('16n', time)
    }
    audioState.drumKit.hihat.triggerAttackRelease(8000, '32n', time, 0.5)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      audioState.drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (random() > 0.9) {
      audioState.drumKit.snare.triggerAttackRelease('16n', time)
    }
    // Hihat on the beat — the 0.1 lower bound is intentional for musical density
    const beatPhase = time % 0.25
    if (beatPhase < 0.1 || beatPhase > 0.24) {
      audioState.drumKit.hihat.triggerAttackRelease(8000, '32n', time)
    }
  }
}

// The actual generation logic (Legacy / Fallback)
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param {object} song - The song object containing metadata like BPM and difficulty.
 * @param {number} [delay=0] - Delay in seconds before the audio starts.
 * @param {Function} [random=Math.random] - RNG function for deterministic generation.
 * @returns {Promise<boolean>}
 */
export async function startMetalGenerator(
  song,
  delay = 0,
  options = {},
  random = Math.random
) {
  const { onEnded } = normalizeMidiPlaybackOptions(options)
  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== audioState.playRequestId) return false

  stopAudioInternal()
  Tone.getTransport().cancel()
  Tone.getTransport().position = 0

  // Guard BPM against zero/negative/falsy values
  // Use ?? for difficulty to correctly handle 0 as a valid difficulty
  const rawBpm = song.bpm || 80 + (song.difficulty ?? 2) * 30
  const bpm = Math.max(1, rawBpm)

  Tone.getTransport().bpm.value = bpm

  const pattern = generateRiffPattern(song.difficulty ?? 2, random)

  audioState.loop = new Tone.Sequence(
    (time, note) => {
      if (!audioState.guitar || !audioState.drumKit) return

      if (note) audioState.guitar.triggerAttackRelease(note, '16n', time)

      playDrumsLegacy(time, song.difficulty ?? 2, note, random)
    },
    pattern,
    '16n'
  )

  audioState.loop.start(0)

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
