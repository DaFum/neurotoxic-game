import { logger } from '../logger'
import { audioState } from './state'
import { getRawAudioContext } from './context'

/**
 * Creates and wires a buffer source to the music bus.
 * Shared logic for gig playback and ambient OGG playback.
 * @param buffer - The buffer to play.
 * @param onEnded - Optional. Callback when playback ends naturally.
 * @returns The created source or null on error.
 */
export function createAndConnectBufferSource(
  buffer: AudioBuffer,
  onEnded: ((_source: AudioBufferSourceNode) => void) | null = null
): AudioBufferSourceNode | null {
  const rawContext = getRawAudioContext()
  const source = rawContext.createBufferSource()
  source.buffer = buffer

  if (audioState.musicGain?.input) {
    source.connect(audioState.musicGain.input)
  } else if (audioState.musicGain) {
    source.connect(audioState.musicGain as unknown as AudioNode)
  } else {
    logger.error('AudioEngine', 'Music bus not initialized for buffer playback')
    return null
  }

  if (onEnded) {
    source.onended = () => onEnded(source)
  }

  return source
}

/**
 * Detaches a finished buffer source from the audio graph.
 *
 * @remarks
 * For sources that either never started (zero-length window) or already ended,
 * so it does not call `stop()`. Clears `onended` first so the node cannot
 * re-enter its end handler.
 *
 * @param source - The ended or never-started source node.
 */
export function cleanupEndedSource(source: AudioBufferSourceNode): void {
  source.onended = null
  try {
    source.disconnect()
  } catch {
    // Source may already be disconnected
  }
}
