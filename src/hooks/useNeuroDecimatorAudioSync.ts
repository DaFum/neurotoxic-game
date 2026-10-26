import { useEffect } from 'react'
import { useGameSelector } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'

/**
 * Keeps the audio engine's Neuro-Decimator in step with the stored band flag.
 *
 * @remarks
 * Mounted by `GameContent`, which is on screen in every scene: a loaded save
 * restores `neuroDecimatorActive` and `RESET_STATE` clears it while the HUD is
 * hidden (menu, overworld). The engine records the wanted state, so the node
 * that audio setup builds later starts at the right wet level.
 */
export const useNeuroDecimatorAudioSync = (): void => {
  const wanted = useGameSelector(
    state =>
      !!state.band?.inventory?.neuroDecimator &&
      !!state.band?.neuroDecimatorActive
  )
  useEffect(() => {
    audioService.setNeuroDecimator(wanted)
  }, [wanted])
}
