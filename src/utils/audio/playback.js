import * as Tone from 'tone'
import { logger } from '../logger.js'
import { audioState, resetGigState } from './state.js'
import {
  ensureAudioContext,
  getRawAudioContext,
  getAudioContextTimeSec
} from './setup.js'
import { loadAudioBuffer } from './assets.js'

/**
 * Plays a sound effect by type.
 * @param {string} type - The type of SFX ('hit', 'miss', 'menu', 'travel', 'cash').
 */
export function playSFX(type) {
  if (!audioState.isSetup || !audioState.sfxSynth) return

  const now = Tone.now()
  switch (type) {
    case 'hit':
      // High pitch success ping
      audioState.sfxSynth.triggerAttackRelease('A5', '16n', now)
      break
    case 'miss':
      // Low discordant buzz
      audioState.sfxSynth.triggerAttackRelease('D2', '8n', now)
      break
    case 'menu':
      // Gentle blip
      audioState.sfxSynth.triggerAttackRelease('C5', '32n', now, 0.3)
      break
    case 'travel':
      // Engine-like rumble using drum kick if available, or low synth
      if (audioState.drumKit && audioState.drumKit.kick) {
        audioState.drumKit.kick.triggerAttackRelease('C1', '8n', now, 0.5)
      } else {
        audioState.sfxSynth.triggerAttackRelease('G1', '8n', now, 0.5)
      }
      break
    case 'cash':
      // Bright chime/coin sound
      audioState.sfxSynth.triggerAttackRelease('B5', '16n', now, 0.4)
      audioState.sfxSynth.triggerAttackRelease('E6', '16n', now + 0.05, 0.4)
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
  if (!audioState.sfxGain) return false
  // Convert 0-1 linear to decibels (approximate or use ramp)
  // Tone.Gain accepts linear values if units are default, but volume is typically db.
  // However, Tone.Gain.gain is linear amplitude.
  audioState.sfxGain.gain.rampTo(Math.max(0, Math.min(1, vol)), 0.1)
  return true
}

/**
 * Sets the music volume using the dedicated music bus.
 * @param {number} vol - Volume between 0 and 1.
 * @returns {boolean} True when applied to an existing gain node.
 */
export function setMusicVolume(vol) {
  if (!audioState.musicGain) return false
  const next = Math.max(0, Math.min(1, vol))
  audioState.musicGain.gain.rampTo(next, 0.1)
  return true
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
 * Returns the current gig time in ms.
 * This uses the raw Web Audio context for sample-accurate sync with buffers.
 * @returns {number} Current gig time in ms.
 */
export function getGigTimeMs() {
  const rawContext = getRawAudioContext()
  return calculateGigTimeMs({
    contextTimeSec: rawContext.currentTime,
    startCtxTimeSec: audioState.gigStartCtxTime,
    offsetMs: audioState.gigSeekOffsetMs
  })
}

/**
 * Handles cleanup when a gig buffer source ends naturally.
 * @param {AudioBufferSourceNode} source - The ended source node.
 * @returns {void}
 */
const handleGigSourceEnded = source => {
  if (audioState.gigSource !== source || audioState.gigIsPaused) return
  if (audioState.gigOnEnded) {
    audioState.gigOnEnded({
      filename: audioState.gigFilename,
      durationMs: audioState.gigDurationMs,
      offsetMs: audioState.gigBaseOffsetMs
    })
  }
  audioState.gigSeekOffsetMs = getGigTimeMs()
  audioState.gigStartCtxTime = null
  audioState.gigSource = null
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
  if (audioState.musicGain?.input) {
    source.connect(audioState.musicGain.input)
  } else if (audioState.musicGain) {
    source.connect(audioState.musicGain)
  } else {
    logger.error('AudioEngine', 'Music bus not initialized for gig playback')
    return null
  }
  source.onended = () => onEnded(source)
  return source
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
 * Stops gig playback and clears the gig clock state.
 * @returns {void}
 */
export function stopGigPlayback() {
  if (audioState.gigSource) {
    logger.debug(
      'AudioEngine',
      `Stopping gig playback: "${audioState.gigFilename}" at ${getGigTimeMs().toFixed(0)}ms`
    )
    try {
      audioState.gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to stop gig playback', error)
    }
    try {
      audioState.gigSource.disconnect()
    } catch {
      // Source may already be disconnected after stop
    }
  }
  resetGigState()
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

  audioState.gigBuffer = buffer
  audioState.gigFilename = filename
  audioState.gigBaseOffsetMs = Math.max(0, bufferOffsetMs)
  audioState.gigSeekOffsetMs = 0
  audioState.gigDurationMs = Number.isFinite(durationMs)
    ? Math.max(0, durationMs)
    : null
  audioState.gigOnEnded = typeof onEnded === 'function' ? onEnded : null
  audioState.gigIsPaused = false

  const startAt = rawContext.currentTime + Math.max(0, delayMs) / 1000
  audioState.gigStartCtxTime = startAt

  const {
    offsetSeconds,
    requestedOffsetSeconds,
    safeDurationSeconds,
    nextBaseOffsetMs,
    nextSeekOffsetMs,
    didResetOffsets
  } = calculateGigPlaybackWindow({
    bufferDurationSec: buffer.duration,
    baseOffsetMs: audioState.gigBaseOffsetMs,
    seekOffsetMs: audioState.gigSeekOffsetMs,
    durationMs: audioState.gigDurationMs
  })

  if (didResetOffsets) {
    logger.warn(
      'AudioEngine',
      `Audio offset ${requestedOffsetSeconds}s exceeds buffer duration ${buffer.duration}s. Resetting to 0.`
    )
    audioState.gigBaseOffsetMs = nextBaseOffsetMs
    audioState.gigSeekOffsetMs = nextSeekOffsetMs
  }

  audioState.gigSource = source
  if (safeDurationSeconds === 0) {
    logger.debug(
      'AudioEngine',
      `Gig playback: zero duration after clamping, firing onEnded immediately.`
    )
    audioState.gigStartCtxTime = null
    handleGigSourceEnded(source)
    return true
  }
  if (safeDurationSeconds != null && safeDurationSeconds > 0) {
    source.start(startAt, offsetSeconds, safeDurationSeconds)
  } else {
    source.start(startAt, offsetSeconds)
  }
  logger.info(
    'AudioEngine',
    `Gig playback started: "${filename}" offset=${offsetSeconds.toFixed(2)}s duration=${safeDurationSeconds != null ? safeDurationSeconds.toFixed(2) + 's' : 'full'}`
  )
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
  audioState.gigStartCtxTime = startTime
  audioState.gigSeekOffsetMs = Math.max(0, offsetMs)
  audioState.gigIsPaused = false
  audioState.gigBuffer = null
  audioState.gigFilename = null
  audioState.gigDurationMs = null
  audioState.gigBaseOffsetMs = 0
  audioState.gigOnEnded = null
  if (audioState.gigSource) {
    try {
      audioState.gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to reset gig source', error)
    }
    audioState.gigSource = null
  }
}

/**
 * Pauses gig playback and preserves the current offset.
 * @returns {void}
 */
export function pauseGigPlayback() {
  if (audioState.gigIsPaused) return
  if (!audioState.gigSource && audioState.gigStartCtxTime == null) return
  logger.debug(
    'AudioEngine',
    `Pausing gig playback at ${getGigTimeMs().toFixed(0)}ms`
  )
  audioState.gigSeekOffsetMs = getGigTimeMs()
  audioState.gigIsPaused = true
  audioState.gigStartCtxTime = null
  if (audioState.gigSource) {
    try {
      audioState.gigSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to pause gig playback', error)
    }
    try {
      audioState.gigSource.disconnect()
    } catch {
      // Source may already be disconnected after stop
    }
    audioState.gigSource = null
  }
}

/**
 * Resumes gig playback from the stored offset.
 * @returns {void}
 */
export function resumeGigPlayback() {
  if (!audioState.gigIsPaused) return
  logger.debug(
    'AudioEngine',
    `Resuming gig playback from ${audioState.gigSeekOffsetMs.toFixed(0)}ms`
  )
  if (!audioState.gigBuffer) {
    audioState.gigStartCtxTime = getRawAudioContext().currentTime
    audioState.gigIsPaused = false
    return
  }
  const rawContext = getRawAudioContext()
  const source = createGigBufferSource({
    buffer: audioState.gigBuffer,
    onEnded: handleGigSourceEnded
  })
  if (!source) return

  const startAt = rawContext.currentTime
  audioState.gigStartCtxTime = startAt
  audioState.gigIsPaused = false

  const remainingDurationMs =
    audioState.gigDurationMs != null
      ? Math.max(0, audioState.gigDurationMs - audioState.gigSeekOffsetMs)
      : null
  const {
    offsetSeconds,
    requestedOffsetSeconds,
    safeDurationSeconds,
    nextBaseOffsetMs,
    nextSeekOffsetMs,
    didResetOffsets
  } = calculateGigPlaybackWindow({
    bufferDurationSec: audioState.gigBuffer.duration,
    baseOffsetMs: audioState.gigBaseOffsetMs,
    seekOffsetMs: audioState.gigSeekOffsetMs,
    durationMs: remainingDurationMs
  })

  if (didResetOffsets) {
    logger.warn(
      'AudioEngine',
      `Audio offset ${requestedOffsetSeconds}s exceeds buffer duration ${audioState.gigBuffer.duration}s. Resetting to 0.`
    )
    audioState.gigBaseOffsetMs = nextBaseOffsetMs
    audioState.gigSeekOffsetMs = nextSeekOffsetMs
  }

  audioState.gigSource = source
  if (safeDurationSeconds === 0) {
    audioState.gigStartCtxTime = null
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
 * Clears any scheduled transport end callback.
 * @returns {void}
 */
const clearTransportEndEvent = () => {
  if (audioState.transportEndEventId == null) return
  try {
    Tone.getTransport().clear(audioState.transportEndEventId)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to clear transport end event', error)
  } finally {
    audioState.transportEndEventId = null
  }
}

/**
 * Clears any scheduled transport stop callback.
 * @returns {void}
 */
const clearTransportStopEvent = () => {
  if (audioState.transportStopEventId == null) return
  try {
    Tone.getTransport().clear(audioState.transportStopEventId)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to clear transport stop event', error)
  } finally {
    audioState.transportStopEventId = null
  }
}

/**
 * Internal function to stop audio without invalidating pending requests.
 * Used by playback functions to clear previous state.
 */
export function stopAudioInternal() {
  Tone.getTransport().stop()
  Tone.getTransport().position = 0
  if (audioState.loop) {
    audioState.loop.dispose()
    audioState.loop = null
  }
  if (audioState.part) {
    audioState.part.dispose()
    audioState.part = null
  }
  if (audioState.midiParts.length > 0) {
    audioState.midiParts.forEach(trackPart => trackPart.dispose())
    audioState.midiParts = []
  }
  Tone.getTransport().cancel()
  clearTransportEndEvent()
  clearTransportStopEvent()
}

/**
 * Stops ambient OGG playback and clears ambient state.
 * @returns {void}
 */
export function stopAmbientPlayback() {
  if (audioState.ambientSource) {
    logger.debug('AudioEngine', 'Stopping ambient OGG playback.')
    try {
      audioState.ambientSource.stop()
    } catch (error) {
      logger.warn('AudioEngine', 'Failed to stop ambient playback', error)
    }
    try {
      audioState.ambientSource.disconnect()
    } catch {
      // Source may already be disconnected after stop
    }
    audioState.ambientSource = null
  }
}

/**
 * Stops the audio transport and disposes of the current loop.
 * Also invalidates any pending playback requests.
 */
export function stopAudio() {
  audioState.playRequestId++
  logger.debug(
    'AudioEngine',
    `stopAudio called. Invalidating reqs. New reqId: ${audioState.playRequestId}`
  )
  stopAudioInternal()
  stopGigPlayback()
  stopAmbientPlayback()
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
 * Returns whether ambient OGG playback is currently active.
 * @returns {boolean}
 */
export function isAmbientOggPlaying() {
  return audioState.ambientSource != null
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
