import { useEffect, useRef, useState, useCallback } from 'react'
import { safeStorageOperation, handleError } from '../../utils/errorHandler'
import { getSafeUUID } from '../../utils/crypto'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { audioManager } from '../../utils/AudioManager'

export const useMainMenu = () => {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const { changeScene, loadGame, addToast, resetState, updatePlayer } =
    useGameState()

  const isMountedRef = useRef(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [showSocials, setShowSocials] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showExistingSavePrompt, setShowExistingSavePrompt] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (showNameInput) {
      inputRef.current?.focus()
    }
  }, [showNameInput])

  const reportAudioIssue = useCallback(
    (error: unknown, fallbackMessage: string) => {
      if (!isMountedRef.current) return
      try {
        handleError(error, { addToast, fallbackMessage })
      } catch {
        // Never block scene transitions on toast/reporting failures.
      }
    },
    [addToast]
  )

  const startAmbientSafely = useCallback(() => {
    void audioManager.startAmbient().catch(err => {
      reportAudioIssue(
        err,
        tRef.current('ui:errors.ambient_start_failed', {
          defaultValue: 'Failed to start ambient audio'
        })
      )
    })
  }, [reportAudioIssue])

  const initializeAudio = useCallback(() => {
    void audioManager
      .ensureAudioContext()
      .then(success => {
        if (success) {
          startAmbientSafely()
        } else {
          reportAudioIssue(
            new Error('Audio unlock failed'),
            tRef.current('ui:errors.audio_init_failed', {
              defaultValue: 'Audio initialization failed'
            })
          )
        }
      })
      .catch(err =>
        reportAudioIssue(
          err,
          tRef.current('ui:errors.audio_init_failed', {
            defaultValue: 'Audio initialization failed'
          })
        )
      )
  }, [reportAudioIssue, startAmbientSafely])

  const proceedToTour = useCallback(() => {
    setIsStarting(true)

    // Optimization: Artificial delay removed
    if (!isMountedRef.current) return

    // Capture identity before reset
    const savedPlayerId = safeStorageOperation('getPlayerId', () =>
      localStorage.getItem('neurotoxic_player_id')
    )
    const savedPlayerName = safeStorageOperation('getPlayerName', () =>
      localStorage.getItem('neurotoxic_player_name')
    )

    // State transitions (batched automatically by React 18+)
    resetState()

    // Re-apply identity unconditionally (protects against storage failure but valid in-memory session)
    if (savedPlayerId && savedPlayerName) {
      updatePlayer({
        playerId: savedPlayerId,
        playerName: savedPlayerName
      })
    }

    changeScene(GAME_PHASES.OVERWORLD)

    // Audio setup is fire-and-forget — never blocks scene transitions.
    initializeAudio()
  }, [resetState, changeScene, initializeAudio, updatePlayer])

  const startNewTourFlow = useCallback(() => {
    // Check for existing player identity
    const savedPlayerId = safeStorageOperation('getPlayerId', () =>
      localStorage.getItem('neurotoxic_player_id')
    )
    const savedPlayerName = safeStorageOperation('getPlayerName', () =>
      localStorage.getItem('neurotoxic_player_name')
    )

    if (!savedPlayerId || !savedPlayerName) {
      setShowNameInput(true)
      return
    }

    updatePlayer({
      playerId: savedPlayerId,
      playerName: savedPlayerName
    })
    void proceedToTour()
  }, [proceedToTour, updatePlayer])

  const handleStartTour = useCallback(() => {
    const savedGameExists = !!safeStorageOperation('checkSaveExists', () =>
      localStorage.getItem('neurotoxic_v3_save')
    )
    if (savedGameExists) {
      setShowExistingSavePrompt(true)
      return
    }

    startNewTourFlow()
  }, [startNewTourFlow])

  const handleNameSubmit = useCallback(() => {
    if (!playerNameInput.trim()) {
      addToast(
        tRef.current('ui:enter_name_error', {
          defaultValue: 'Please enter a name'
        }),
        'error'
      )
      return
    }

    const newId = getSafeUUID()
    const newName = playerNameInput.trim()

    safeStorageOperation('setPlayerId', () =>
      localStorage.setItem('neurotoxic_player_id', newId)
    )
    safeStorageOperation('setPlayerName', () =>
      localStorage.setItem('neurotoxic_player_name', newName)
    )

    updatePlayer({
      playerId: newId,
      playerName: newName
    })

    setShowNameInput(false)
    void proceedToTour()
  }, [playerNameInput, addToast, proceedToTour, updatePlayer])

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

    // State transitions (batched automatically by React 18+)
    changeScene(GAME_PHASES.OVERWORLD)

    // Audio is fire-and-forget; Overworld re-syncs audio.
    initializeAudio()
  }, [loadGame, addToast, changeScene, initializeAudio])

  const handleCredits = useCallback(
    () => changeScene(GAME_PHASES.CREDITS),
    [changeScene]
  )
  const closeNameInput = useCallback(() => setShowNameInput(false), [])

  const handleStartNewAnyway = useCallback(() => {
    setShowExistingSavePrompt(false)
    startNewTourFlow()
  }, [startNewTourFlow])

  const handleLoadExistingFromPrompt = useCallback(() => {
    setShowExistingSavePrompt(false)
    void handleLoad()
  }, [handleLoad])

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
