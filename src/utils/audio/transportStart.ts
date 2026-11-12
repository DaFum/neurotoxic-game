import * as Tone from 'tone'
import { audioState } from './state'
import { getAudioContextTimeSec } from './context'

/**
 * Starts the Tone transport at an absolute context time and remembers it.
 *
 * @remarks
 * Gig playback schedules the transport after a lead-in. Tone reports such a
 * transport as `stopped` until the start time arrives, so a plain
 * `transport.pause()` cannot stop it; recording the start lets
 * {@link deferScheduledTransportStart} cancel it instead.
 *
 * @param timeSec - Absolute audio-context time to start at, in seconds.
 * @param offset - Optional transport offset passed through to Tone.
 */
export function startTransportAt(timeSec: number, offset?: number): void {
  // Record only after Tone accepted the start: a throw must neither leave a
  // phantom scheduled start nor drop a deferred one that a retry still needs.
  Tone.getTransport().start(timeSec, offset)
  audioState.transportDeferredStart = null
  audioState.transportScheduledStart = { timeSec, offset }
}

/**
 * Returns how long until a scheduled transport start actually begins.
 *
 * @remarks
 * Tone reports `stopped` until the scheduled time, so state snapshots taken
 * right after {@link startTransportAt} miss the start. Callers use this delay to
 * refresh them once the transport is running.
 *
 * @returns Milliseconds until the scheduled start, or `null` when no start is
 * pending in the future.
 */
export function getPendingTransportStartDelayMs(): number | null {
  const scheduled = audioState.transportScheduledStart
  if (!scheduled) return null
  const remainingMs = (scheduled.timeSec - getAudioContextTimeSec()) * 1000
  return remainingMs > 0 ? remainingMs : null
}

/**
 * Forgets any scheduled or deferred transport start.
 */
export function clearScheduledTransportStart(): void {
  audioState.transportScheduledStart = null
  audioState.transportDeferredStart = null
}

/**
 * Cancels a transport start that is still in the future and keeps the
 * remaining lead-in so {@link resumeDeferredTransportStart} can restore it.
 *
 * @returns Whether a pending start was cancelled.
 */
export function deferScheduledTransportStart(): boolean {
  const scheduled = audioState.transportScheduledStart
  if (!scheduled) return false
  const nowSec = getAudioContextTimeSec()
  const remainingSec = scheduled.timeSec - nowSec
  if (!(remainingSec > 0)) return false
  // Stop at raw context time, not Tone's lookahead time: a start inside
  // lookahead is still pending and must be cancelled before it can fire.
  Tone.getTransport().stop(nowSec)
  audioState.transportScheduledStart = null
  audioState.transportDeferredStart = { remainingSec, offset: scheduled.offset }
  return true
}

/**
 * Re-schedules a start cancelled by {@link deferScheduledTransportStart},
 * keeping the lead-in that was left when it was cancelled.
 *
 * @returns Whether a deferred start was re-scheduled.
 */
export function resumeDeferredTransportStart(): boolean {
  const deferred = audioState.transportDeferredStart
  if (!deferred) return false
  startTransportAt(
    getAudioContextTimeSec() + deferred.remainingSec,
    deferred.offset
  )
  return true
}
