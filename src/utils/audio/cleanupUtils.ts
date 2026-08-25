import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState } from './state'

/**
 * Clears transport event by ID.
 * @param id - Event ID.
 * @param name - Event name for logging.
 */
export function clearTransportEvent(id: number | null, name: string): void {
  if (id == null) return
  try {
    Tone.getTransport().clear(id)
  } catch (err) {
    logger.warn('AudioEngine', `Failed to clear transport ${name} event`, err)
  }
}

/**
 * Stops Tone.js transport and clears common resources.
 */
export function stopTransportAndClear() {
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
}

/**
 * Cleans up transport event IDs.
 */
export function cleanupTransportEvents() {
  clearTransportEvent(audioState.transportEndEventId, 'end')
  audioState.transportEndEventId = null
  clearTransportEvent(audioState.transportStopEventId, 'stop')
  audioState.transportStopEventId = null
}
