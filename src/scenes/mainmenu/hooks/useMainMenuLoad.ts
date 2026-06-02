import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { GAME_PHASES } from '../../../context/gameConstants'
import { enterFullscreen } from '../../../utils/fullscreen'
import type { GamePhase } from '../../../types/game'
import type { TFunction } from 'i18next'

interface UseMainMenuLoadProps {
  setIsLoadingGame: (val: boolean) => void
  loadGame: () => boolean
  changeScene: (scene: GamePhase) => void
  initializeAudio: () => void
  setShowExistingSavePrompt: (val: boolean) => void
  addToast: (msg: string, type: 'error' | 'success' | 'info') => void
  tRef: MutableRefObject<TFunction>
}

export const useMainMenuLoad = ({
  setIsLoadingGame,
  loadGame,
  changeScene,
  initializeAudio,
  setShowExistingSavePrompt,
  addToast,
  tRef
}: UseMainMenuLoadProps) => {
  /**
   * Handles loading a saved game.
   */
  const handleLoad = useCallback(() => {
    setIsLoadingGame(true)

    if (!loadGame()) {
      addToast(
        tRef.current('ui:no_save_found', {
          defaultValue: 'No save found'
        }),
        'error'
      )
      setIsLoadingGame(false)
      return
    }

    void enterFullscreen()
    // State transitions (batched automatically by React 18+)
    changeScene(GAME_PHASES.OVERWORLD)

    // Audio is fire-and-forget; Overworld re-syncs audio.
    initializeAudio()
  }, [
    loadGame,
    addToast,
    changeScene,
    initializeAudio,
    setIsLoadingGame,
    tRef
  ])

  const handleLoadExistingFromPrompt = useCallback(() => {
    setShowExistingSavePrompt(false)
    handleLoad()
  }, [handleLoad, setShowExistingSavePrompt])

  return {
    handleLoad,
    handleLoadExistingFromPrompt
  }
}
