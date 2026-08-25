import { logger } from '../logger'
import { audioState, audioResourceRegistry } from './state'
import { stopTransportAndClear, cleanupTransportEvents } from './cleanupUtils'

/**
 * Runs one teardown step, logging a failure without aborting the rest.
 * @param step - Teardown step to run.
 * @param name - Step name for logging.
 */
function runTeardownStep(step: () => void, name: string): void {
  try {
    step()
  } catch (error) {
    logger.debug('AudioEngine', `${name} failed`, error)
  }
}

/**
 * Disposes of audio engine resources.
 *
 * NOTE: This function duplicates stop logic from playback.js
 * (stopAudioInternal, stopGigPlayback, stopAmbientPlayback) because
 * setup.js must not import from playback.js to preserve the acyclic
 * dependency graph: state to setup to playback to procedural.
 * If you change stop/cleanup logic in playback.js, update this function too.
 *
 * Nodes and sources are released by iterating the audio resource registry in
 * `state.ts`, so adding a node there is the only step needed to have it torn
 * down here.
 */
export function disposeAudio() {
  audioState.playRequestId++
  // stopAudioInternal() logic - we can't call it here directly if it's in playback
  // So we handle the disposal of shared resources manually

  runTeardownStep(stopTransportAndClear, 'stopTransportAndClear')
  runTeardownStep(cleanupTransportEvents, 'cleanupTransportEvents')

  for (const entry of audioResourceRegistry.values()) {
    runTeardownStep(entry.dispose, `${entry.key} release`)
  }

  audioState.audioBufferCache.clear()
  audioState.currentCacheByteSize = 0

  audioState.isSetup = false
  audioState.isCorruptionAudioActive = false
  audioState.setupError = null
}
