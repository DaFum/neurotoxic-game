import {
  useEffect,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react'
import { SOCKET_DEFS } from '../../../utils/minigames/kabelsalatConstants'
import type { CableId } from '../../../utils/minigames/kabelsalatConstants'
import type { SocketId, KabelsalatPhase } from '../../../types/kabelsalat'

const SOCKET_COUNT = Object.keys(SOCKET_DEFS).length

/**
 * Runs the Kabelsalat countdown and triggers transitions when time expires or wiring completes.
 *
 * @remarks
 * Supports both explicit `KabelsalatPhase` state and legacy boolean flags.
 * Timers only operate when phase is `'playing'`.
 */
export function useKabelsalatTimer(
  connections: Partial<Record<SocketId, CableId>>,
  phase: KabelsalatPhase,
  setTimeLeft: Dispatch<SetStateAction<number>>,
  onTimeout: () => void,
  onWin: () => void
): { finishedRef: MutableRefObject<boolean> }
export function useKabelsalatTimer(
  connections: Partial<Record<SocketId, CableId>>,
  isPoweredOn: boolean,
  isGameOver: boolean,
  isWinningRef: MutableRefObject<boolean>,
  setTimeLeft: Dispatch<SetStateAction<number>>,
  setIsPoweredOn: Dispatch<SetStateAction<boolean>>,
  setIsGameOver: Dispatch<SetStateAction<boolean>>,
  setIsWinning?: Dispatch<SetStateAction<boolean>>
): { finishedRef: MutableRefObject<boolean> }
export function useKabelsalatTimer(
  connections: Partial<Record<SocketId, CableId>>,
  phaseOrIsPoweredOn: KabelsalatPhase | boolean,
  setTimeLeftOrIsGameOver: Dispatch<SetStateAction<number>> | boolean,
  onTimeoutOrWinningRef?: (() => void) | MutableRefObject<boolean>,
  onWinOrSetTimeLeft?: (() => void) | Dispatch<SetStateAction<number>>,
  setIsPoweredOn?: Dispatch<SetStateAction<boolean>>,
  setIsGameOver?: Dispatch<SetStateAction<boolean>>,
  setIsWinning?: Dispatch<SetStateAction<boolean>>
): { finishedRef: MutableRefObject<boolean> } {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishedRef = useRef(false)

  const isPhaseMode = typeof phaseOrIsPoweredOn === 'object'

  // Phase mode implementations
  const phase = isPhaseMode ? phaseOrIsPoweredOn : undefined
  const setTimeLeftPhase = isPhaseMode
    ? (setTimeLeftOrIsGameOver as Dispatch<SetStateAction<number>>)
    : undefined
  const onTimeoutPhase = isPhaseMode
    ? (onTimeoutOrWinningRef as () => void)
    : undefined
  const onWinPhase = isPhaseMode
    ? (onWinOrSetTimeLeft as () => void)
    : undefined

  // Legacy mode implementations
  const isPoweredOnLegacy = !isPhaseMode ? Boolean(phaseOrIsPoweredOn) : false
  const isGameOverLegacy = !isPhaseMode
    ? Boolean(setTimeLeftOrIsGameOver)
    : false
  const isWinningRefLegacy = !isPhaseMode
    ? (onTimeoutOrWinningRef as MutableRefObject<boolean>)
    : undefined
  const setTimeLeftLegacy = !isPhaseMode
    ? (onWinOrSetTimeLeft as Dispatch<SetStateAction<number>>)
    : undefined

  // 1. Countdown timer
  useEffect(() => {
    if (isPhaseMode) {
      if (!phase || phase.name !== 'playing' || finishedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return
      }

      timerRef.current = setInterval(() => {
        if (finishedRef.current) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return
        }

        setTimeLeftPhase?.(prev => {
          const nextTimeLeft = Math.max(0, prev - 1)
          if (nextTimeLeft <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            finishedRef.current = true
            onTimeoutPhase?.()
            return 0
          }
          return nextTimeLeft
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }

    // Legacy logic
    if (
      !isPoweredOnLegacy &&
      !isGameOverLegacy &&
      !isWinningRefLegacy?.current &&
      !finishedRef.current
    ) {
      timerRef.current = setInterval(() => {
        if (finishedRef.current || isWinningRefLegacy?.current) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return
        }

        setTimeLeftLegacy?.(prev => {
          const nextTimeLeft = Math.max(0, prev - 1)
          if (nextTimeLeft <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            finishedRef.current = true
            setIsGameOver?.(true)
            return 0
          }
          return nextTimeLeft
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    isPhaseMode,
    phase,
    onTimeoutPhase,
    setTimeLeftPhase,
    isPoweredOnLegacy,
    isGameOverLegacy,
    isWinningRefLegacy,
    setIsGameOver,
    setTimeLeftLegacy
  ])

  // 2. Win detection (when all sockets wired)
  useEffect(() => {
    if (finishedRef.current) return

    let connectionCount = 0
    for (const key in connections) {
      if (
        Object.hasOwn(connections, key) &&
        connections[key as keyof typeof connections] != null
      ) {
        connectionCount++
      }
    }

    if (connectionCount === SOCKET_COUNT) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (isPhaseMode) {
        if (phase && phase.name === 'playing') {
          onWinPhase?.()
        }
        return
      }

      // Legacy
      if (isWinningRefLegacy) {
        isWinningRefLegacy.current = true
      }
      setIsWinning?.(true)

      const animTimer = setTimeout(() => {
        if (!finishedRef.current) {
          setIsPoweredOn?.(true)
        }
      }, 600)
      return () => clearTimeout(animTimer)
    }
  }, [
    connections,
    isPhaseMode,
    phase,
    onWinPhase,
    isWinningRefLegacy,
    setIsPoweredOn,
    setIsWinning
  ])

  return { finishedRef }
}
