import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState, releaseAudioResource } from './state'
import { withAudioContext } from './context'
import {
  pauseGigPlayback,
  resumeGigPlayback,
  stopGigPlayback
} from './gigPlayback'
import { disableCorruptionBurstAudio } from './corruptionEffects'
import { stopTransportAndClear, cleanupTransportEvents } from './cleanupUtils'
import {
  deferScheduledTransportStart,
  resumeDeferredTransportStart
} from './transportStart'

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
function stopAmbientPlayback(): void {
  if (audioState.ambientSource) {
    logger.debug('AudioEngine', 'Stopping ambient OGG playback.')
  }
  releaseAudioResource('ambientSource')
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
  // Invalidate any resume still waiting on the audio-context gate.
  audioState.transportPauseGeneration++
  try {
    // A pending lead-in start is cancelled first, even while the transport
    // runs (a resume can restart it before the lead-in ends): `pause()` leaves
    // that scheduled start in Tone's timeline, so the transport would start by
    // itself under the pause and the paused gig playback would never resume.
    if (
      !deferScheduledTransportStart() &&
      Tone.getTransport().state === 'started'
    ) {
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
  // A pause that lands while this resume awaits must win.
  const pauseGeneration = audioState.transportPauseGeneration
  const isSuperseded = () =>
    pauseGeneration !== audioState.transportPauseGeneration
  try {
    // Guarded: a resume triggered while the context is still suspended would
    // otherwise start a transport that produces no sound. A refused gate is a
    // resume failure — reporting success here would let callers clear the paused
    // state and announce "resumed" while the transport stays silent.
    const gateResult = await withAudioContext(async () => {
      if (isSuperseded()) return false
      if (
        !resumeDeferredTransportStart() &&
        Tone.getTransport().state === 'paused'
      ) {
        await Tone.getTransport().start()
      }
      return true
    }, 'resumeAudio')
    if (gateResult !== true || isSuperseded()) return false
  } catch (err) {
    // A transport that threw on start is not running, so reporting success here
    // would let callers clear the paused state over silent audio — the same
    // failure mode as a refused gate.
    logger.warn('AudioEngine', 'Failed to resume audio transport', err)
    return false
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
 *
 * @remarks
 * A start deferred by {@link pauseAudio} reports as `paused`: Tone says
 * `stopped`, and callers only resume a paused transport.
 */
export function getTransportState(): 'started' | 'stopped' | 'paused' {
  if (audioState.transportDeferredStart) return 'paused'
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
