import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { MINIGAME_TYPES } from '../context/gameConstants'
import { logger } from '../utils/logger'
import type { MinigameLogicBase } from '../types/components'

export interface UseMinigameSceneLogicProps<TState> {
  logic: MinigameLogicBase<TState>
  uiState?: { isGameOver?: boolean; [key: string]: unknown }
  onComplete: () => void
}

export const useMinigameSceneLogic = <TState,>({
  logic,
  uiState,
  onComplete
}: UseMinigameSceneLogicProps<TState>) => {
  const band = useGameSelector(state => state.band)
  const minigameType = useGameSelector(state => state.minigame?.type)
  const {
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration
  } = useGameActions()

  const continueButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const logicRef = useRef(logic)
  const onCompleteRef = useRef(onComplete)

  useLayoutEffect(() => {
    logicRef.current = logic
    onCompleteRef.current = onComplete
  }, [logic, onComplete])

  useLayoutEffect(() => {
    if (uiState?.isGameOver) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      continueButtonRef.current?.focus()
    }

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [uiState?.isGameOver])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uiState?.isGameOver && e.key === 'Escape') {
        onCompleteRef.current()
      } else if (
        import.meta.env?.DEV &&
        e.shiftKey &&
        e.key.toUpperCase() === 'P'
      ) {
        // Only trigger backdoor if minigame is not already finished to avoid duplicate calls
        if (!uiState?.isGameOver) {
          const currentLogic = logicRef.current
          if (currentLogic?.finishMinigame) {
            currentLogic.finishMinigame()
          } else if (minigameType === MINIGAME_TYPES.TOURBUS) {
            completeTravelMinigame(0, [])
            onCompleteRef.current()
            return
          } else if (minigameType === MINIGAME_TYPES.ROADIE) {
            completeRoadieMinigame(0)
            onCompleteRef.current()
            return
          } else if (minigameType === MINIGAME_TYPES.KABELSALAT) {
            completeKabelsalatMinigame({ isPoweredOn: true, timeLeft: 0 })
            onCompleteRef.current()
            return
          } else if (minigameType === MINIGAME_TYPES.AMP_CALIBRATION) {
            completeAmpCalibration(100)
            onCompleteRef.current()
            return
          } else {
            logger.warn(
              'Minigame',
              'Unhandled minigame type for completion',
              minigameType
            )
            return
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    uiState?.isGameOver,
    minigameType,
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration
  ])

  // Player-initiated skip for the pre-gig setup minigames: an explicit exit
  // affordance like CLINIC/ASSETS have. Skip is a FORFEIT classified as a failed
  // run (never a perfect/best-case clear), so it can't be used to farm rewards:
  //  - Amp score 0 / Kabelsalat not-powered → stress > 0 → failed run, no bonus.
  //  - Roadie max equipment damage (> 50 → failed) AND the escorted contraband
  //    is consumed (stashItemId), so skipping can't dodge damage or keep it.
  // Travel (Tourbus) is deliberately excluded: its arrival continuation reads
  // not-yet-committed travel state, so a synchronous skip would misroute arrival.
  // The completion reducers reset minigame state and leave currentScene
  // untouched; onComplete owns the scene change.
  const handleSkip = useCallback(() => {
    if (uiState?.isGameOver) return
    switch (minigameType) {
      case MINIGAME_TYPES.ROADIE: {
        const stashItemId = band?.stash ? Object.keys(band.stash)[0] : undefined
        completeRoadieMinigame(100, 0, stashItemId)
        break
      }
      case MINIGAME_TYPES.KABELSALAT:
        completeKabelsalatMinigame({ isPoweredOn: false, timeLeft: 0 })
        break
      case MINIGAME_TYPES.AMP_CALIBRATION:
        completeAmpCalibration(0)
        break
      default:
        logger.warn('Minigame', 'Skip: unsupported minigame type', minigameType)
        return
    }
    onCompleteRef.current()
  }, [
    uiState?.isGameOver,
    minigameType,
    band,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration
  ])

  // Skip is only offered for the pre-gig setup minigames (not travel).
  const canSkip =
    !uiState?.isGameOver &&
    (minigameType === MINIGAME_TYPES.ROADIE ||
      minigameType === MINIGAME_TYPES.KABELSALAT ||
      minigameType === MINIGAME_TYPES.AMP_CALIBRATION)

  return { continueButtonRef, handleSkip, canSkip }
}
