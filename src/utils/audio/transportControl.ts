import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState } from './state'
import {
  pauseGigPlayback,
  resumeGigPlayback,
  stopGigPlayback
} from './gigPlayback'
import { disableCorruptionBurstAudio } from './corruptionEffects'
import {
  stopTransportAndClear,
  cleanupAmbientPlayback,
  cleanupTransportEvents
} from './cleanupUtils'

/**
 * Tears down the Tone transport, scheduled events, and corruption burst audio.
 *
 * @remarks
 * The shared teardown used by {@link stopAudio}; it does not stop gig or ambient
 * playback or invalidate pending play requests, so call {@link stopAudio} for a
 * full stop.
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

/**
 * Pauses Tone transport and gig playback, logging recoverable failures.
 * @returns Resolves after pause attempts finish.
 */
export async function pauseAudio(): Promise<void> {
  try {
    if (Tone.getTransport().state === 'started') {
      await Tone.getTransport().pause()
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
 * Resumes Tone transport and gig playback, preserving paused state on failure.
 * @returns Whether gig playback is running or was already active.
 */
export async function resumeAudio(): Promise<boolean> {
  try {
    if (Tone.getTransport().state === 'paused') {
      await Tone.getTransport().start()
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
 * Sets Tone's global destination mute flag with a best-effort fallback read.
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
