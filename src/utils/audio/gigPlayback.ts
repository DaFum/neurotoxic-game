import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState, type GigEndInfo } from './state'
import {
  getRawAudioContext,
  getAudioContextTimeSec,
  ensureAudioContext
} from './context'
import { createAndConnectBufferSource } from './sharedBufferUtils'
import { cleanupGigPlayback } from './cleanupUtils'
import { loadAudioBuffer } from './assets'

/**
 * Computes elapsed gig time from raw audio-context timestamps.
 *
 * @remarks
 * Pure helper behind {@link getGigTimeMs}. When `startCtxTimeSec` is `null` or
 * any timestamp is non-finite, it returns `offsetMs` alone so callers get a
 * stable baseline before playback has anchored.
 *
 * @param contextTimeSec - Current Web Audio context time, in seconds.
 * @param startCtxTimeSec - Context time captured when the gig began, or `null` before it starts.
 * @param offsetMs - Playback offset into the song to add to the result. Defaults to `0`.
 * @returns Elapsed gig time in milliseconds, or `offsetMs` when timestamps are unavailable.
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
  onEnded?: ((args: GigEndInfo) => void) | null
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
