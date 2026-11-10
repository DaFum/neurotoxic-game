import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { safeStorageOperation } from '../../utils/storage'
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

  const {
    changeScene,
    loadGame,
    addToast,
    resetState,
    updatePlayer,
    hasOtherStoredSave
  } = useGameActions()

  const {
    isMountedRef,
    isStarting,
    setIsStarting,
    isLoadingGame,
    setIsLoadingGame,
    activeModal,
    setActiveModal,
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
    handleStartTour: startTour,
    handleNameSubmit,
    closeNameInput,
    handleStartNewAnyway: startNewTourAnyway
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
    initializeAudio,
    setShowExistingSavePrompt,
    addToast,
    tRef
  })

  const handleCredits = useCallback(
    () => changeScene(GAME_PHASES.CREDITS),
    [changeScene]
  )

  const handleStartTour = useCallback(() => {
    startTour()
  }, [startTour])

  // Additive on purpose: the classic Start Tour path stays exactly as it was,
  // and the Expedition gets its own entry into Tour Prep. G5 owns the HQ/hub
  // transition that eventually makes the Expedition the default loop.
  const enterTourPrep = useCallback(() => {
    changeScene(GAME_PHASES.TOUR_PREP)
    // Fire-and-forget, matching the classic start flow: audio setup never
    // blocks a scene transition.
    initializeAudio()
  }, [changeScene, initializeAudio])

  // Committing the run saves over the slot, so a save this session has not
  // written or loaded (a fresh boot) gets the same prompt as Start Tour. The
  // session's own save (RunSummary's Continue) is the run being continued.
  const handleStartExpedition = useCallback(() => {
    const otherSaveExists = !!safeStorageOperation('checkSaveExists', () =>
      hasOtherStoredSave()
    )
    if (otherSaveExists) {
      setActiveModal({ type: 'existingSave', target: 'expedition' })
      return
    }
    enterTourPrep()
  }, [enterTourPrep, hasOtherStoredSave, setActiveModal])

  const handleStartNewAnyway = useCallback(() => {
    if (
      activeModal?.type === 'existingSave' &&
      activeModal.target === 'expedition'
    ) {
      setActiveModal(null)
      enterTourPrep()
      return
    }
    startNewTourAnyway()
  }, [activeModal, enterTourPrep, setActiveModal, startNewTourAnyway])

  return {
    t,
    isStarting,
    isLoadingGame,
    activeModal,
    setActiveModal,
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
