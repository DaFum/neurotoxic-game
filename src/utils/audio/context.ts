import * as Tone from 'tone'
import { logger } from '../logger'
import {
  canResumeAudioContextState,
  getPreferredAudioContextState,
  isClosedAudioContextState
} from '../audioContextState'
import { audioState } from './state'
import { setupAudio } from './setup'
import { disposeAudio } from './dispose'

/**
 * Returns the raw Web Audio context used by Tone.js.
 * @returns {AudioContext} The raw AudioContext.
 */
export const getRawAudioContext = (): AudioContext | any => {
  const toneContext = Tone.getContext()
  return toneContext?.rawContext ?? toneContext
}

/**
 * Returns the raw AudioContext time in seconds.
 * @returns {number} Current raw AudioContext time in seconds.
 */
export const getAudioContextTimeSec = (): number => {
  return getRawAudioContext().currentTime
}

/**
 * Converts a raw AudioContext start time into a Tone.js time reference.
 * @param {number} rawStartTimeSec - Raw AudioContext time in seconds.
 * @returns {number} Tone.js time in seconds.
 */
export const getToneStartTimeSec = (rawStartTimeSec: number): number => {
  const lookAhead = Tone.getContext()?.lookAhead ?? 0
  return rawStartTimeSec + lookAhead
}

/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<boolean>} True if the AudioContext is running.
 */
export async function ensureAudioContext(): Promise<boolean> {
  // Synchronous resume attempt to capture user gesture for Web Audio unlock (iOS/Safari).
  // Only attempt when audio is already set up to avoid resuming a stale context that
  // setupAudio() is about to replace.
  if (audioState.isSetup && Tone.context) {
    const earlyState = getPreferredAudioContextState({
      rawContextState: getRawAudioContext()?.state,
      toneContextState: Tone.context?.state
    })
    if (canResumeAudioContextState(earlyState)) {
      // On iOS Safari the 'interrupted' state requires the native AudioContext resume
      if (earlyState === 'interrupted') {
        try {
          const resumePromise = getRawAudioContext().resume()
          if (resumePromise && resumePromise.catch) {
            resumePromise.catch(() => {})
          }
        } catch (_e) {
          // Best-effort; full recovery follows below
        }
      } else {
        Tone.context.resume().catch(() => {})
      }
    }
  }

  if (!audioState.isSetup) {
    if (audioState.setupError) {
      audioState.setupError = null
    }
    try {
      await setupAudio()
    } catch (error) {
      logger.error('AudioEngine', 'setupAudio failed', error)
      return false
    }
  }

  const getAudioState = () => {
    let rawContextState = null
    let toneContextState = null

    try {
      rawContextState = getRawAudioContext()?.state
      toneContextState = Tone.context?.state
    } catch (error) {
      logger.debug('AudioEngine', 'Audio state read failed', error)
      return {
        state: getPreferredAudioContextState({
          rawContextState,
          toneContextState
        }),
        rawContextState,
        toneContextState
      }
    }

    return {
      state: getPreferredAudioContextState({
        rawContextState,
        toneContextState
      }),
      rawContextState,
      toneContextState
    }
  }

  const ensureRebuild = async reasonState => {
    if (audioState.rebuildLock) {
      await audioState.rebuildLock
      return audioState.isSetup
    }

    let resolveRebuild
    audioState.rebuildLock = new Promise(r => {
      resolveRebuild = r
    })

    try {
      logger.warn(
        'AudioEngine',
        `AudioContext state is ${reasonState}. Rebuilding audio graph.`
      )
      try {
        disposeAudio()
      } catch (error) {
        logger.debug(
          'AudioEngine',
          'Partial dispose before rebuild failed',
          error
        )
      }
      audioState.isSetup = false
      try {
        await setupAudio()
      } catch (error) {
        logger.error('AudioEngine', 'Rebuild setupAudio failed', error)
        audioState.isSetup = false
        return false
      }

      if (!audioState.isSetup) {
        logger.error(
          'AudioEngine',
          'Audio graph rebuild failed. Playback unavailable.'
        )
        return false
      }

      return true
    } finally {
      if (resolveRebuild) resolveRebuild()
      audioState.rebuildLock = null
    }
  }

  let audioStateCtx = getAudioState()
  if (isClosedAudioContextState(audioStateCtx.state)) {
    const rebuilt = await ensureRebuild(audioStateCtx.state)
    if (!rebuilt) return false
    audioStateCtx = getAudioState()
  }

  if (audioStateCtx.state === 'running') return true

  if (canResumeAudioContextState(audioStateCtx.state)) {
    try {
      await Tone.context.resume()
    } catch (error) {
      logger.warn('AudioEngine', 'Tone.context.resume() failed:', error)
    }
    audioStateCtx = getAudioState()
    if (audioStateCtx.state === 'running') return true
  }

  if (isClosedAudioContextState(audioStateCtx.state)) {
    const rebuiltAfterResume = await ensureRebuild(audioStateCtx.state)
    if (!rebuiltAfterResume) return false
    audioStateCtx = getAudioState()
  }

  return audioStateCtx.state === 'running'
}
