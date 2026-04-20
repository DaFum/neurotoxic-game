import { logger } from '../logger'
import { audioState } from './state'
import {
  stopTransportAndClear,
  cleanupGigPlayback,
  cleanupAmbientPlayback,
  cleanupTransportEvents
} from './cleanupUtils'

/**
 * Safely disposes a Tone.js node, catching errors if the context is closed.
 * @param {object} node - The Tone.js node to dispose.
 * @returns {null} Always returns null.
 */
export function safeDispose<T>(node: T | null): null {
  if (node && typeof node.dispose === 'function') {
    try {
      node.dispose()
    } catch (error) {
      logger.debug('AudioEngine', 'Node disposal failed (likely benign)', error)
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
 * dependency graph: state -> setup -> playback -> procedural.
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

  try {
    cleanupGigPlayback()
  } catch (error) {
    logger.debug('AudioEngine', 'cleanupGigPlayback failed', error)
  }

  try {
    cleanupAmbientPlayback()
  } catch (error) {
    logger.debug('AudioEngine', 'cleanupAmbientPlayback failed', error)
  }

  audioState.audioBufferCache.clear()
  audioState.currentCacheByteSize = 0

  audioState.guitar = safeDispose(audioState.guitar)
  audioState.bass = safeDispose(audioState.bass)

  if (audioState.drumKit) {
    audioState.drumKit.kick = safeDispose(audioState.drumKit.kick)
    audioState.drumKit.snare = safeDispose(audioState.drumKit.snare)
    audioState.drumKit.hihat = safeDispose(audioState.drumKit.hihat)
    audioState.drumKit.crash = safeDispose(audioState.drumKit.crash)
    audioState.drumKit = null
  }

  audioState.sfxSynth = safeDispose(audioState.sfxSynth)
  audioState.sfxGain = safeDispose(audioState.sfxGain)
  audioState.musicGain = safeDispose(audioState.musicGain)
  audioState.midiLead = safeDispose(audioState.midiLead)
  audioState.midiBass = safeDispose(audioState.midiBass)

  if (audioState.midiDrumKit) {
    audioState.midiDrumKit.kick = safeDispose(audioState.midiDrumKit.kick)
    audioState.midiDrumKit.snare = safeDispose(audioState.midiDrumKit.snare)
    audioState.midiDrumKit.hihat = safeDispose(audioState.midiDrumKit.hihat)
    audioState.midiDrumKit.crash = safeDispose(audioState.midiDrumKit.crash)
    audioState.midiDrumKit = null
  }

  audioState.midiReverbSend = safeDispose(audioState.midiReverbSend)
  audioState.midiReverb = safeDispose(audioState.midiReverb)
  audioState.midiDryBus = safeDispose(audioState.midiDryBus)

  audioState.distortion = safeDispose(audioState.distortion)
  if (audioState.guitarChorus && !audioState.guitarChorus.disposed) {
    try {
      audioState.guitarChorus.stop?.()
    } catch (error) {
      if (error.name !== 'InvalidStateError') {
        logger.debug(
          'AudioEngine',
          'guitarChorus.stop() failed (likely benign)',
          error
        )
      }
    }
  }
  audioState.guitarChorus = safeDispose(audioState.guitarChorus)
  audioState.guitarEq = safeDispose(audioState.guitarEq)
  audioState.widener = safeDispose(audioState.widener)

  audioState.bassEq = safeDispose(audioState.bassEq)
  audioState.bassComp = safeDispose(audioState.bassComp)

  audioState.drumBus = safeDispose(audioState.drumBus)

  audioState.reverbSend = safeDispose(audioState.reverbSend)
  audioState.reverb = safeDispose(audioState.reverb)
  audioState.masterComp = safeDispose(audioState.masterComp)
  audioState.masterLimiter = safeDispose(audioState.masterLimiter)

  audioState.isSetup = false
  audioState.setupError = null
}
