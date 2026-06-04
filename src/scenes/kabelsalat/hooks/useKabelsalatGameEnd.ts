import { useEffect, useCallback, useRef } from 'react'
import { useGameActions } from '../../../context/GameState'
import { GAME_PHASES } from '../../../context/gameConstants'
import { logger } from '../../../utils/logger'

/**
 * Guards Kabelsalat end-of-game continuation so StrictMode replays do not double-transition.
 * @param isPoweredOn - Whether powered on is active.
 * @param isGameOver - Whether game over is active.
 * @param timeLeft - Time left.
 * @param voidSurgesPurged - Void surges purged.
 * @returns State, derived values, and callbacks for kabelsalat Game End.
 */
export const useKabelsalatGameEnd = (
  isPoweredOn: boolean,
  isGameOver: boolean,
  timeLeft: number,
  voidSurgesPurged: number = 0
) => {
  const { completeKabelsalatMinigame, changeScene } = useGameActions()

  const transitionedRef = useRef(false)
  const timeLeftRef = useRef(timeLeft)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const finalizeGameEnd = useCallback(
    (isPowered: boolean) => {
      if (transitionedRef.current) return
      transitionedRef.current = true

      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      try {
        completeKabelsalatMinigame({
          isPoweredOn: isPowered,
          timeLeft: isPowered ? timeLeftRef.current : 0,
          voidSurgesPurged
        })
      } catch (error) {
        import('../../../utils/errorHandler')
          .then(({ handleError, StateError }) => {
            const wrappedError =
              error instanceof Error ? error : new Error(String(error))
            handleError(
              new StateError('Failed to complete minigame', {
                originalError: wrappedError
              })
            )
          })
          .catch(err => {
            const fallback = err instanceof Error ? err : new Error(String(err))
            logger.error(
              'Kabelsalat',
              'Failed to complete minigame (import error)',
              fallback
            )
          })
      } finally {
        changeScene(GAME_PHASES.GIG)
      }
    },
    [completeKabelsalatMinigame, changeScene, voidSurgesPurged]
  )

  const scheduleGameEnd = useCallback(
    (delay: number, isPowered: boolean) => {
      if (transitionedRef.current || timerRef.current) return
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        finalizeGameEnd(isPowered)
      }, delay)
    },
    [finalizeGameEnd]
  )

  useEffect(() => {
    if (isPoweredOn) {
      scheduleGameEnd(2500, true)
    }
  }, [isPoweredOn, scheduleGameEnd])

  useEffect(() => {
    if (isGameOver) {
      scheduleGameEnd(3500, false)
    }
  }, [isGameOver, scheduleGameEnd])

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    []
  )

  return {
    forceAdvance: finalizeGameEnd
  }
}
