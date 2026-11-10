import { useState, useEffect, useCallback, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { TFunction } from 'i18next'
import type { KabelsalatPhase } from '../../../types/kabelsalat'

/**
 * Tracks Kabelsalat void surge buildup and purge state for the board.
 * Supports both explicit `KabelsalatPhase` state and legacy boolean flags.
 *
 * @param phaseOrIsPoweredOn - Explicit minigame phase or legacy powered on flag.
 * @param isGameOverOrTriggerShock - Legacy game over flag or triggerShock callback.
 * @param isShockedOrT - Legacy isShocked flag or translation callback.
 * @param isWinningRef - Legacy win ref guard.
 * @param triggerShockArg - Shock trigger callback for legacy mode.
 * @param tArg - Translation callback for legacy mode.
 * @returns Current surge meter, purge count, and purge command.
 */
export function useKabelsalatVoidSurge(
  phase: KabelsalatPhase,
  triggerShock: (reason: string) => void,
  t: TFunction<['ui'], undefined>
): {
  voidSurge: number
  voidSurgesPurged: number
  purgeVoidSurge: () => void
}
export function useKabelsalatVoidSurge(
  isPoweredOn: boolean,
  isGameOver: boolean,
  isShocked: boolean,
  isWinningRef: MutableRefObject<boolean>,
  triggerShock: (reason: string) => void,
  t: TFunction<['ui'], undefined>
): {
  voidSurge: number
  voidSurgesPurged: number
  purgeVoidSurge: () => void
}
export function useKabelsalatVoidSurge(
  phaseOrIsPoweredOn: KabelsalatPhase | boolean,
  isGameOverOrTriggerShock: boolean | ((reason: string) => void),
  isShockedOrT?: boolean | TFunction<['ui'], undefined>,
  isWinningRef?: MutableRefObject<boolean>,
  triggerShockArg?: (reason: string) => void,
  tArg?: TFunction<['ui'], undefined>
): {
  voidSurge: number
  voidSurgesPurged: number
  purgeVoidSurge: () => void
} {
  const [voidSurge, setVoidSurge] = useState(0)
  const [voidSurgesPurged, setVoidSurgesPurged] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const triggeredRef = useRef(false)

  const isPhaseObject = typeof phaseOrIsPoweredOn === 'object'
  const isPlaying = isPhaseObject
    ? phaseOrIsPoweredOn.name === 'playing'
    : !phaseOrIsPoweredOn &&
      !isGameOverOrTriggerShock &&
      !isShockedOrT &&
      !isWinningRef?.current

  const triggerShock = (
    isPhaseObject && typeof isGameOverOrTriggerShock === 'function'
      ? isGameOverOrTriggerShock
      : triggerShockArg!
  ) as (reason: string) => void

  const t = (
    isPhaseObject && typeof isShockedOrT === 'function' ? isShockedOrT : tArg!
  ) as TFunction<['ui'], undefined>

  const isActive = isPlaying

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setVoidSurge(prev => Math.min(100, prev + 5))
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive])

  useEffect(() => {
    if (voidSurge >= 100 && !triggeredRef.current && isActive) {
      triggeredRef.current = true
      triggerShock(t('ui:minigames.kabelsalat.systemShock'))
      setVoidSurge(0)
    } else if (voidSurge === 0) {
      triggeredRef.current = false
    }
  }, [voidSurge, triggerShock, t, isActive])

  const purgeVoidSurge = useCallback(() => {
    if (isActive && voidSurge > 0) {
      setVoidSurge(0)
      setVoidSurgesPurged(prev => prev + 1)
    }
  }, [isActive, voidSurge])

  return {
    voidSurge,
    voidSurgesPurged,
    purgeVoidSurge
  }
}
