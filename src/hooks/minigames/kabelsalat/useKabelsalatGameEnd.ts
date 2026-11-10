import { useEffect, useCallback, useRef } from 'react'
import { useGameActions } from '../../../context/GameState'
import { GAME_PHASES } from '../../../context/gameConstants'
import { logger } from '../../../utils/logger'
import type { KabelsalatPhase } from '../../../types/kabelsalat'

/**
 * Guards Kabelsalat end-of-game continuation so StrictMode replays do not double-transition.
 * Supports both explicit `KabelsalatPhase` state and legacy boolean flags.
 *
 * @param phaseOrIsPoweredOn - Explicit minigame phase or legacy successful completion flag.
 * @param isGameOverOrTimeLeft - Legacy game over flag or remaining seconds when phase is passed.
 * @param timeLeftOrVoidSurges - Remaining seconds for legacy mode, or void purge count for phase mode.
 * @param voidSurgesPurgedOrOnTransition - Void purge count for legacy mode, or transition callback.
 * @param onTransition - Optional callback invoked when completion transition begins.
 * @returns `forceAdvance` callback used by auto-advance and manual fallback paths.
 */
export function useKabelsalatGameEnd(
  phase: KabelsalatPhase,
  timeLeft: number,
  voidSurgesPurged?: number,
  onTransition?: () => void
): { forceAdvance: (isPowered: boolean) => void }
export function useKabelsalatGameEnd(
  isPoweredOn: boolean,
  isGameOver: boolean,
  timeLeft: number,
  voidSurgesPurged?: number
): { forceAdvance: (isPowered: boolean) => void }
export function useKabelsalatGameEnd(
  phaseOrIsPoweredOn: KabelsalatPhase | boolean,
  isGameOverOrTimeLeft?: boolean | number,
  timeLeftOrVoidSurges?: number,
  voidSurgesPurgedOrOnTransition?: number | (() => void),
  onTransition?: () => void
): { forceAdvance: (isPowered: boolean) => void } {
  const { completeKabelsalatMinigame, changeScene } = useGameActions()

  const transitionedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPhaseMode = typeof phaseOrIsPoweredOn === 'object'

  const isPoweredOn = isPhaseMode
    ? phaseOrIsPoweredOn.name === 'powered'
    : Boolean(phaseOrIsPoweredOn)

  const isGameOver = isPhaseMode
    ? phaseOrIsPoweredOn.name === 'gameover'
    : Boolean(isGameOverOrTimeLeft)

  const timeLeft = isPhaseMode
    ? typeof isGameOverOrTimeLeft === 'number'
      ? isGameOverOrTimeLeft
      : 0
    : typeof timeLeftOrVoidSurges === 'number'
      ? timeLeftOrVoidSurges
      : 0

  const voidSurgesPurged = isPhaseMode
    ? typeof timeLeftOrVoidSurges === 'number'
      ? timeLeftOrVoidSurges
      : 0
    : typeof voidSurgesPurgedOrOnTransition === 'number'
      ? voidSurgesPurgedOrOnTransition
      : 0

  const onTransitionCallback = isPhaseMode
    ? typeof voidSurgesPurgedOrOnTransition === 'function'
      ? voidSurgesPurgedOrOnTransition
      : onTransition
    : onTransition

  const timeLeftRef = useRef(timeLeft)

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

      onTransitionCallback?.()

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
    [
      completeKabelsalatMinigame,
      changeScene,
      voidSurgesPurged,
      onTransitionCallback
    ]
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
