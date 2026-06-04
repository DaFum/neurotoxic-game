import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState } from './state'
import { ensureAudioContext } from './context'
import { getRawAudioContext, getAudioContextTimeSec } from './context'
import { loadAudioBuffer } from './assets'
import { createAndConnectBufferSource } from './sharedBufferUtils'
import {
  stopTransportAndClear,
  cleanupGigPlayback,
  cleanupAmbientPlayback,
  cleanupTransportEvents
} from './cleanupUtils'

/**
 * Plays a sound effect by type.
 * @param type - The type of SFX (`hit`, `miss`, `menu`, `travel`, `cash`, `crash`, `honk`, `pickup`, `deliver`, or `void_hit`).
 */
export function playSFX(type: string): void {
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
    case 'crash':
      // Low noise burst
      audioState.sfxSynth.triggerAttackRelease('C1', '8n', now, 1.0)
      audioState.sfxSynth.triggerAttackRelease('F1', '8n', now + 0.02, 0.8)
      break
    case 'honk':
      // Car horn
      audioState.sfxSynth.triggerAttackRelease('F#4', '8n', now, 0.6)
      audioState.sfxSynth.triggerAttackRelease('A4', '8n', now, 0.6)
      break
    case 'pickup':
      // Quick upward blip
      audioState.sfxSynth.triggerAttackRelease('C5', '32n', now, 0.5)
      audioState.sfxSynth.triggerAttackRelease('E5', '32n', now + 0.05, 0.5)
      break
    case 'deliver':
      // Heavy success thud
      audioState.sfxSynth.triggerAttackRelease('C2', '4n', now, 0.8)
      audioState.sfxSynth.triggerAttackRelease('G2', '4n', now, 0.6)
      break
    case 'void_hit':
      // Dissonant void impact — tritone cluster at low register
      audioState.sfxSynth.triggerAttackRelease('B1', '8n', now, 0.9)
      audioState.sfxSynth.triggerAttackRelease('F2', '8n', now + 0.03, 0.7)
      audioState.sfxSynth.triggerAttackRelease('C#2', '16n', now + 0.06, 0.5)
      break
    default:
      logger.warn('AudioEngine', `Unknown SFX type: ${type}`)
      break
  }
}

/**
 * Sets the SFX volume.
 * @param vol - Volume between 0 and 1.
 * @returns True when applied to an existing gain node.
 */
export function setSFXVolume(vol: number): boolean {
  if (!audioState.sfxGain) return false
  // Convert 0-1 linear to decibels (approximate or use ramp)
  // Tone.Gain accepts linear values if units are default, but volume is typically db.
  // However, Tone.Gain.gain is linear amplitude.
  audioState.sfxGain.gain.rampTo(Math.max(0, Math.min(1, vol)), 0.1)
  return true
}

/**
 * Sets the music volume using the dedicated music bus.
 * @param vol - Volume between 0 and 1.
 * @returns True when applied to an existing gain node.
 */
export function setMusicVolume(vol: number): boolean {
  if (!audioState.musicGain) return false
  const next = Math.max(0, Math.min(1, vol))
  audioState.musicGain.gain.rampTo(next, 0.1)
  return true
}

/**
 * Calculates gig time in milliseconds based on context time.
 * @param params - Calculation inputs.
 * - `params.contextTimeSec` - Raw audio context time in seconds.
 * - `params.startCtxTimeSec` - Context time when gig playback started.
 * - `params.offsetMs` - Offset in milliseconds to apply.
 * @returns Calculated gig time in milliseconds.
 */
export const calculateGigTimeMs = ({
  contextTimeSec,
  startCtxTimeSec,
  offsetMs
}: {
  contextTimeSec: number
  startCtxTimeSec: number | null
  offsetMs?: number
}): number => {
  const safeOffset = Number.isFinite(offsetMs) ? (offsetMs as number) : 0
  if (
    !Number.isFinite(contextTimeSec) ||
    typeof startCtxTimeSec !== 'number' ||
    !Number.isFinite(startCtxTimeSec)
  ) {
    return safeOffset
  }
  return (contextTimeSec - startCtxTimeSec) * 1000 + safeOffset
}

/**
 * Returns the current gig time in ms.
 * This uses the raw Web Audio context for sample-accurate sync with buffers.
 * @returns Current gig time in ms.
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
 * @param source - The ended source node.
 */
type GigEndedInfo = {
  filename: string | null
  durationMs: number | null
  offsetMs: number
}

const handleGigSourceEnded = (source: AudioBufferSourceNode): void => {
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

const createGigBufferSource = ({
  buffer,
  onEnded
}: {
  buffer: AudioBuffer
  onEnded?: ((_source: AudioBufferSourceNode) => void) | null
}): AudioBufferSourceNode | null => {
  return createAndConnectBufferSource(buffer, onEnded)
}

/**
 * Calculates buffer playback offsets and safe duration for gig playback.
 * @param params - Playback window params.
 * - `params.bufferDurationSec` - Audio buffer duration in seconds.
 * - `params.baseOffsetMs` - Base offset in milliseconds.
 * - `params.seekOffsetMs` - Seek offset in milliseconds.
 * - `params.durationMs` - Requested playback duration in milliseconds.
 * @returns Playback window.
 */
export const calculateGigPlaybackWindow = ({
  bufferDurationSec,
  baseOffsetMs,
  seekOffsetMs,
  durationMs
}: {
  bufferDurationSec: number
  baseOffsetMs: number
  seekOffsetMs: number
  durationMs: number | null
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
  const safeDurationMs =
    typeof durationMs === 'number' && Number.isFinite(durationMs)
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
 */
export function stopGigPlayback() {
  if (audioState.gigSource) {
    logger.debug(
      'AudioEngine',
      `Stopping gig playback: "${audioState.gigFilename}" at ${getGigTimeMs().toFixed(0)}ms`
    )
  }
  cleanupGigPlayback()
}

/**
 * Starts gig playback using Web Audio buffer playback.
 * @param params - Playback params.
 * - `params.filename` - Audio filename to play.
 * - `params.bufferOffsetMs` - Offset into the buffer in ms. Defaults to `0`.
 * - `params.delayMs` - Delay before starting playback in ms. Defaults to `0`.
 * - `params.durationMs` - Optional playback duration in ms. Defaults to `null`.
 * - `params.onEnded` - Optional. Callback invoked after playback ends.
 * @returns True when playback starts.
 */
export async function startGigPlayback({
  filename,
  bufferOffsetMs = 0,
  delayMs = 0,
  durationMs = null,
  onEnded = null
}: {
  filename: string
  bufferOffsetMs?: number
  delayMs?: number
  durationMs?: number | null
  onEnded?: ((args: GigEndedInfo) => void) | null
}): Promise<boolean> {
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
  audioState.gigDurationMs =
    typeof durationMs === 'number' && Number.isFinite(durationMs)
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

  try {
    Tone.getTransport().start(startAt, offsetSeconds)
  } catch (error) {
    logger.warn('AudioEngine', 'Failed to start Tone.Transport', error)
  }

  try {
    if (safeDurationSeconds != null && safeDurationSeconds > 0) {
      source.start(startAt, offsetSeconds, safeDurationSeconds)
    } else {
      source.start(startAt, offsetSeconds)
    }
  } catch (error) {
    logger.warn(
      'AudioEngine',
      'source.start() failed — context may be suspended',
      error
    )
    try {
      Tone.getTransport().stop()
    } catch {
      /* ignore */
    }
    cleanupGigPlayback()
    return false
  }
  logger.info(
    'AudioEngine',
    `Gig playback started: "${filename}" offset=${offsetSeconds.toFixed(2)}s duration=${safeDurationSeconds != null ? safeDurationSeconds.toFixed(2) + 's' : 'full'}`
  )
  return true
}

/**
 * Starts the gig clock without buffer playback (e.g. for MIDI fallback).
 * @param params - Clock params.
 * - `params.delayMs` - Delay before starting the clock in ms. Defaults to `0`.
 * - `params.offsetMs` - Starting offset for the gig clock. Defaults to `0`.
 * - `params.startTimeSec` - Absolute Tone.js time to start the gig clock. Defaults to `null`.
 */
export function startGigClock({
  delayMs = 0,
  offsetMs = 0,
  startTimeSec = null
}: {
  delayMs?: number
  offsetMs?: number
  startTimeSec?: number | null
} = {}): void {
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
 */
export function pauseGigPlayback(): void {
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
 * @returns True on success or no-op, false on source.start() failure.
 */
export function resumeGigPlayback(): boolean {
  if (!audioState.gigIsPaused) return true
  logger.debug(
    'AudioEngine',
    `Resuming gig playback from ${audioState.gigSeekOffsetMs.toFixed(0)}ms`
  )
  if (!audioState.gigBuffer) {
    audioState.gigStartCtxTime = getRawAudioContext().currentTime
    audioState.gigIsPaused = false
    return true
  }
  const source = createGigBufferSource({
    buffer: audioState.gigBuffer,
    onEnded: handleGigSourceEnded
  })
  if (!source) return false

  const startAt = getRawAudioContext().currentTime
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
    return true
  }
  try {
    if (safeDurationSeconds != null && safeDurationSeconds > 0) {
      source.start(startAt, offsetSeconds, safeDurationSeconds)
    } else {
      source.start(startAt, offsetSeconds)
    }
  } catch (error) {
    logger.warn(
      'AudioEngine',
      'source.start() failed on resume — context may be suspended',
      error
    )
    // Null the source that failed to start, but preserve buffer and seek offset for retry
    try {
      audioState.gigSource?.stop?.()
    } catch {
      /* already stopped */
    }
    try {
      audioState.gigSource?.disconnect?.()
    } catch {
      /* already disconnected */
    }
    audioState.gigSource = null
    audioState.gigStartCtxTime = null
    audioState.gigIsPaused = true // revert to paused so caller can retry
    try {
      Tone.getTransport().pause()
    } catch {
      /* ignore */
    }
    return false
  }
  return true
}

/**
 * Internal function to stop audio without invalidating pending requests.
 * Used by playback functions to clear previous state.
 */
export function stopAudioInternal(): void {
  stopTransportAndClear()
  cleanupTransportEvents()
  disableCorruptionBurstAudio()
}

/**
 * Stops ambient OGG playback and clears ambient state.
 */
export function stopAmbientPlayback(): void {
  if (audioState.ambientSource) {
    logger.debug('AudioEngine', 'Stopping ambient OGG playback.')
  }
  cleanupAmbientPlayback()
}

/**
 * Stops the audio transport and disposes of the current loop.
 * Also invalidates any pending playback requests.
 */
export function stopAudio(): void {
  audioState.playRequestId++
  logger.debug(
    'AudioEngine',
    `stopAudio called. Invalidating reqs. New reqId: ${audioState.playRequestId}`
  )
  stopAudioInternal()
  stopGigPlayback()
  stopAmbientPlayback()
}

const awaitMaybePromise = async (value: unknown): Promise<void> => {
  const maybeThenable = value as { then?: unknown } | null | undefined
  if (maybeThenable && typeof maybeThenable.then === 'function') {
    await (value as Promise<unknown>)
  }
}

/**
 * Pauses the audio transport.
 * @returns Resolves when pause is complete.
 */
export async function pauseAudio(): Promise<void> {
  try {
    if (Tone.getTransport().state === 'started') {
      await awaitMaybePromise(Tone.getTransport().pause())
    }
  } catch (err) {
    logger.warn('AudioEngine', 'Failed to pause audio transport', err)
  }
  try {
    pauseGigPlayback()
  } catch (err) {
    logger.warn('AudioEngine', 'Failed to pause gig playback', err)
  }
}

/**
 * Resumes the audio transport.
 * @returns Resolves to the boolean result of resumeGigPlayback() when resume is complete.
 */
export async function resumeAudio(): Promise<boolean> {
  try {
    if (Tone.getTransport().state === 'paused') {
      await awaitMaybePromise(Tone.getTransport().start())
    }
  } catch (err) {
    logger.warn('AudioEngine', 'Failed to resume audio transport', err)
  }

  try {
    // If the gig is already playing, we don't need to try and resume it.
    // The inner resumeGigPlayback also has this check, but this prevents duplicate triggers from multiple rapid resumeAudio calls.
    if (!audioState.gigIsPaused) return true

    const success = resumeGigPlayback()
    if (!success) {
      audioState.gigIsPaused = true // Revert if failed
    }
    return success
  } catch (err) {
    logger.warn('AudioEngine', 'Failed to resume gig playback', err)
    audioState.gigIsPaused = true // Revert if failed
    return false
  }
}

/**
 * Returns the current Tone transport state.
 */
export function getTransportState(): 'started' | 'stopped' | 'paused' {
  return Tone.getTransport().state
}

/**
 * Applies global destination mute.
 * @param muted - Whether the output destination should be muted.
 * @returns The applied mute state.
 */
export function setDestinationMute(muted: boolean): boolean {
  const nextMute = Boolean(muted)
  try {
    Tone.getDestination().mute = nextMute
    return nextMute
  } catch (err) {
    logger.warn('AudioEngine', 'Failed to set destination mute', err)
    try {
      return Tone.getDestination().mute
    } catch {
      return false
    }
  }
}

/**
 * Returns whether ambient OGG playback is currently active.
 */
export function isAmbientOggPlaying(): boolean {
  return audioState.ambientSource != null
}

/**
 * Returns the current absolute audio clock time in milliseconds.
 * Uses the Tone.js AudioContext clock. This absolute time is needed
 * for MIDI note scheduling (which occurs independent of gig state).
 * @returns Current audio time in ms.
 */
export function getToneAbsoluteTimeMs(): number {
  return Tone.now() * 1000
}

/**
 * Returns the current play request ID.
 * @returns The play request ID.
 */
export function getPlayRequestId(): number {
  return audioState.playRequestId
}

export const enableCorruptionBurstAudio = (): void => {
  if (
    audioState.isCorruptionAudioActive ||
    !audioState.masterCorruptionBypass ||
    !audioState.masterCorruptionWetGain
  )
    return
  audioState.isCorruptionAudioActive = true
  audioState.masterCorruptionBypass.gain.rampTo(0, 0.05)
  audioState.masterCorruptionWetGain.gain.rampTo(1, 0.05)
}

export const disableCorruptionBurstAudio = (): void => {
  if (
    !audioState.isCorruptionAudioActive ||
    !audioState.masterCorruptionBypass ||
    !audioState.masterCorruptionWetGain
  )
    return
  audioState.isCorruptionAudioActive = false
  audioState.masterCorruptionBypass.gain.rampTo(1, 0.05)
  audioState.masterCorruptionWetGain.gain.rampTo(0, 0.05)
}

/**
 * Triggers the master corruption effect (distortion)
 * @param active - Whether the effect should be active
 */
export function setCorruptionEffect(active: boolean): void {
  if (audioState.masterCorruption) {
    if (active) {
      audioState.masterCorruption.wet.rampTo(1, 0.1)
    } else {
      audioState.masterCorruption.wet.rampTo(0, 0.5)
    }
  }
}
