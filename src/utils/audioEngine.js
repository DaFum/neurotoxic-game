/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file contains side-effects (Tone.start, AudioContext creation) as per architectural design exceptions.
 */

import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import { calculateTimeFromTicks } from './rhythmUtils'
import { SONGS_DB } from '../data/songs'
import { selectRandomItem } from './audioSelectionUtils.js'
import {
  normalizeMidiPlaybackOptions,
  resolveMidiAssetUrl
} from './audioPlaybackUtils.js'
import { logger } from './logger.js'

// Import all MIDI files as URLs
const midiGlob = import.meta.glob('../assets/**/*.mid', {
  query: '?url',
  import: 'default',
  eager: true
})

const MIN_NOTE_DURATION = 0.05
const OFFSET_RESET_THRESHOLD = 0.1

const HIHAT_CONFIG = {
  envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 24,
  resonance: 5000,
  octaves: 1.2
}

const CRASH_CONFIG = {
  envelope: { attack: 0.002, decay: 1.5, release: 0.1 },
  harmonicity: 3.5,
  modulationIndex: 12,
  resonance: 3000,
  octaves: 2.0
}

// Create a map of relative asset path + basename -> URL
// Key format in glob is "../assets/path/to/filename.mid"
const midiUrlMap = Object.fromEntries(
  Object.entries(midiGlob).flatMap(([path, url]) => {
    const relativePath = path.replace('../assets/', '')
    const filename = relativePath.split('/').pop()
    const entries = [[relativePath, url]]
    if (filename && filename !== relativePath) {
      entries.push([filename, url])
    }
    return entries
  })
)

let guitar, bass, drumKit, loop, part
let sfxSynth, sfxGain
let masterLimiter, masterComp, reverb, reverbSend
let distortion, guitarChorus, guitarEq, widener
let bassEq, bassComp
let drumBus
let midiDryBus, midiLead, midiBass, midiDrumKit, midiReverb, midiReverbSend
let isSetup = false
let playRequestId = 0
let transportEndEventId = null
let transportStopEventId = null

/**
 * Clears any scheduled transport end callback.
 * @returns {void}
 */
const clearTransportEndEvent = () => {
  if (transportEndEventId == null) return
  try {
    Tone.Transport.clear(transportEndEventId)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to clear transport end event', error)
  } finally {
    transportEndEventId = null
  }
}

/**
 * Clears any scheduled transport stop callback.
 * @returns {void}
 */
const clearTransportStopEvent = () => {
  if (transportStopEventId == null) return
  try {
    Tone.Transport.clear(transportStopEventId)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to clear transport stop event', error)
  } finally {
    transportStopEventId = null
  }
}

/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (isSetup) return

  try {
    await Tone.start()
  } catch (e) {
    // Browser autoplay policy might block this; it will be resumed later via ensureAudioContext
    console.warn('[audioEngine] Tone.start() was blocked or failed:', e)
  }

  // === Master Chain ===
  // Limiter prevents clipping, Compressor glues the mix
  masterLimiter = new Tone.Limiter(-3).toDestination()
  masterComp = new Tone.Compressor(-18, 4).connect(masterLimiter)

  // Global reverb send for natural space
  reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(masterComp)
  reverbSend = new Tone.Gain(0.3).connect(reverb)

  // === Guitar ===
  // FM synthesis for richer harmonic content
  guitar = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 3,
    oscillator: { type: 'sawtooth' },
    modulation: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.15, release: 0.3 },
    modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
  })

  distortion = new Tone.Distortion(0.4)
  guitarChorus = new Tone.Chorus(4, 2.5, 0.3).start()
  guitarEq = new Tone.EQ3(-1, -3, 3) // Gentle mid scoop
  widener = new Tone.StereoWidener(0.5)

  guitar.chain(distortion, guitarChorus, guitarEq, widener, masterComp)
  guitar.connect(reverbSend)

  // === Bass ===
  // MonoSynth with fatsawtooth-based waveform for warmer, fuller tone
  bass = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'fatsawtooth', spread: 10, count: 3 },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.3 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.3,
      sustain: 0.2,
      baseFrequency: 100,
      octaves: 2.5
    }
  })

  bassEq = new Tone.EQ3(3, -1, -4)
  bassComp = new Tone.Compressor(-15, 5)
  bass.chain(bassComp, bassEq, masterComp)

  // === Drums ===
  // Drum bus with own reverb send
  drumBus = new Tone.Gain(1).connect(masterComp)
  drumBus.connect(reverbSend)

  drumKit = {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
    }).connect(drumBus),
    snare: (() => {
      // Layered snare: noise (crack) + membrane (body)
      const snareBus = new Tone.Volume(0).connect(drumBus)
      const snareNoise = new Tone.NoiseSynth({
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
        noise: { type: 'white' }
      }).connect(snareBus)
      const snareBody = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
      }).connect(snareBus)
      snareBody.volume.value = -4
      // Return a proxy object that triggers both layers
      return {
        triggerAttackRelease: (dur, time, vel = 1) => {
          snareNoise.triggerAttackRelease(dur, time, vel)
          snareBody.triggerAttackRelease('G3', dur, time, vel * 0.6)
        },
        volume: snareBus.volume,
        dispose: () => {
          snareNoise.dispose()
          snareBody.dispose()
          snareBus.dispose()
        },
        _noise: snareNoise,
        _body: snareBody
      }
    })(),
    hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(drumBus),
    crash: new Tone.MetalSynth(CRASH_CONFIG).connect(drumBus)
  }

  // Level Mixing (more balanced)
  drumKit.kick.volume.value = 2
  drumKit.snare.volume.value = 0
  drumKit.hihat.volume.value = -12
  drumKit.crash.volume.value = -8

  // Instrument Volumes
  guitar.volume.value = -2
  bass.volume.value = 0

  // === SFX Synth ===
  sfxGain = new Tone.Gain(0.25).connect(masterLimiter)
  sfxSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
  }).connect(sfxGain)

  // === Clean MIDI Chain ===
  // Used for ambient playback. Richer synths with subtle spatial processing
  // to faithfully represent the MIDI content without heavy coloration.
  midiDryBus = new Tone.Gain(1).connect(masterComp)

  // Subtle reverb for spatial depth on ambient MIDI playback
  midiReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(masterComp)
  midiReverbSend = new Tone.Gain(0.25).connect(midiReverb)
  midiDryBus.connect(midiReverbSend)

  // Lead/Guitar: FM synthesis for richer harmonic content
  midiLead = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 2.5,
    oscillator: { type: 'sawtooth' },
    modulation: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.4 },
    modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
  }).connect(midiDryBus)

  // Bass: Fatter oscillator for warmth and presence
  midiBass = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', spread: 10, count: 3 },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.3 }
  }).connect(midiDryBus)
  midiBass.volume.value = -3

  // Drums: Layered snare (noise + body) matching main drumKit quality
  const midiSnareBus = new Tone.Volume(0).connect(midiDryBus)
  const midiSnareNoise = new Tone.NoiseSynth({
    envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
    noise: { type: 'white' }
  }).connect(midiSnareBus)
  const midiSnareBody = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
  }).connect(midiSnareBus)
  midiSnareBody.volume.value = -4

  midiDrumKit = {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.2 }
    }).connect(midiDryBus),
    snare: {
      triggerAttackRelease: (dur, time, vel = 1) => {
        midiSnareNoise.triggerAttackRelease(dur, time, vel)
        midiSnareBody.triggerAttackRelease('G3', dur, time, vel * 0.6)
      },
      volume: midiSnareBus.volume,
      dispose: () => {
        midiSnareNoise.dispose()
        midiSnareBody.dispose()
        midiSnareBus.dispose()
      }
    },
    hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(midiDryBus),
    crash: new Tone.MetalSynth(CRASH_CONFIG).connect(midiDryBus)
  }

  // MIDI drum levels
  midiDrumKit.kick.volume.value = 2
  midiDrumKit.hihat.volume.value = -10
  midiDrumKit.crash.volume.value = -6

  isSetup = true
}

/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<void>}
 */
export async function ensureAudioContext() {
  if (!isSetup) await setupAudio()
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
}

/**
 * Plays a sound effect by type.
 * @param {string} type - The type of SFX ('hit', 'miss', 'menu', 'travel', 'cash').
 */
export function playSFX(type) {
  if (!isSetup || !sfxSynth) return

  const now = Tone.now()
  switch (type) {
    case 'hit':
      // High pitch success ping
      sfxSynth.triggerAttackRelease('A5', '16n', now)
      break
    case 'miss':
      // Low discordant buzz
      sfxSynth.triggerAttackRelease('D2', '8n', now)
      break
    case 'menu':
      // Gentle blip
      sfxSynth.triggerAttackRelease('C5', '32n', now, 0.3)
      break
    case 'travel':
      // Engine-like rumble using drum kick if available, or low synth
      if (drumKit && drumKit.kick) {
        drumKit.kick.triggerAttackRelease('C1', '8n', now, 0.5)
      } else {
        sfxSynth.triggerAttackRelease('G1', '8n', now, 0.5)
      }
      break
    case 'cash':
      // Bright chime/coin sound
      sfxSynth.triggerAttackRelease('B5', '16n', now, 0.4)
      sfxSynth.triggerAttackRelease('E6', '16n', now + 0.05, 0.4)
      break
    default:
      console.warn(`[audioEngine] Unknown SFX type: ${type}`)
      break
  }
}

/**
 * Sets the SFX volume.
 * @param {number} vol - Volume between 0 and 1.
 */
export function setSFXVolume(vol) {
  if (sfxGain) {
    // Convert 0-1 linear to decibels (approximate or use ramp)
    // Tone.Gain accepts linear values if units are default, but volume is typically db.
    // However, Tone.Gain.gain is linear amplitude.
    sfxGain.gain.rampTo(Math.max(0, Math.min(1, vol)), 0.1)
  }
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0) {
  const reqId = ++playRequestId
  await ensureAudioContext()
  if (reqId !== playRequestId) return false

  stopAudioInternal()
  Tone.Transport.cancel()
  Tone.Transport.position = 0

  const bpm = Math.max(1, song.bpm || 120) // Ensure BPM is positive
  const tpb = Math.max(1, song.tpb || 480) // Ensure TPB is positive
  Tone.Transport.bpm.value = bpm

  // Validate notes
  if (!Array.isArray(song.notes)) {
    console.error('playSongFromData: song.notes is not an array')
    return false
  }

  // Validate Audio Components
  if (!guitar || !bass || !drumKit) {
    console.error('playSongFromData: Audio components not initialized.')
    return false
  }

  // Fallback if tempoMap is missing/empty
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0

  const events = song.notes
    .filter(n => {
      // Validate note data
      return (
        typeof n.t === 'number' &&
        isFinite(n.t) &&
        typeof n.p === 'number' &&
        isFinite(n.p) &&
        typeof n.v === 'number' &&
        isFinite(n.v)
      )
    })
    .map(n => {
      let time = 0
      if (useTempoMap) {
        time = calculateTimeFromTicks(n.t, tpb, song.tempoMap, 's')
      } else {
        // Fallback: ticks -> seconds using constant BPM
        time = (n.t / tpb) * (60 / bpm)
      }

      // Clamp velocity 0-127 and normalize
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      // Ensure time and delay are valid numbers
      const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
      const finalTime = Number.isFinite(time) ? time + validDelay : -1

      // Invalid times are caught by the filter below
      return {
        time: finalTime,
        note: n.p,
        velocity: rawVelocity / 127,
        lane: n.lane
      }
    })
    // Filter out notes with invalid or negative times to prevent clustering/errors
    .filter(e => Number.isFinite(e.time) && e.time >= 0)

  if (events.length === 0) {
    console.warn('playSongFromData: No valid notes found to schedule')
    return false
  }

  part = new Tone.Part((time, value) => {
    if (!guitar || !bass || !drumKit) return

    const noteName = Tone.Frequency(value.note, 'midi').toNote()

    if (value.lane === 'guitar') {
      guitar.triggerAttackRelease(noteName, '16n', time, value.velocity)
    } else if (value.lane === 'bass') {
      bass.triggerAttackRelease(noteName, '8n', time, value.velocity)
    } else if (value.lane === 'drums') {
      playDrumNote(value.note, time, value.velocity)
    }
  }, events).start(0)

  Tone.Transport.start()
  return true
}

/**
 * Triggers a specific drum sound based on MIDI pitch.
 * @param {number} midiPitch - The MIDI note number.
 * @param {number} time - The time to trigger the note.
 * @param {number} velocity - The velocity of the note (0-1).
 */
function playDrumNote(midiPitch, time, velocity, kit = drumKit) {
  if (!kit) return
  // GM Percussion Mapping
  switch (midiPitch) {
    case 35: // Acoustic Kick
    case 36: // Electric Kick
      kit.kick.triggerAttackRelease('C1', '8n', time, velocity)
      break
    case 37: // Side Stick
      kit.snare.triggerAttackRelease('32n', time, velocity * 0.4)
      break
    case 38: // Acoustic Snare
    case 40: // Electric Snare
      kit.snare.triggerAttackRelease('16n', time, velocity)
      break
    case 42: // Closed HiHat
    case 44: // Pedal HiHat
      kit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.7)
      break
    case 46: // Open HiHat
      kit.hihat.triggerAttackRelease(6000, '16n', time, velocity * 0.8)
      break
    case 49: // Crash 1
    case 57: // Crash 2
      kit.crash.triggerAttackRelease(4000, '4n', time, velocity * 0.7)
      break
    case 51: // Ride Cymbal
    case 59: // Ride Bell
      kit.hihat.triggerAttackRelease(5000, '8n', time, velocity * 0.5)
      break
    case 41: // Low Floor Tom
    case 43: // High Floor Tom
      kit.kick.triggerAttackRelease('G1', '8n', time, velocity * 0.8)
      break
    case 45: // Low Tom
    case 47: // Low-Mid Tom
      kit.kick.triggerAttackRelease('D2', '8n', time, velocity * 0.7)
      break
    case 48: // Hi-Mid Tom
    case 50: // High Tom
      kit.kick.triggerAttackRelease('A2', '8n', time, velocity * 0.6)
      break
    default:
      // Default to closed HiHat for unknown percussion
      kit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.4)
  }
}

// The actual generation logic (Legacy / Fallback)
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param {object} song - The song object containing metadata like BPM and difficulty.
 * @param {number} [delay=0] - Delay in seconds before the audio starts.
 * @param {Function} [random=Math.random] - RNG function for deterministic generation.
 * @returns {Promise<void>}
 */
export async function startMetalGenerator(
  song,
  delay = 0,
  random = Math.random
) {
  const reqId = ++playRequestId
  await ensureAudioContext()
  if (reqId !== playRequestId) return false

  stopAudioInternal()
  Tone.Transport.cancel()
  Tone.Transport.position = 0

  // Guard BPM against zero/negative/falsy values
  const rawBpm = song.bpm || 80 + (song.difficulty || 2) * 30
  const bpm = Math.max(1, rawBpm)

  Tone.Transport.bpm.value = bpm

  const pattern = generateRiffPattern(song.difficulty || 2, random)

  loop = new Tone.Sequence(
    (time, note) => {
      if (!guitar || !drumKit) return

      if (note) guitar.triggerAttackRelease(note, '16n', time)

      playDrumsLegacy(time, song.difficulty || 2, note, random)
    },
    pattern,
    '16n'
  )

  loop.start(0)

  // Explicit race condition check with cleanup for robustness
  if (reqId !== playRequestId) {
    if (loop) {
      loop.dispose()
      loop = null
    }
    return
  }

  Tone.Transport.start(Tone.now() + Math.max(0, delay))
  return true
}

/**
 * Stops the audio transport and disposes of the current loop.
 * Also invalidates any pending playback requests.
 */
export function stopAudio() {
  playRequestId++
  logger.debug(
    'AudioEngine',
    `stopAudio called. Invalidating reqs. New reqId: ${playRequestId}`
  )
  stopAudioInternal()
}

/**
 * Internal function to stop audio without invalidating pending requests.
 * Used by playback functions to clear previous state.
 */
function stopAudioInternal() {
  Tone.Transport.stop()
  Tone.Transport.position = 0
  if (loop) {
    loop.dispose()
    loop = null
  }
  if (part) {
    part.dispose()
    part = null
  }
  Tone.Transport.cancel()
  clearTransportEndEvent()
  clearTransportStopEvent()
}

/**
 * Pauses the audio transport.
 */
export function pauseAudio() {
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause()
  }
}

/**
 * Resumes the audio transport.
 */
export function resumeAudio() {
  if (Tone.Transport.state === 'paused') {
    Tone.Transport.start()
  }
}

/**
 * Disposes of audio engine resources.
 */
export function disposeAudio() {
  playRequestId++
  stopAudioInternal()
  if (guitar) guitar.dispose()
  if (bass) bass.dispose()
  if (drumKit) {
    drumKit.kick.dispose()
    // Layered snare has custom dispose
    if (drumKit.snare.dispose) drumKit.snare.dispose()
    drumKit.hihat.dispose()
    drumKit.crash.dispose()
  }
  if (sfxSynth) sfxSynth.dispose()
  if (sfxGain) sfxGain.dispose()
  if (midiLead) midiLead.dispose()
  if (midiBass) midiBass.dispose()
  if (midiDrumKit) {
    midiDrumKit.kick.dispose()
    if (midiDrumKit.snare.dispose) midiDrumKit.snare.dispose()
    midiDrumKit.hihat.dispose()
    midiDrumKit.crash.dispose()
  }
  if (midiReverbSend) midiReverbSend.dispose()
  if (midiReverb) midiReverb.dispose()
  if (midiDryBus) midiDryBus.dispose()

  if (distortion) distortion.dispose()
  if (guitarChorus) guitarChorus.dispose()
  if (guitarEq) guitarEq.dispose()
  if (widener) widener.dispose()

  if (bassEq) bassEq.dispose()
  if (bassComp) bassComp.dispose()

  if (drumBus) drumBus.dispose()

  if (reverbSend) reverbSend.dispose()
  if (reverb) reverb.dispose()
  if (masterComp) masterComp.dispose()
  if (masterLimiter) masterLimiter.dispose()

  guitar = null
  bass = null
  drumKit = null
  sfxSynth = null
  sfxGain = null
  midiLead = null
  midiBass = null
  midiDrumKit = null
  midiReverbSend = null
  midiReverb = null
  midiDryBus = null

  distortion = null
  guitarChorus = null
  guitarEq = null
  widener = null
  bassEq = null
  bassComp = null
  drumBus = null

  masterLimiter = null
  masterComp = null
  reverb = null
  reverbSend = null

  isSetup = false
}

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
    drumKit.kick.triggerAttackRelease('C1', '16n', time)
    if (random() > 0.5) drumKit.snare.triggerAttackRelease('16n', time)
    drumKit.hihat.triggerAttackRelease(8000, '32n', time, 0.5)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (random() > 0.9) {
      drumKit.snare.triggerAttackRelease('16n', time)
    }
    // Fix floating point tolerance issues
    const beatPhase = time % 0.25
    if (beatPhase < 0.1 || beatPhase > 0.24) {
      drumKit.hihat.triggerAttackRelease(8000, '32n', time)
    }
  }
}

// --- New MIDI Logic ---

/**
 * Plays a MIDI file from a URL.
 * @param {string} filename - The filename of the MIDI (key in url map).
 * @param {number} [offset=0] - Start offset in seconds.
 * @param {boolean} [loop=false] - Whether to loop the playback.
 * @param {number} [delay=0] - Delay in seconds before starting playback.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.useCleanPlayback=true] - If true, bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked after playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 */
export async function playMidiFile(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {}
) {
  const { onEnded, useCleanPlayback, stopAfterSeconds } =
    normalizeMidiPlaybackOptions(options)
  logger.debug(
    'AudioEngine',
    `Request playMidiFile: ${filename}, offset=${offset}, loop=${loop}`
  )
  // Requirement: Stop previous playback immediately
  const reqId = ++playRequestId
  logger.debug('AudioEngine', `New playRequestId: ${reqId}`)

  await ensureAudioContext()
  if (reqId !== playRequestId) {
    logger.debug(
      'AudioEngine',
      `Request cancelled during ensureAudioContext (reqId: ${reqId} vs ${playRequestId})`
    )
    return
  }

  stopAudioInternal()
  Tone.Transport.cancel()

  const { url, source } = resolveMidiAssetUrl(filename, midiUrlMap)
  logger.debug(
    'AudioEngine',
    `Resolved MIDI URL for ${filename}: ${url} (source=${source ?? 'none'})`
  )

  if (!url) {
    console.error(`[audioEngine] MIDI file not found in assets: ${filename}`)
    return false
  }

  try {
    const response = await fetch(url)
    if (reqId !== playRequestId) return false
    if (!response.ok) throw new Error(`Failed to load MIDI: ${url}`)
    const arrayBuffer = await response.arrayBuffer()
    if (reqId !== playRequestId) return false

    const midi = new Midi(arrayBuffer)
    if (reqId !== playRequestId) return false // Optimization: fail fast before expensive scheduling

    logger.debug('AudioEngine', `MIDI loaded. Duration: ${midi.duration}s`)

    if (midi.duration <= 0) {
      logger.warn(
        'AudioEngine',
        `MIDI duration is ${midi.duration}s. Skipping playback.`
      )
      return false
    }

    if (midi.header.tempos.length > 0) {
      Tone.Transport.bpm.value = midi.header.tempos[0].bpm
    }

    const leadSynth = useCleanPlayback ? midiLead : guitar
    const bassSynth = useCleanPlayback ? midiBass : bass
    const drumSet = useCleanPlayback ? midiDrumKit : drumKit

    midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        // Filter out invalid times
        if (!Number.isFinite(note.time) || note.time < 0) return

        // Schedule notes
        Tone.Transport.schedule(time => {
          if (!leadSynth || !bassSynth || !drumSet) return

          try {
            // Clamp duration to prevent "duration must be greater than 0" error
            const duration = Math.max(
              MIN_NOTE_DURATION,
              Number.isFinite(note.duration) ? note.duration : MIN_NOTE_DURATION
            )

            // Clamp velocity
            const velocity = Math.max(
              0,
              Math.min(1, Number.isFinite(note.velocity) ? note.velocity : 1)
            )

            // Basic Mapping
            // Percussion (Channel 10, index 9)
            if (track.instrument.percussion || track.channel === 9) {
              playDrumNote(note.midi, time, velocity, drumSet)
            } else {
              // Instrument separation by pitch heuristic
              if (note.midi < 45) {
                // Bass range
                bassSynth.triggerAttackRelease(
                  Tone.Frequency(note.midi, 'midi'),
                  duration,
                  time,
                  velocity
                )
              } else {
                // Guitar/Lead range
                leadSynth.triggerAttackRelease(
                  Tone.Frequency(note.midi, 'midi'),
                  duration,
                  time,
                  velocity
                )
              }
            }
          } catch (e) {
            // Prevent single note errors from crashing the loop
            console.warn('[audioEngine] Note scheduling error:', e)
          }
        }, note.time)
      })
    })

    const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
    let requestedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0
    const duration = Number.isFinite(midi.duration) ? midi.duration : 0

    // Fix: If offset is beyond duration, reset to 0 to ensure sound plays
    // Only check if duration is long enough to have an "end" threshold
    if (
      duration >= OFFSET_RESET_THRESHOLD &&
      requestedOffset >= duration - OFFSET_RESET_THRESHOLD
    ) {
      logger.warn(
        'AudioEngine',
        `Offset ${requestedOffset}s exceeds duration ${duration}s. Resetting to 0.`
      )
      requestedOffset = 0
    }

    logger.debug(
      'AudioEngine',
      `Starting Transport. Delay=${validDelay}, Offset=${requestedOffset}`
    )

    if (loop) {
      Tone.Transport.loop = true
      Tone.Transport.loopEnd = midi.duration
      // Loop from excerpt start, so intros don't restart on every loop
      Tone.Transport.loopStart = requestedOffset
    } else {
      Tone.Transport.loop = false
    }

    clearTransportEndEvent()
    clearTransportStopEvent()
    if (!loop && onEnded && duration > 0) {
      transportEndEventId = Tone.Transport.scheduleOnce(() => {
        if (reqId !== playRequestId) return
        onEnded({
          filename,
          duration,
          offsetSeconds: requestedOffset
        })
      }, duration)
    }
    if (!loop && Number.isFinite(stopAfterSeconds) && stopAfterSeconds > 0) {
      const stopTime = requestedOffset + stopAfterSeconds
      transportStopEventId = Tone.Transport.scheduleOnce(() => {
        if (reqId !== playRequestId) return
        stopAudio()
      }, stopTime)
    }

    Tone.Transport.start(Tone.now() + validDelay, requestedOffset)
    return true
  } catch (err) {
    console.error('[audioEngine] Error playing MIDI:', err)
    return false
  }
}

/**
 * Plays a random MIDI file from the available set for ambient music.
 * @param {Array} [songs] - Song metadata array for excerpt offset lookup.
 * @param {Function} [rng] - Random number generator function.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientMidi(
  songs = SONGS_DB,
  rng = Math.random
) {
  logger.debug('AudioEngine', 'playRandomAmbientMidi called')
  // Requirement: Stop transport before starting ambient
  stopAudio()

  const midiFiles = Object.keys(midiUrlMap)
  if (midiFiles.length === 0) {
    logger.warn('AudioEngine', 'No MIDI files found in midiUrlMap')
    return false
  }

  // Requirement: pick a random MIDI from the assets folder
  const filename = selectRandomItem(midiFiles, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random MIDI selection returned null')
    return false
  }

  // If the MIDI is known in SONGS_DB, we might use metadata, but for Ambient we always start from 0
  const meta = songs.find(s => s.sourceMid === filename)
  // Requirement: Ambient always plays from the beginning (0s)
  const offsetSeconds = 0

  logger.debug(
    'AudioEngine',
    `Playing ambient: ${meta?.name ?? filename} (offset ${offsetSeconds}s)`
  )
  return playMidiFile(filename, offsetSeconds, false, 0, {
    useCleanPlayback: true,
    onEnded: () => {
      playRandomAmbientMidi(songs, rng).catch(error => {
        logger.error(
          'AudioEngine',
          'Failed to start next ambient MIDI track',
          error
        )
      })
    }
  })
}

/**
 * Returns the current audio clock time in milliseconds.
 * Uses the Tone.js AudioContext clock so visual elapsed time stays
 * tightly coupled to the audio transport, preventing drift that occurs
 * when mixing Date.now() with Tone scheduling.
 * @returns {number} Current audio time in ms.
 */
export function getAudioTimeMs() {
  return Tone.now() * 1000
}

/**
 * Plays a specific note immediately (Hit Sound).
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNote(midiPitch, lane, velocity = 127) {
  if (!isSetup) return
  const now = Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))

  // Use the lane to determine instrument, fallback to pitch heuristics if needed
  if (lane === 'drums') {
    playDrumNote(midiPitch, now, vel)
  } else if (lane === 'bass') {
    if (bass)
      bass.triggerAttackRelease(
        Tone.Frequency(midiPitch, 'midi'),
        '8n',
        now,
        vel
      )
  } else {
    // Guitar (or default)
    if (guitar)
      guitar.triggerAttackRelease(
        Tone.Frequency(midiPitch, 'midi'),
        '16n',
        now,
        vel
      )
  }
}
