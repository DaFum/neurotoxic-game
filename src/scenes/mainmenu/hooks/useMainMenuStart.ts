import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { safeStorageOperation } from '../../../utils/storage'
import { getSafeUUID } from '../../../utils/crypto'
import { GAME_PHASES } from '../../../context/gameConstants'
import { enterFullscreen } from '../../../utils/fullscreen'
import type { GamePhase } from '../../../types/game'
import type { TFunction } from 'i18next'

interface UseMainMenuStartProps {
  setIsStarting: (val: boolean) => void
  resetState: () => void
  updatePlayer: (player: { playerId: string; playerName: string }) => void
  changeScene: (scene: GamePhase) => void
  initializeAudio: () => void
  setShowNameInput: (val: boolean) => void
  setShowExistingSavePrompt: (val: boolean) => void
  playerNameInput: string
  addToast: (msg: string, type: 'error' | 'success' | 'info') => void
  tRef: MutableRefObject<TFunction>
}

/**
 * Coordinates the main-menu start flow, including identity restoration, name prompts, audio bootstrapping, and scene transition.
 * @param params - Start-flow state setters, state actions, audio initializer, prompt setters, player-name input, toast callback, and translator ref.
 * @returns Start-flow handlers for named and existing-player tour starts.
 */
export const useMainMenuStart = ({
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
  }, [resetState, changeScene, initializeAudio, updatePlayer, setIsStarting])

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
    proceedToTour()
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

  const handleNameSubmit = useCallback((explicitName?: string) => {
    const resolvedName = (explicitName || playerNameInput).trim()
    if (!resolvedName) {
      addToast(
        tRef.current('ui:enter_name_error', {
          defaultValue: 'Please enter a name'
        }),
        'error'
      )
      return
    }

    const newId = getSafeUUID()

    safeStorageOperation('setPlayerId', () =>
      localStorage.setItem('neurotoxic_player_id', newId)
    )
    safeStorageOperation('setPlayerName', () =>
      localStorage.setItem('neurotoxic_player_name', resolvedName)
    )

    updatePlayer({
      playerId: newId,
      playerName: resolvedName
    })

    setShowNameInput(false)
    proceedToTour()
  }, [
    playerNameInput,
    addToast,
    proceedToTour,
    updatePlayer,
    setShowNameInput,
    tRef
  ])

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
