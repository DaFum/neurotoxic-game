/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file contains side-effects (Tone.start, AudioContext creation) as per architectural design exceptions.
 */

import * as Tone from 'tone'
import * as ToneJsMidi from '@tonejs/midi'
import { calculateTimeFromTicks } from './rhythmUtils'
import { SONGS_DB } from '../data/songs'
import { selectRandomItem } from './audioSelectionUtils.js'
import {
  buildAssetUrlMap,
  buildMidiUrlMap,
  resolveAssetUrl,
  normalizeMidiPlaybackOptions
} from './audioPlaybackUtils.js'
import {
  canResumeAudioContextState,
  getPreferredAudioContextState,
  isClosedAudioContextState
} from './audioContextState.js'
import {
  isPercussionTrack,
  isValidMidiNote,
  buildMidiTrackEvents,
  normalizeMidiPitch
} from './midiTrackUtils.js'
import { logger } from './logger.js'

const MidiParser = ToneJsMidi?.Midi ?? ToneJsMidi?.default?.Midi ?? null

// Import all MIDI files as URLs
const midiGlob = import.meta.glob('../assets/**/*.mid', {
  query: '?url',
  import: 'default',
  eager: true
})

const oggGlob = import.meta.glob('../assets/**/*.ogg', {
  query: '?url',
  import: 'default',
  eager: true
})

const MIN_NOTE_DURATION = 0.05
const MAX_NOTE_DURATION = 10
const AUDIO_BUFFER_LOAD_TIMEOUT_MS = 10000
const AUDIO_BUFFER_DECODE_TIMEOUT_MS = 10000
const MAX_AUDIO_BUFFER_CACHE_SIZE = 50

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
const midiUrlMap = buildMidiUrlMap(midiGlob, message =>
  logger.warn('AudioEngine', message)
)

const oggUrlMap = buildAssetUrlMap(
  oggGlob,
  message => logger.warn('AudioEngine', message),
  'Audio'
)

// Log bundled OGG inventory at module load for diagnostics.
// oggUrlMap stores both full relative paths and basenames; prefer full paths for accurate count.
const oggAssetKeys = Object.keys(oggUrlMap).filter(k => k.endsWith('.ogg'))
let oggKeysForLogging = oggAssetKeys.filter(k => k.includes('/'))
if (oggKeysForLogging.length === 0 && oggAssetKeys.length > 0) {
  oggKeysForLogging = oggAssetKeys
}
if (oggKeysForLogging.length > 0) {
  logger.info(
    'AudioEngine',
    `Bundled ${oggKeysForLogging.length} OGG asset(s): ${oggKeysForLogging.join(', ')}`
  )
} else {
  logger.warn(
    'AudioEngine',
    'No OGG assets bundled. Gig audio will fall back to MIDI playback.'
  )
}

/**
 * Checks whether the current browser can likely decode a given audio MIME type.
 * Uses HTMLAudioElement.canPlayType (available without user gesture).
 * @param {string} mimeType - e.g. 'audio/ogg; codecs=vorbis'
 * @returns {boolean} True when the browser reports 'probably' or 'maybe'.
 */
function canPlayAudioType(mimeType) {
  try {
    const a = new Audio()
    const result = a.canPlayType(mimeType)
    return result === 'probably' || result === 'maybe'
  } catch (error) {
    logger.debug(
      'AudioEngine',
      'canPlayAudioType check failed, returning false.',
      error
    )
    return false
  }
}

let guitar, bass, drumKit, loop, part
let midiParts = []
let sfxSynth, sfxGain, musicGain
let masterLimiter, masterComp, reverb, reverbSend
let distortion, guitarChorus, guitarEq, widener
let bassEq, bassComp
let drumBus
let midiDryBus, midiLead, midiBass, midiDrumKit, midiReverb, midiReverbSend
let isSetup = false
let playRequestId = 0
let transportEndEventId = null
let transportStopEventId = null
let gigSource = null
let gigBuffer = null
let gigFilename = null
let gigStartCtxTime = null
let gigSeekOffsetMs = 0
let gigBaseOffsetMs = 0
let gigDurationMs = null
let gigOnEnded = null
let gigIsPaused = false
const audioBufferCache = new Map()
let ambientSource = null
let setupLock = null
let setupError = null
let rebuildLock = null

/**
 * Handles cleanup when a gig buffer source ends naturally.
 * @param {AudioBufferSourceNode} source - The ended source node.
 * @returns {void}
 */
const handleGigSourceEnded = source => {
  if (gigSource !== source || gigIsPaused) return
  if (gigOnEnded) {
    gigOnEnded({
      filename: gigFilename,
      durationMs: gigDurationMs,
      offsetMs: gigBaseOffsetMs
    })
  }
  gigSeekOffsetMs = getGigTimeMs()
  gigStartCtxTime = null
  gigSource = null
}

/**
 * Creates and wires a gig buffer source to the music bus.
 * @param {object} params - Source parameters.
 * @param {AudioBuffer} params.buffer - Audio buffer to play.
 * @param {(source: AudioBufferSourceNode) => void} params.onEnded - End handler.
 * @returns {AudioBufferSourceNode|null} Configured buffer source or null on failure.
 */
const createGigBufferSource = ({ buffer, onEnded }) => {
  const rawContext = getRawAudioContext()
  const source = rawContext.createBufferSource()
  source.buffer = buffer
  if (musicGain?.input) {
    source.connect(musicGain.input)
  } else if (musicGain) {
    source.connect(musicGain)
  } else {
    logger.error('AudioEngine', 'Music bus not initialized for gig playback')
    return null
  }
  source.onended = () => onEnded(source)
  return source
}

/**
 * Clears any scheduled transport end callback.
 * @returns {void}
 */
const clearTransportEndEvent = () => {
  if (transportEndEventId == null) return
  try {
    Tone.getTransport().clear(transportEndEventId)
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
    Tone.getTransport().clear(transportStopEventId)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to clear transport stop event', error)
  } finally {
    transportStopEventId = null
  }
}

/**
 * Returns the raw Web Audio context used by Tone.js.
 * @returns {AudioContext} The raw AudioContext.
 */
const getRawAudioContext = () => {
  const toneContext = Tone.getContext()
  return toneContext?.rawContext ?? toneContext
}

/**
 * Returns the raw AudioContext time in seconds.
 * @returns {number} Current raw AudioContext time in seconds.
 */
export const getAudioContextTimeSec = () => {
  return getRawAudioContext().currentTime
}

/**
 * Converts a raw AudioContext start time into a Tone.js time reference.
 * @param {number} rawStartTimeSec - Raw AudioContext time in seconds.
 * @returns {number} Tone.js time in seconds.
 */
export const getToneStartTimeSec = rawStartTimeSec => {
  const lookAhead = Tone.getContext()?.lookAhead ?? 0
  return rawStartTimeSec + lookAhead
}
/**
 * Calculates gig time in milliseconds based on context time.
 * @param {object} params - Calculation inputs.
 * @param {number} params.contextTimeSec - Raw audio context time in seconds.
 * @param {number|null} params.startCtxTimeSec - Context time when gig playback started.
 * @param {number} params.offsetMs - Offset in milliseconds to apply.
 * @returns {number} Calculated gig time in milliseconds.
 */
export const calculateGigTimeMs = ({
  contextTimeSec,
  startCtxTimeSec,
  offsetMs
}) => {
  const safeOffset = Number.isFinite(offsetMs) ? offsetMs : 0
  if (!Number.isFinite(contextTimeSec) || !Number.isFinite(startCtxTimeSec)) {
    return safeOffset
  }
  return (contextTimeSec - startCtxTimeSec) * 1000 + safeOffset
}

/**
 * Calculates buffer playback offsets and safe duration for gig playback.
 * @param {object} params - Playback window params.
 * @param {number} params.bufferDurationSec - Audio buffer duration in seconds.
 * @param {number} params.baseOffsetMs - Base offset in milliseconds.
 * @param {number} params.seekOffsetMs - Seek offset in milliseconds.
 * @param {number|null} params.durationMs - Requested playback duration in milliseconds.
 * @returns {{offsetSeconds: number, requestedOffsetSeconds: number, safeDurationSeconds: number|null, nextBaseOffsetMs: number, nextSeekOffsetMs: number, didResetOffsets: boolean}} Playback window.
 */
export const calculateGigPlaybackWindow = ({
  bufferDurationSec,
  baseOffsetMs,
  seekOffsetMs,
  durationMs
}) => {
  const safeBaseOffsetMs = Number.isFinite(baseOffsetMs)
    ? Math.max(0, baseOffsetMs)
    : 0
  const safeSeekOffsetMs = Number.isFinite(seekOffsetMs)
    ? Math.max(0, seekOffsetMs)
    : 0
  const safeBufferDurationSec = Number.isFinite(bufferDurationSec)
    ? Math.max(0, bufferDurationSec)
    : 0
  const safeDurationMs = Number.isFinite(durationMs)
    ? Math.max(0, durationMs)
    : null
  let nextBaseOffsetMs = safeBaseOffsetMs
  let nextSeekOffsetMs = safeSeekOffsetMs
  const requestedOffsetSeconds = (safeBaseOffsetMs + safeSeekOffsetMs) / 1000
  let offsetSeconds = requestedOffsetSeconds
  let didResetOffsets = false

  if (safeBufferDurationSec > 0 && offsetSeconds >= safeBufferDurationSec) {
    offsetSeconds = 0
    nextBaseOffsetMs = 0
    nextSeekOffsetMs = 0
    didResetOffsets = true
  }

  const durationSeconds = safeDurationMs != null ? safeDurationMs / 1000 : null
  const safeDurationSeconds =
    durationSeconds != null && safeBufferDurationSec > 0
      ? Math.min(
          durationSeconds,
          Math.max(0, safeBufferDurationSec - offsetSeconds)
        )
      : durationSeconds

  return {
    offsetSeconds,
    requestedOffsetSeconds,
    safeDurationSeconds,
    nextBaseOffsetMs,
    nextSeekOffsetMs,
    didResetOffsets
  }
}

/**
 * Creates a layered snare instrument (noise crack + membrane body) connected to the given bus.
 * @param {object} bus - Tone.js audio node to connect the snare to.
 * @returns {object} Proxy object with triggerAttackRelease, volume, and dispose methods.
 */
function createLayeredSnare(bus) {
  const snareBus = new Tone.Volume(0).connect(bus)
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
}

/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (isSetup) return
  if (setupLock) {
    await setupLock
    if (!isSetup) {
      throw setupError || new Error('setupAudio failed')
    }
    return
  }

  let resolveLock
  setupLock = new Promise(r => {
    resolveLock = r
  })
  setupError = null

  try {
    const previousToneContext = Tone.getContext()

    // Configure Tone.js context for sustained playback (gigs are 30-60s)
    // "balanced" prioritizes performance over ultra-low latency, reducing pops/crackles
    const nextToneContext = new Tone.Context({
      latencyHint: 'balanced',
      lookAhead: 0.15 // Increased from default 0.1 for better scheduling during high CPU
    })
    Tone.setContext(nextToneContext)

    const previousRawContext =
      previousToneContext?.rawContext ?? previousToneContext
    const nextRawContext = nextToneContext?.rawContext ?? nextToneContext
    if (
      previousRawContext &&
      previousRawContext !== nextRawContext &&
      typeof previousRawContext.close === 'function' &&
      previousRawContext.state !== 'closed'
    ) {
      try {
        await previousRawContext.close()
      } catch (error) {
        logger.warn(
          'AudioEngine',
          'Failed to close previous Tone context',
          error
        )
      }
    }

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
    musicGain = new Tone.Gain(1).connect(masterComp)

    // Global reverb send for natural space
    reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(musicGain)
    reverbSend = new Tone.Gain(0.3).connect(reverb)

    // === Guitar ===
    // FM synthesis for richer harmonic content
    guitar = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 3,
      oscillator: { type: 'sawtooth' },
      modulation: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.15, release: 0.3 },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3
      }
    })

    distortion = new Tone.Distortion(0.4)
    guitarChorus = new Tone.Chorus(4, 2.5, 0.3).start()
    guitarEq = new Tone.EQ3(-1, -3, 3) // Gentle mid scoop
    widener = new Tone.StereoWidener(0.5)

    guitar.chain(distortion, guitarChorus, guitarEq, widener, musicGain)
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
    bass.chain(bassComp, bassEq, musicGain)

    // === Drums ===
    // Drum bus with own reverb send
    drumBus = new Tone.Gain(1).connect(musicGain)
    drumBus.connect(reverbSend)

    drumKit = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
      }).connect(drumBus),
      snare: createLayeredSnare(drumBus),
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
    midiDryBus = new Tone.Gain(1).connect(musicGain)

    // Subtle reverb for spatial depth on ambient MIDI playback
    midiReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(musicGain)
    midiReverbSend = new Tone.Gain(0.25).connect(midiReverb)
    midiDryBus.connect(midiReverbSend)

    // Lead/Guitar: FM synthesis for richer harmonic content
    midiLead = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 2.5,
      oscillator: { type: 'sawtooth' },
      modulation: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.4 },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3
      }
    }).connect(midiDryBus)

    // Bass: Fatter oscillator for warmth and presence
    midiBass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', spread: 10, count: 3 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.3 }
    }).connect(midiDryBus)
    midiBass.volume.value = -3

    midiDrumKit = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.2 }
      }).connect(midiDryBus),
      snare: createLayeredSnare(midiDryBus),
      hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(midiDryBus),
      crash: new Tone.MetalSynth(CRASH_CONFIG).connect(midiDryBus)
    }

    // MIDI drum levels
    midiDrumKit.kick.volume.value = 2
    midiDrumKit.hihat.volume.value = -10
    midiDrumKit.crash.volume.value = -6

    isSetup = true
  } catch (error) {
    setupError = error
    throw error
  } finally {
    setupLock = null
    if (resolveLock) resolveLock()
  }
}

/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<boolean>} True if the AudioContext is running.
 */
export async function ensureAudioContext() {
  if (!isSetup) await setupAudio()

  const getAudioState = () => {
    let rawContextState = null
    let toneContextState = null

    try {
      rawContextState = getRawAudioContext()?.state
      toneContextState = Tone.context?.state
    } catch (error) {
      logger.debug('AudioEngine', 'Audio state read failed', error)
      return {
        state: getPreferredAudioContextState({
          rawContextState,
          toneContextState
        }),
        rawContextState,
        toneContextState
      }
    }

    return {
      state: getPreferredAudioContextState({
        rawContextState,
        toneContextState
      }),
      rawContextState,
      toneContextState
    }
  }

  const ensureRebuild = async reasonState => {
    if (rebuildLock) {
      await rebuildLock
      return isSetup
    }

    let resolveRebuild
    rebuildLock = new Promise(r => {
      resolveRebuild = r
    })

    try {
      logger.warn(
        'AudioEngine',
        `AudioContext state is ${reasonState}. Rebuilding audio graph.`
      )
      try {
        disposeAudio()
      } catch (error) {
        logger.debug(
          'AudioEngine',
          'Partial dispose before rebuild failed',
          error
        )
      }
      isSetup = false
      try {
        await setupAudio()
      } catch (error) {
        logger.error('AudioEngine', 'Rebuild setupAudio failed', error)
        isSetup = false
        return false
      }

      if (!isSetup) {
        logger.error(
          'AudioEngine',
          'Audio graph rebuild failed. Playback unavailable.'
        )
        return false
      }

      return true
    } finally {
      if (resolveRebuild) resolveRebuild()
      rebuildLock = null
    }
  }

  let audioState = getAudioState()
  if (isClosedAudioContextState(audioState.state)) {
    const rebuilt = await ensureRebuild(audioState.state)
    if (!rebuilt) return false
    audioState = getAudioState()
  }

  if (audioState.state === 'running') return true

  if (canResumeAudioContextState(audioState.state)) {
    try {
      await Tone.context.resume()
    } catch (error) {
      logger.warn('AudioEngine', 'Tone.context.resume() failed:', error)
    }
    audioState = getAudioState()
    if (audioState.state === 'running') return true
  }

  if (isClosedAudioContextState(audioState.state)) {
    const rebuiltAfterResume = await ensureRebuild(audioState.state)
    if (!rebuiltAfterResume) return false
    audioState = getAudioState()
  }

  return audioState.state === 'running'
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
 * @returns {boolean} True when applied to an existing gain node.
 */
export function setSFXVolume(vol) {
  if (!sfxGain) return false
  // Convert 0-1 linear to decibels (approximate or use ramp)
  // Tone.Gain accepts linear values if units are default, but volume is typically db.
  // However, Tone.Gain.gain is linear amplitude.
  sfxGain.gain.rampTo(Math.max(0, Math.min(1, vol)), 0.1)
  return true
}

/**
 * Sets the music volume using the dedicated music bus.
 * @param {number} vol - Volume between 0 and 1.
 * @returns {boolean} True when applied to an existing gain node.
 */
export function setMusicVolume(vol) {
  if (!musicGain) return false
  const next = Math.max(0, Math.min(1, vol))
  musicGain.gain.rampTo(next, 0.1)
  return true
}

/**
 * Checks whether an audio asset exists in the bundled map.
 * @param {string} filename - The audio filename to check.
 * @returns {boolean} True when the asset exists.
 */
export function hasAudioAsset(filename) {
  if (typeof filename !== 'string') return false
  const normalized = filename.replace(/^\.?\//, '')
  return Boolean(
    oggUrlMap?.[normalized] || oggUrlMap?.[normalized.split('/').pop()]
  )
}

/**
 * Loads an audio buffer for Web Audio playback.
 * @param {string} filename - Audio filename (e.g. .ogg).
 * @returns {Promise<AudioBuffer|null>} Decoded audio buffer or null on failure.
 */
export async function loadAudioBuffer(filename) {
  if (typeof filename !== 'string' || filename.length === 0) return null
  const cacheKey = filename.replace(/^\.?\//, '')
  if (audioBufferCache.has(cacheKey)) {
    const cached = audioBufferCache.get(cacheKey)
    // Promote to most-recently-used for LRU eviction
    audioBufferCache.delete(cacheKey)
    audioBufferCache.set(cacheKey, cached)
    return cached
  }

  const baseUrl = import.meta.env.BASE_URL || './'
  const publicBasePath = `${baseUrl}assets`
  const { url, source } = resolveAssetUrl(filename, oggUrlMap, publicBasePath)
  if (!url) {
    const keysPreview =
      oggKeysForLogging.length <= 5
        ? oggKeysForLogging.join(', ')
        : `${oggKeysForLogging.slice(0, 5).join(', ')} … (${oggKeysForLogging.length} total)`
    logger.warn(
      'AudioEngine',
      `Audio asset not found: "${filename}". Available OGG keys: [${keysPreview}]`
    )
    return null
  }
  if (source === 'public') {
    logger.warn(
      'AudioEngine',
      `Audio asset "${filename}" not found in bundle, falling back to public path: ${url}`
    )
  }

  try {
    // Avoid hanging gig initialization on stalled network/body reads.
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      AUDIO_BUFFER_LOAD_TIMEOUT_MS
    )
    let arrayBuffer = null
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        logger.warn(
          'AudioEngine',
          `Failed to load audio "${filename}": HTTP ${response.status} from ${url}`
        )
        return null
      }
      arrayBuffer = await response.arrayBuffer()
    } finally {
      clearTimeout(timeoutId)
    }
    const rawContext = getRawAudioContext()
    let decodeTimeoutId = null
    const decodeTimeoutPromise = new Promise((_, reject) => {
      decodeTimeoutId = setTimeout(
        () => reject(new Error('AUDIO_DECODE_TIMEOUT')),
        AUDIO_BUFFER_DECODE_TIMEOUT_MS
      )
    })
    let buffer = null
    try {
      buffer = await Promise.race([
        rawContext.decodeAudioData(arrayBuffer),
        decodeTimeoutPromise
      ])
    } finally {
      if (decodeTimeoutId) clearTimeout(decodeTimeoutId)
    }
    if (audioBufferCache.size >= MAX_AUDIO_BUFFER_CACHE_SIZE) {
      const oldestKey = audioBufferCache.keys().next().value
      audioBufferCache.delete(oldestKey)
    }
    audioBufferCache.set(cacheKey, buffer)
    logger.debug(
      'AudioEngine',
      `Decoded audio buffer: "${filename}" (${buffer.duration.toFixed(1)}s, ${buffer.sampleRate}Hz)`
    )
    return buffer
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn(
        'AudioEngine',
        `Audio fetch timed out for "${filename}" (${url})`
      )
    } else if (error?.message === 'AUDIO_DECODE_TIMEOUT') {
      logger.warn(
        'AudioEngine',
        `Audio decode timed out for "${filename}" (${url})`
      )
    } else {
      const isOgg = filename.toLowerCase().endsWith('.ogg')
      const codecHint =
        isOgg && !canPlayAudioType('audio/ogg; codecs=vorbis')
          ? ' This browser may not support OGG Vorbis (e.g. Safari/iOS). Consider providing .m4a or .mp3 fallbacks.'
          : ''
      logger.warn(
        'AudioEngine',
        `Failed to decode audio buffer for "${filename}".${codecHint}`,
        error
      )
    }
    return null
  }
}

/**
 * Starts gig playback using Web Audio buffer playback.
 * @param {object} params - Playback params.
 * @param {string} params.filename - Audio filename to play.
 * @param {number} [params.bufferOffsetMs=0] - Offset into the buffer in ms.
 * @param {number} [params.delayMs=0] - Delay before starting playback in ms.
 * @param {number} [params.durationMs=null] - Optional playback duration in ms.
 * @param {Function} [params.onEnded] - Callback invoked after playback ends.
 * @returns {Promise<boolean>} True when playback starts.
 */
export async function startGigPlayback({
  filename,
  bufferOffsetMs = 0,
  delayMs = 0,
  durationMs = null,
  onEnded = null
}) {
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false

  stopGigPlayback()

  const buffer = await loadAudioBuffer(filename)
  if (!buffer) return false

  const rawContext = getRawAudioContext()
  const source = createGigBufferSource({
    buffer,
    onEnded: handleGigSourceEnded
  })
  if (!source) return false

  gigBuffer = buffer
  gigFilename = filename
  gigBaseOffsetMs = Math.max(0, bufferOffsetMs)
  gigSeekOffsetMs = 0
  gigDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : null
  gigOnEnded = typeof onEnded === 'function' ? onEnded : null
  gigIsPaused = false

  const startAt = rawContext.currentTime + Math.max(0, delayMs) / 1000
  gigStartCtxTime = startAt

  const {
    offsetSeconds,
    requestedOffsetSeconds,
    safeDurationSeconds,
    nextBaseOffsetMs,
    nextSeekOffsetMs,
    didResetOffsets
  } = calculateGigPlaybackWindow({
    bufferDurationSec: buffer.duration,
    baseOffsetMs: gigBaseOffsetMs,
    seekOffsetMs: gigSeekOffsetMs,
    durationMs: gigDurationMs
  })

  if (didResetOffsets) {
    logger.warn(
      'AudioEngine',
      `Audio offset ${requestedOffsetSeconds}s exceeds buffer duration ${buffer.duration}s. Resetting to 0.`
    )
    gigBaseOffsetMs = nextBaseOffsetMs
    gigSeekOffsetMs = nextSeekOffsetMs
  }

  gigSource = source
  if (safeDurationSeconds === 0) {
    gigStartCtxTime = null
    handleGigSourceEnded(source)
    return true
  }
  if (safeDurationSeconds != null && safeDurationSeconds > 0) {
    source.start(startAt, offsetSeconds, safeDurationSeconds)
  } else {
    source.start(startAt, offsetSeconds)
  }
  return true
}

/**
 * Starts the gig clock without buffer playback (e.g. for MIDI fallback).
 * @param {object} params - Clock params.
 * @param {number} [params.delayMs=0] - Delay before starting the clock in ms.
 * @param {number} [params.offsetMs=0] - Starting offset for the gig clock.
 * @param {number|null} [params.startTimeSec=null] - Absolute Tone.js time to start the gig clock.
 * @returns {void}
 */
export function startGigClock({
  delayMs = 0,
  offsetMs = 0,
  startTimeSec = null
} = {}) {
  const startTime = Number.isFinite(startTimeSec)
    ? startTimeSec
    : getAudioContextTimeSec() + Math.max(0, delayMs) / 1000
  gigStartCtxTime = startTime
  gigSeekOffsetMs = Math.max(0, offsetMs)
  gigIsPaused = false
  gigBuffer = null
  gigFilename = null
  gigDurationMs = null
  gigBaseOffsetMs = 0
  gigOnEnded = null
  if (gigSource) {
    try {
      gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to reset gig source', error)
    }
    gigSource = null
  }
}

/**
 * Pauses gig playback and preserves the current offset.
 * @returns {void}
 */
export function pauseGigPlayback() {
  if (gigIsPaused) return
  if (!gigSource && gigStartCtxTime == null) return
  gigSeekOffsetMs = getGigTimeMs()
  gigIsPaused = true
  gigStartCtxTime = null
  if (gigSource) {
    try {
      gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to pause gig playback', error)
    }
    gigSource = null
  }
}

/**
 * Resumes gig playback from the stored offset.
 * @returns {void}
 */
export function resumeGigPlayback() {
  if (!gigIsPaused) return
  if (!gigBuffer) {
    gigStartCtxTime = getRawAudioContext().currentTime
    gigIsPaused = false
    return
  }
  const rawContext = getRawAudioContext()
  const source = createGigBufferSource({
    buffer: gigBuffer,
    onEnded: handleGigSourceEnded
  })
  if (!source) return

  const startAt = rawContext.currentTime
  gigStartCtxTime = startAt
  gigIsPaused = false

  const remainingDurationMs =
    gigDurationMs != null ? Math.max(0, gigDurationMs - gigSeekOffsetMs) : null
  const {
    offsetSeconds,
    requestedOffsetSeconds,
    safeDurationSeconds,
    nextBaseOffsetMs,
    nextSeekOffsetMs,
    didResetOffsets
  } = calculateGigPlaybackWindow({
    bufferDurationSec: gigBuffer.duration,
    baseOffsetMs: gigBaseOffsetMs,
    seekOffsetMs: gigSeekOffsetMs,
    durationMs: remainingDurationMs
  })

  if (didResetOffsets) {
    logger.warn(
      'AudioEngine',
      `Audio offset ${requestedOffsetSeconds}s exceeds buffer duration ${gigBuffer.duration}s. Resetting to 0.`
    )
    gigBaseOffsetMs = nextBaseOffsetMs
    gigSeekOffsetMs = nextSeekOffsetMs
  }

  gigSource = source
  if (safeDurationSeconds === 0) {
    gigStartCtxTime = null
    handleGigSourceEnded(source)
    return
  }
  if (safeDurationSeconds != null && safeDurationSeconds > 0) {
    source.start(startAt, offsetSeconds, safeDurationSeconds)
  } else {
    source.start(startAt, offsetSeconds)
  }
}

/**
 * Stops gig playback and clears the gig clock state.
 * @returns {void}
 */
export function stopGigPlayback() {
  if (gigSource) {
    try {
      gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to stop gig playback', error)
    }
  }
  gigSource = null
  gigBuffer = null
  gigFilename = null
  gigStartCtxTime = null
  gigSeekOffsetMs = 0
  gigBaseOffsetMs = 0
  gigDurationMs = null
  gigOnEnded = null
  gigIsPaused = false
}

/**
 * Stops ambient OGG playback and clears ambient state.
 * @returns {void}
 */
export function stopAmbientPlayback() {
  if (ambientSource) {
    try {
      ambientSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to stop ambient playback', error)
    }
    ambientSource = null
  }
}

/**
 * Returns whether ambient OGG playback is currently active.
 * @returns {boolean}
 */
export function isAmbientOggPlaying() {
  return ambientSource != null
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0) {
  const reqId = ++playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== playRequestId) return false

  stopAudioInternal()
  Tone.getTransport().cancel()
  Tone.getTransport().position = 0

  const bpm = Math.max(1, song.bpm || 120) // Ensure BPM is positive
  const tpb = Math.max(1, song.tpb || 480) // Ensure TPB is positive
  Tone.getTransport().bpm.value = bpm

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
  const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0

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

      // Delay is applied once when Transport starts; keep note times relative.
      const finalTime = Number.isFinite(time) ? time : -1

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

  // Schedule Transport.start in advance to prevent pops/crackles
  // Add minimum 100ms lookahead for reliable scheduling
  const minLookahead = 0.1
  const startTime = Tone.now() + Math.max(minLookahead, validDelay)
  Tone.getTransport().start(startTime)
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
  try {
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
  } catch (e) {
    logger.warn('AudioEngine', `Drum trigger failed for pitch ${midiPitch}`, e)
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
  random = Math.random
) {
  const reqId = ++playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== playRequestId) return false

  stopAudioInternal()
  Tone.getTransport().cancel()
  Tone.getTransport().position = 0

  // Guard BPM against zero/negative/falsy values
  const rawBpm = song.bpm || 80 + (song.difficulty || 2) * 30
  const bpm = Math.max(1, rawBpm)

  Tone.getTransport().bpm.value = bpm

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
    return false
  }

  // Schedule Transport.start in advance to prevent pops/crackles
  // Using "+0.1" schedules 100ms ahead for reliable scheduling
  const startDelay = Math.max(0.1, delay)
  Tone.getTransport().start(`+${startDelay}`)
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
  stopGigPlayback()
  stopAmbientPlayback()
}

/**
 * Internal function to stop audio without invalidating pending requests.
 * Used by playback functions to clear previous state.
 */
function stopAudioInternal() {
  Tone.getTransport().stop()
  Tone.getTransport().position = 0
  if (loop) {
    loop.dispose()
    loop = null
  }
  if (part) {
    part.dispose()
    part = null
  }
  if (midiParts.length > 0) {
    midiParts.forEach(trackPart => trackPart.dispose())
    midiParts = []
  }
  Tone.getTransport().cancel()
  clearTransportEndEvent()
  clearTransportStopEvent()
}

/**
 * Pauses the audio transport.
 */
export function pauseAudio() {
  if (Tone.getTransport().state === 'started') {
    Tone.getTransport().pause()
  }
  pauseGigPlayback()
}

/**
 * Resumes the audio transport.
 */
export function resumeAudio() {
  if (Tone.getTransport().state === 'paused') {
    Tone.getTransport().start()
  }
  resumeGigPlayback()
}

/**
 * Disposes of audio engine resources.
 */
export function disposeAudio() {
  playRequestId++
  stopAudioInternal()
  stopGigPlayback()
  stopAmbientPlayback()
  audioBufferCache.clear()

  guitar = safeDispose(guitar)
  bass = safeDispose(bass)

  if (drumKit) {
    drumKit.kick = safeDispose(drumKit.kick)
    drumKit.snare = safeDispose(drumKit.snare)
    drumKit.hihat = safeDispose(drumKit.hihat)
    drumKit.crash = safeDispose(drumKit.crash)
    drumKit = null
  }

  sfxSynth = safeDispose(sfxSynth)
  sfxGain = safeDispose(sfxGain)
  musicGain = safeDispose(musicGain)
  midiLead = safeDispose(midiLead)
  midiBass = safeDispose(midiBass)

  if (midiDrumKit) {
    midiDrumKit.kick = safeDispose(midiDrumKit.kick)
    midiDrumKit.snare = safeDispose(midiDrumKit.snare)
    midiDrumKit.hihat = safeDispose(midiDrumKit.hihat)
    midiDrumKit.crash = safeDispose(midiDrumKit.crash)
    midiDrumKit = null
  }

  midiReverbSend = safeDispose(midiReverbSend)
  midiReverb = safeDispose(midiReverb)
  midiDryBus = safeDispose(midiDryBus)

  distortion = safeDispose(distortion)
  guitarChorus = safeDispose(guitarChorus)
  guitarEq = safeDispose(guitarEq)
  widener = safeDispose(widener)

  bassEq = safeDispose(bassEq)
  bassComp = safeDispose(bassComp)

  drumBus = safeDispose(drumBus)

  reverbSend = safeDispose(reverbSend)
  reverb = safeDispose(reverb)
  masterComp = safeDispose(masterComp)
  masterLimiter = safeDispose(masterLimiter)

  isSetup = false
}

/**
 * Safely disposes a Tone.js node, catching errors if the context is closed.
 * @param {object} node - The Tone.js node to dispose.
 * @returns {null} Always returns null.
 */
function safeDispose(node) {
  if (node && typeof node.dispose === 'function') {
    try {
      node.dispose()
    } catch {
      // Ignore dispose errors (likely due to closed context)
    }
  }
  return null
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
    // Hihat on the beat — the 0.1 lower bound is intentional for musical density
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
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 * @param {number|null} [ownedRequestId=null] - Internal request ownership override.
 */
async function playMidiFileInternal(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {},
  ownedRequestId = null
) {
  const { onEnded, useCleanPlayback, stopAfterSeconds, startTimeSec } =
    normalizeMidiPlaybackOptions(options)
  logger.debug(
    'AudioEngine',
    `Request playMidiFile: ${filename}, offset=${offset}, loop=${loop}`
  )
  // Requirement: Stop previous playback immediately unless the caller
  // explicitly owns request invalidation (used by ambient chaining).
  const reqId =
    Number.isInteger(ownedRequestId) && ownedRequestId > 0
      ? ownedRequestId
      : ++playRequestId
  logger.debug('AudioEngine', `New playRequestId: ${reqId}`)

  const unlocked = await ensureAudioContext()
  if (!unlocked) {
    logger.warn('AudioEngine', 'Cannot play MIDI: AudioContext is locked')
    return false
  }

  if (reqId !== playRequestId) {
    logger.debug(
      'AudioEngine',
      `Request cancelled during ensureAudioContext (reqId: ${reqId} vs ${playRequestId})`
    )
    return false
  }

  stopAudioInternal()
  Tone.getTransport().cancel()

  const baseUrl = import.meta.env.BASE_URL || './'
  const publicBasePath = `${baseUrl}assets`
  const { url, source } = resolveAssetUrl(filename, midiUrlMap, publicBasePath)
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

    if (!MidiParser) {
      logger.error(
        'AudioEngine',
        'MidiParser failed to load from @tonejs/midi. This disables all MIDI playback. Try: npm install @tonejs/midi --force and restart the dev server. If the issue persists, check bundler ESM/CJS interop configuration.'
      )
      return false
    }

    const midi = new MidiParser(arrayBuffer)
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
      Tone.getTransport().bpm.value = midi.header.tempos[0].bpm
    }

    const leadSynth = useCleanPlayback ? midiLead : guitar
    const bassSynth = useCleanPlayback ? midiBass : bass
    const drumSet = useCleanPlayback ? midiDrumKit : drumKit

    const nextMidiParts = []
    midi.tracks.forEach(track => {
      const notes = Array.isArray(track?.notes) ? track.notes : []
      const percussionTrack = isPercussionTrack(track)
      const trackEvents = buildMidiTrackEvents(notes, percussionTrack)

      if (trackEvents.length === 0) return

      const trackPart = new Tone.Part((time, value) => {
        if (!leadSynth || !bassSynth || !drumSet) return
        if (!isValidMidiNote({ midi: value?.midiPitch })) return
        const midiPitch = normalizeMidiPitch({ midi: value?.midiPitch })
        if (midiPitch == null) return

        try {
          // Clamp duration to prevent "duration must be greater than 0" error
          // and cap at MAX_NOTE_DURATION to prevent resource exhaustion
          const duration = Math.min(
            MAX_NOTE_DURATION,
            Math.max(
              MIN_NOTE_DURATION,
              Number.isFinite(value?.duration)
                ? value.duration
                : MIN_NOTE_DURATION
            )
          )

          // Clamp velocity
          const velocity = Math.max(
            0,
            Math.min(1, Number.isFinite(value?.velocity) ? value.velocity : 1)
          )

          if (value?.percussionTrack) {
            playDrumNote(midiPitch, time, velocity, drumSet)
            return
          }

          if (midiPitch < 45) {
            bassSynth.triggerAttackRelease(
              Tone.Frequency(midiPitch, 'midi'),
              duration,
              time,
              velocity
            )
          } else {
            leadSynth.triggerAttackRelease(
              Tone.Frequency(midiPitch, 'midi'),
              duration,
              time,
              velocity
            )
          }
        } catch (e) {
          // Prevent single note errors from crashing the loop
          console.warn('[audioEngine] Note scheduling error:', e)
        }
      }, trackEvents)

      trackPart.start(0)
      nextMidiParts.push(trackPart)
    })

    midiParts = nextMidiParts

    const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
    let requestedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0
    const duration = Number.isFinite(midi.duration) ? midi.duration : 0

    // Reset offset when it is at or beyond duration to ensure sound plays.
    // Note: the old threshold-based check (within 0.1s of end) was overly
    // conservative and would discard valid offsets near the end of a track.
    if (duration > 0 && requestedOffset >= duration) {
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
      Tone.getTransport().loop = true
      Tone.getTransport().loopEnd = midi.duration
      // Loop from excerpt start, so intros don't restart on every loop
      Tone.getTransport().loopStart = requestedOffset
    } else {
      Tone.getTransport().loop = false
    }

    clearTransportEndEvent()
    clearTransportStopEvent()
    if (!loop && onEnded && duration > 0) {
      transportEndEventId = Tone.getTransport().scheduleOnce(() => {
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
      transportStopEventId = Tone.getTransport().scheduleOnce(() => {
        if (reqId !== playRequestId) return
        stopAudio()
      }, stopTime)
    }

    // Schedule Transport.start in advance to prevent pops/crackles
    // Add minimum 100ms lookahead for reliable scheduling
    const minLookahead = 0.1
    const transportStartTime = Number.isFinite(startTimeSec)
      ? startTimeSec
      : Tone.now() + Math.max(minLookahead, validDelay)
    Tone.getTransport().start(transportStartTime, requestedOffset)
    return true
  } catch (err) {
    console.error('[audioEngine] Error playing MIDI:', err)
    return false
  }
}

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
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 */
export async function playMidiFile(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {}
) {
  return playMidiFileInternal(filename, offset, loop, delay, options)
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
  const reqId = playRequestId

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
  return playMidiFileInternal(
    filename,
    offsetSeconds,
    false,
    0,
    {
      useCleanPlayback: true,
      onEnded: () => {
        if (reqId !== playRequestId) return
        playRandomAmbientMidi(songs, rng).catch(error => {
          logger.error(
            'AudioEngine',
            'Failed to start next ambient MIDI track',
            error
          )
        })
      }
    },
    reqId
  )
}

/**
 * Plays a random OGG file from the bundled assets for ambient music.
 * Uses raw AudioBufferSourceNode connected to the musicGain bus for
 * lower CPU usage and better quality than MIDI synthesis.
 * @param {Function} [rng] - Random number generator function.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.skipStop=false] - Skip internal stopAudio() when caller already stopped audio.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientOgg(
  rng = Math.random,
  { skipStop = false } = {}
) {
  logger.debug('AudioEngine', 'playRandomAmbientOgg called')
  // Skip stopAudio() when caller has already stopped audio to avoid double-stop
  // and unnecessary playRequestId increments (e.g., AudioManager.startAmbient calls stopMusic first)
  if (!skipStop) {
    stopAudio()
  }

  const oggFiles = Object.keys(oggUrlMap).filter(k => k.endsWith('.ogg'))
  let candidates = oggFiles.filter(k => k.includes('/'))
  if (candidates.length === 0) candidates = oggFiles
  if (candidates.length === 0) {
    logger.warn('AudioEngine', 'No OGG files available for ambient playback')
    return false
  }

  const filename = selectRandomItem(candidates, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random OGG selection returned null')
    return false
  }

  const reqId = ++playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== playRequestId) return false

  const buffer = await loadAudioBuffer(filename)
  if (!buffer) return false
  if (reqId !== playRequestId) return false

  const rawContext = getRawAudioContext()
  const source = rawContext.createBufferSource()
  source.buffer = buffer

  if (musicGain?.input) {
    source.connect(musicGain.input)
  } else if (musicGain) {
    source.connect(musicGain)
  } else {
    logger.error(
      'AudioEngine',
      'Music bus not initialized for ambient playback'
    )
    return false
  }

  ambientSource = source
  const chainReqId = playRequestId

  source.onended = () => {
    if (ambientSource !== source) return
    if (chainReqId !== playRequestId) return
    ambientSource = null
    playRandomAmbientOgg(rng).catch(error => {
      logger.error(
        'AudioEngine',
        'Failed to chain next ambient OGG track',
        error
      )
    })
  }

  source.start()
  logger.debug(
    'AudioEngine',
    `Ambient OGG started: ${filename} (${buffer.duration.toFixed(1)}s)`
  )
  return true
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
 * Returns the current gig clock time in milliseconds.
 * This uses the raw Web Audio context for sample-accurate sync with buffers.
 * @returns {number} Current gig time in ms.
 */
export function getGigTimeMs() {
  const rawContext = getRawAudioContext()
  return calculateGigTimeMs({
    contextTimeSec: rawContext.currentTime,
    startCtxTimeSec: gigStartCtxTime,
    offsetMs: gigSeekOffsetMs
  })
}

/**
 * Plays a specific note at a scheduled Tone.js time.
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} whenSeconds - Tone.js time in seconds.
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNoteAtTime(midiPitch, lane, whenSeconds, velocity = 127) {
  if (!isSetup) return
  const now = Number.isFinite(whenSeconds) ? whenSeconds : Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))

  // Use the lane to determine instrument, fallback to pitch heuristics if needed
  if (lane === 'drums') {
    playDrumNote(midiPitch, now, vel)
  } else if (lane === 'bass') {
    if (bass) {
      bass.triggerAttackRelease(
        Tone.Frequency(midiPitch, 'midi'),
        '8n',
        now,
        vel
      )
    }
  } else if (guitar) {
    // Guitar (or default)
    guitar.triggerAttackRelease(
      Tone.Frequency(midiPitch, 'midi'),
      '16n',
      now,
      vel
    )
  }
}
