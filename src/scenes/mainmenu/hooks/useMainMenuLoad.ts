import { useCallback } from 'react'
import { GAME_PHASES } from '../../../context/gameConstants'
import { enterFullscreen } from '../../../utils/fullscreen'

interface UseMainMenuLoadProps {
  isMountedRef: React.MutableRefObject<boolean>
  setIsLoadingGame: (val: boolean) => void
  loadGame: () => boolean
  changeScene: (scene: string) => void
  initializeAudio: () => void
  setShowExistingSavePrompt: (val: boolean) => void
  addToast: (msg: string, type: 'error' | 'success' | 'info') => void
  tRef: React.MutableRefObject<(key: string, options?: unknown) => string>
}

export const useMainMenuLoad = ({
  isMountedRef,
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

    if (!isMountedRef.current) return

    if (!loadGame()) {
      addToast(
        tRef.current('ui:no_save_found', {
          defaultValue: 'No save found'
        }),
        'error'
      )
      if (isMountedRef.current) setIsLoadingGame(false)
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
    isMountedRef,
    setIsLoadingGame,
    tRef
  ])

  const handleLoadExistingFromPrompt = useCallback(() => {
    setShowExistingSavePrompt(false)
    void handleLoad()
  }, [handleLoad, setShowExistingSavePrompt])

  return {
    handleLoad,
    handleLoadExistingFromPrompt
  }
}
