import { audioState } from './state'

export const enableCorruptionBurstAudio = (): void => {
  if (
    audioState.isCorruptionAudioActive ||
    !audioState.masterCorruptionBypass ||
    !audioState.masterCorruptionWetGain
  )
    return
  audioState.isCorruptionAudioActive = true
  audioState.masterCorruptionBypass.gain.rampTo(0, 0.05)
  audioState.masterCorruptionWetGain.gain.rampTo(1, 0.05)
}

/**
 * Crossfades the master bus back to the clean corruption bypass path.
 */
export const disableCorruptionBurstAudio = (): void => {
  if (
    !audioState.isCorruptionAudioActive ||
    !audioState.masterCorruptionBypass ||
    !audioState.masterCorruptionWetGain
  )
    return
  audioState.isCorruptionAudioActive = false
  audioState.masterCorruptionBypass.gain.rampTo(1, 0.05)
  audioState.masterCorruptionWetGain.gain.rampTo(0, 0.05)
}

/**
 * Triggers the master corruption effect (distortion)
 * @param active - Whether the effect should be active
 */
export function setCorruptionEffect(active: boolean): void {
  if (audioState.masterCorruption) {
    if (active) {
      audioState.masterCorruption.wet.rampTo(1, 0.1)
    } else {
      audioState.masterCorruption.wet.rampTo(0, 0.5)
    }
  }
}
