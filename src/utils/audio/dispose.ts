import { logger } from '../logger'
import { audioState, resetGigState } from './state'
import {
  stopTransportAndClear,
  cleanupTransportEvents
} from './cleanupUtils'

/**
 * Safely disposes a Tone.js node, catching errors if the context is closed.
 * @param node - The Tone.js node to dispose.
 * @returns Always returns null.
 */
export function safeDispose(
  node: { dispose?: () => void } | null | undefined
): null {
  if (node && typeof node.dispose === 'function') {
    try {
      node.dispose()
    } catch (err) {
      logger.debug('AudioEngine', 'Node disposal failed (likely benign)', err)
    }
  }
  return null
}

/**
 * Disposes of audio engine resources.
 *
 * NOTE: This function duplicates stop logic from playback.js
 * (stopAudioInternal, stopGigPlayback, stopAmbientPlayback) because
 * setup.js must not import from playback.js to preserve the acyclic
 * dependency graph: state to setup to playback to procedural.
 * If you change stop/cleanup logic in playback.js, update this function too.
 */
export function disposeAudio() {
  audioState.playRequestId++
  // stopAudioInternal() logic - we can't call it here directly if it's in playback
  // So we handle the disposal of shared resources manually

  try {
    stopTransportAndClear()
  } catch (error) {
    logger.debug('AudioEngine', 'stopTransportAndClear failed', error)
  }

  try {
    cleanupTransportEvents()
  } catch (error) {
    logger.debug('AudioEngine', 'cleanupTransportEvents failed', error)
  }


  audioState.audioBufferCache.clear()
  audioState.currentCacheByteSize = 0

  for (const node of audioState.activeSources) {
    // Special handling for nodes that might need to be stopped before disposal
    // to prevent InvalidStateErrors (like guitarChorus)
    if (node.key === 'guitarChorus') {
      try {
        node.stop?.()
      } catch (err) {
        if (!(err instanceof Error) || err.name !== 'InvalidStateError') {
          logger.debug(
            'AudioEngine',
            'guitarChorus.stop() failed (likely benign)',
            err
          )
        }
      }
    }
    safeDispose(node)
  }
  audioState.activeSources = []
  resetGigState()

  // Clean up instrument structure references
  audioState.guitar = null
  audioState.bass = null
  audioState.drumKit = null
  audioState.sfxSynth = null
  audioState.sfxGain = null
  audioState.musicGain = null
  audioState.midiLead = null
  audioState.midiBass = null
  audioState.midiDrumKit = null
  audioState.midiReverbSend = null
  audioState.midiReverb = null
  audioState.midiDryBus = null
  audioState.distortion = null
  audioState.guitarChorus = null
  audioState.guitarEq = null
  audioState.widener = null
  audioState.bassEq = null
  audioState.bassComp = null
  audioState.drumBus = null
  audioState.reverbSend = null
  audioState.reverb = null
  audioState.masterCorruptionDistortion = null
  audioState.masterCorruptionBypass = null
  audioState.masterCorruptionWetGain = null
  audioState.neuroDistortion = null
  audioState.masterComp = null
  audioState.masterLimiter = null

  audioState.ambientSource = null
  audioState.gigSource = null

  audioState.isSetup = false
  audioState.isCorruptionAudioActive = false
  audioState.setupError = null
}
