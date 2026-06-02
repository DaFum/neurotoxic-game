import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { useMainMenuState } from './hooks/useMainMenuState'
import { useMainMenuAudio } from './hooks/useMainMenuAudio'
import { useMainMenuStart } from './hooks/useMainMenuStart'
import { useMainMenuLoad } from './hooks/useMainMenuLoad'

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
    proceedToTour,
    startNewTourFlow,
    handleStartTour,
    handleNameSubmit,
    closeNameInput,
    handleStartNewAnyway
  } = useMainMenuStart({
    isMountedRef,
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
    isMountedRef,
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
    handleNameSubmit,
    handleLoad,
    handleCredits,
    closeNameInput,
    handleStartNewAnyway,
    handleLoadExistingFromPrompt
  }
}
