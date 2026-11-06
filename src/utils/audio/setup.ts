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
 */
export async function setupAudio(): Promise<void> {
  const generation = audioState.setupGeneration
  if (audioState.isSetup) return
  if (audioState.setupLock) {
    const lockGeneration = audioState.setupLockGeneration
    await audioState.setupLock
    if (generation !== audioState.setupGeneration) {
      throw new Error('Audio setup cancelled')
    }
    if (lockGeneration !== generation) return setupAudio()
    if (!audioState.isSetup) {
      throw audioState.setupError || new Error('setupAudio failed')
    }
    return
  }

  let resolveLock: (() => void) | undefined
  audioState.setupLockGeneration = generation
  audioState.setupLock = new Promise<void>(r => {
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
    // Observe rejection immediately, including when disposal cancels the
    // setup while closing the previous context.
    startPromise = startPromise.catch(e => {
      logger.warn('AudioEngine', 'Tone.start() was blocked or failed', e)
    })

    const previousRawContext =
      previousToneContext?.rawContext ?? previousToneContext
    const nextRawContext = nextToneContext?.rawContext ?? nextToneContext
    if (previousRawContext && previousRawContext !== nextRawContext) {
      const maybeClosable = previousRawContext as unknown as {
        close?: () => Promise<void>
        state?: string
      }
      if (
        typeof maybeClosable.close === 'function' &&
        maybeClosable.state !== 'closed'
      ) {
        try {
          await maybeClosable.close()
        } catch (error) {
          logger.warn(
            'AudioEngine',
            'Failed to close previous Tone context',
            error
          )
        }
      }
      // Closing Web Audio alone leaves Tone's ticker worker and context
      // listeners alive, including when recovery found an already-closed context.
      try {
        previousToneContext.dispose?.()
      } catch (error) {
        logger.warn(
          'AudioEngine',
          'Failed to dispose previous Tone context',
          error
        )
      }
      if (generation !== audioState.setupGeneration) {
        throw new Error('Audio setup cancelled')
      }
    }

    await startPromise
    if (generation !== audioState.setupGeneration) {
      throw new Error('Audio setup cancelled')
    }

    setupMasterChain()
    setupGuitar()
    setupBass()
    setupDrums()
    setupSFX()
    setupMidiChain()

    audioState.isSetup = true
  } catch (error) {
    if (generation === audioState.setupGeneration) {
      audioState.setupError = error
    }
    throw error
  } finally {
    audioState.setupLock = null
    audioState.setupLockGeneration = null
    if (resolveLock) resolveLock()
  }
}
