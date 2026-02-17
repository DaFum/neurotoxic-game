import * as Tone from 'tone'
import { logger } from '../logger.js'
import { audioState, resetGigState } from './state.js'

/**
 * Clears transport event by ID.
 * @param {number|null} id - Event ID.
 * @param {string} name - Event name for logging.
 */
export function clearTransportEvent(id, name) {
  if (id == null) return
  try {
    Tone.getTransport().clear(id)
  } catch (error) {
    logger.debug('AudioEngine', `Failed to clear transport ${name} event`, error)
  }
}

/**
 * Stops and disconnects an audio source safely.
 * @param {AudioNode|null} source - The source node.
 * @param {string} name - Name for logging.
 */
export function stopAndDisconnectSource(source, name) {
  if (!source) return
  try {
    source.stop()
  } catch (error) {
    logger.debug('AudioEngine', `${name} source stop failed`, error)
  }
  try {
    source.disconnect()
  } catch (error) {
    logger.debug('AudioEngine', `${name} source disconnect failed`, error)
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
