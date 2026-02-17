import { logger } from '../logger.js'
import { audioState } from './state.js'
import { getRawAudioContext } from './setup.js'

/**
 * Creates and wires a buffer source to the music bus.
 * Shared logic for gig playback and ambient OGG playback.
 * @param {AudioBuffer} buffer - The buffer to play.
 * @param {(source: AudioBufferSourceNode) => void} [onEnded] - Callback when playback ends naturally.
 * @returns {AudioBufferSourceNode|null} The created source or null on error.
 */
export function createAndConnectBufferSource(buffer, onEnded = null) {
  const rawContext = getRawAudioContext()
  const source = rawContext.createBufferSource()
  source.buffer = buffer

  if (audioState.musicGain?.input) {
    source.connect(audioState.musicGain.input)
  } else if (audioState.musicGain) {
    source.connect(audioState.musicGain)
  } else {
    logger.error('AudioEngine', 'Music bus not initialized for buffer playback')
    return null
  }

  if (onEnded) {
    source.onended = () => onEnded(source)
  }

  return source
}
