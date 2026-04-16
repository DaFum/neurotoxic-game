// @ts-nocheck
import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState } from './state'
import {
  setupMasterChain,
  setupGuitar,
  setupBass,
  setupDrums,
  setupSFX,
  setupMidiChain
} from './instruments'

/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (audioState.isSetup) return
  if (audioState.setupLock) {
    await audioState.setupLock
    if (!audioState.isSetup) {
      throw audioState.setupError || new Error('setupAudio failed')
    }
    return
  }

  let resolveLock
  audioState.setupLock = new Promise(r => {
    resolveLock = r
  })
  audioState.setupError = null

  try {
    const previousToneContext = Tone.getContext()

    // Configure Tone.js context for sustained playback (gigs are 30-60s)
    // "balanced" prioritizes performance over ultra-low latency, reducing pops/crackles
    const nextToneContext = new Tone.Context({
      latencyHint: 'balanced',
      lookAhead: 0.15 // Increased from default 0.1 for better scheduling during high CPU
    })
    Tone.setContext(nextToneContext)

    // Trigger Tone.start() (which calls resume()) immediately to capture the user gesture synchronously.
    // We store the promise and await it later after cleanup.
    let startPromise
    try {
      startPromise = Tone.start()
    } catch (e) {
      startPromise = Promise.reject(e)
    }

    const previousRawContext =
      previousToneContext?.rawContext ?? previousToneContext
    const nextRawContext = nextToneContext?.rawContext ?? nextToneContext
    if (
      previousRawContext &&
      previousRawContext !== nextRawContext &&
      typeof previousRawContext.close === 'function' &&
      previousRawContext.state !== 'closed'
    ) {
      try {
        await previousRawContext.close()
      } catch (error) {
        logger.warn(
          'AudioEngine',
          'Failed to close previous Tone context',
          error
        )
      }
    }

    try {
      await startPromise
    } catch (e) {
      // Browser autoplay policy might block this; it will be resumed later via ensureAudioContext
      logger.warn('AudioEngine', 'Tone.start() was blocked or failed', e)
    }

    setupMasterChain()
    setupGuitar()
    setupBass()
    setupDrums()
    setupSFX()
    setupMidiChain()

    audioState.isSetup = true
  } catch (error) {
    audioState.setupError = error
    throw error
  } finally {
    audioState.setupLock = null
    if (resolveLock) resolveLock()
  }
}
