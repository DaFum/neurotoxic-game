import { useCallback } from 'react'
import { safeStorageOperation } from '../../../utils/storage'
import { getSafeUUID } from '../../../utils/crypto'
import { GAME_PHASES } from '../../../context/gameConstants'
import { enterFullscreen } from '../../../utils/fullscreen'

interface UseMainMenuStartProps {
  isMountedRef: React.MutableRefObject<boolean>
  setIsStarting: (val: boolean) => void
  resetState: () => void
  updatePlayer: (player: { playerId: string; playerName: string }) => void
  changeScene: (scene: string) => void
  initializeAudio: () => void
  setShowNameInput: (val: boolean) => void
  setShowExistingSavePrompt: (val: boolean) => void
  playerNameInput: string
  addToast: (msg: string, type: 'error' | 'success' | 'info') => void
  tRef: React.MutableRefObject<(key: string, options?: unknown) => string>
}

export const useMainMenuStart = ({
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
}: UseMainMenuStartProps) => {
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
  }, [
    resetState,
    changeScene,
    initializeAudio,
    updatePlayer,
    isMountedRef,
    setIsStarting
  ])

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
  }, [proceedToTour, updatePlayer, setShowNameInput])

  const handleStartTour = useCallback(() => {
    const savedGameExists = !!safeStorageOperation('checkSaveExists', () =>
      localStorage.getItem('neurotoxic_v3_save')
    )
    if (savedGameExists) {
      setShowExistingSavePrompt(true)
      return
    }

    startNewTourFlow()
    void enterFullscreen()
  }, [startNewTourFlow, setShowExistingSavePrompt])

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
  }, [playerNameInput, addToast, proceedToTour, updatePlayer, setShowNameInput, tRef])

  const closeNameInput = useCallback(
    () => setShowNameInput(false),
    [setShowNameInput]
  )

  const handleStartNewAnyway = useCallback(() => {
    void enterFullscreen()
    setShowExistingSavePrompt(false)
    startNewTourFlow()
  }, [startNewTourFlow, setShowExistingSavePrompt])

  return {
    proceedToTour,
    startNewTourFlow,
    handleStartTour,
    handleNameSubmit,
    closeNameInput,
    handleStartNewAnyway
  }
}
