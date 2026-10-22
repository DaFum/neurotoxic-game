import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { enterFullscreen } from '../../../utils/fullscreen'
import type { TFunction } from 'i18next'
import type { ToastCallback } from '../../../types/callbacks'
import type { LoadGameResult } from '../../../types'

interface UseMainMenuLoadProps {
  setIsLoadingGame: (val: boolean) => void
  loadGame: () => LoadGameResult
  initializeAudio: () => void
  setShowExistingSavePrompt: (val: boolean) => void
  addToast: ToastCallback
  tRef: MutableRefObject<TFunction>
}

/**
 * Builds handlers for loading an existing save from the main menu.
 * @param params - Loading-state setter, load action, audio initializer, existing-save prompt setter, toast callback, and translator ref.
 * @returns Load handlers for the direct load button and existing-save prompt.
 */
export const useMainMenuLoad = ({
  setIsLoadingGame,
  loadGame,
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

    const result = loadGame()
    if (!result.ok) {
      // Every other refusal has already shown its own message.
      if (result.reason === 'missing') {
        addToast(
          tRef.current('ui:no_save_found', {
            defaultValue: 'No save found'
          }),
          'error'
        )
      }
      setIsLoadingGame(false)
      return
    }

    void enterFullscreen()
    // LOAD_GAME owns the scene: OVERWORLD, or GAMEOVER when settling a
    // pending gig bankrupts the band or wins the Career Finale. Navigating
    // here would override that terminal scene.

    // Audio is fire-and-forget; Overworld re-syncs audio.
    initializeAudio()
  }, [loadGame, addToast, initializeAudio, setIsLoadingGame, tRef])

  const handleLoadExistingFromPrompt = useCallback(() => {
    setShowExistingSavePrompt(false)
    handleLoad()
  }, [handleLoad, setShowExistingSavePrompt])

  return {
    handleLoad,
    handleLoadExistingFromPrompt
  }
}
