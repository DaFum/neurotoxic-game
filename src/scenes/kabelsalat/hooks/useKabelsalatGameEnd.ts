import { useEffect, useCallback, useRef } from 'react'
import { useGameState } from '../../../context/GameState'
import { GAME_PHASES } from '../../../context/gameConstants'
import { logger } from '../../../utils/logger'

export const useKabelsalatGameEnd = (
  isPoweredOn: boolean,
  isGameOver: boolean,
  timeLeft: number
) => {
  const { completeKabelsalatMinigame, changeScene } = useGameState()

  const transitionedRef = useRef(false)
  const timeLeftRef = useRef(timeLeft)

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const handleGameEnd = useCallback(
    (delay: number, isPowered: boolean) => {
      const timer = setTimeout(() => {
        try {
          completeKabelsalatMinigame({
            isPoweredOn: isPowered,
            timeLeft: isPowered ? timeLeftRef.current : 0
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
              const fallback =
                err instanceof Error ? err : new Error(String(err))
              try {
                const fallbackStateError = new Error(
                  'Failed to complete minigame (import error)'
                )
                logger.error('Kabelsalat', fallback, fallbackStateError)
              } catch (_e) {
                // Ignore fallback error
              }
            })
        } finally {
          changeScene(GAME_PHASES.GIG)
        }
      }, delay)
      return timer
    },
    [completeKabelsalatMinigame, changeScene]
  )

  useEffect(() => {
    if (isPoweredOn && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = handleGameEnd(2500, true)
      return () => clearTimeout(timer)
    }
  }, [isPoweredOn, handleGameEnd])

  useEffect(() => {
    if (isGameOver && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = handleGameEnd(3500, false)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, handleGameEnd])
}
