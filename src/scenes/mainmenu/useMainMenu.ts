import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { useMainMenuState } from './hooks/useMainMenuState'
import { useMainMenuAudio } from './hooks/useMainMenuAudio'
import { useMainMenuStart } from './hooks/useMainMenuStart'
import { useMainMenuLoad } from './hooks/useMainMenuLoad'

/**
 * Composes main-menu state, audio setup, start/load flows, and modal controls.
 * @returns Main-menu state, prompt controls, and action handlers.
 */
export const useMainMenu = () => {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const { changeScene, loadGame, addToast, resetState, updatePlayer } =
    useGameActions()

  const {
    isMountedRef,
    isStarting,
    setIsStarting,
    isLoadingGame,
    setIsLoadingGame,
    showNameInput,
    setShowNameInput,
    playerNameInput,
    setPlayerNameInput,
    showSocials,
    setShowSocials,
    showFeatures,
    setShowFeatures,
    showExistingSavePrompt,
    setShowExistingSavePrompt,
    inputRef
  } = useMainMenuState()

  const { initializeAudio } = useMainMenuAudio(isMountedRef, addToast, tRef)

  const {
    handleStartTour,
    handleNameSubmit,
    closeNameInput,
    handleStartNewAnyway
  } = useMainMenuStart({
    setIsStarting,
    resetState,
    updatePlayer,
    changeScene,
    initializeAudio,
    setShowNameInput,
    setShowExistingSavePrompt,
    playerNameInput,
    addToast,
    tRef
  })

  const { handleLoad, handleLoadExistingFromPrompt } = useMainMenuLoad({
    setIsLoadingGame,
    loadGame,
    changeScene,
    initializeAudio,
    setShowExistingSavePrompt,
    addToast,
    tRef
  })

  const handleCredits = useCallback(
    () => changeScene(GAME_PHASES.CREDITS),
    [changeScene]
  )

  // Additive on purpose: the classic Start Tour path stays exactly as it was,
  // and the Expedition gets its own entry into Tour Prep. G5 owns the HQ/hub
  // transition that eventually makes the Expedition the default loop.
  const handleStartExpedition = useCallback(() => {
    changeScene(GAME_PHASES.TOUR_PREP)
    // Fire-and-forget, matching the classic start flow: audio setup never
    // blocks a scene transition.
    initializeAudio()
  }, [changeScene, initializeAudio])

  return {
    t,
    isStarting,
    isLoadingGame,
    showNameInput,
    setShowNameInput,
    playerNameInput,
    setPlayerNameInput,
    showSocials,
    setShowSocials,
    showFeatures,
    setShowFeatures,
    showExistingSavePrompt,
    setShowExistingSavePrompt,
    inputRef,
    handleStartTour,
    handleStartExpedition,
    handleNameSubmit,
    handleLoad,
    handleCredits,
    closeNameInput,
    handleStartNewAnyway,
    handleLoadExistingFromPrompt
  }
}
