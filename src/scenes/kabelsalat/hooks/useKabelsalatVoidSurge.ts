import { useState, useEffect, useCallback, useRef } from 'react'
import type { TFunction } from 'i18next'

/**
 * Coordinates kabelsalat Void Surge behavior.
 * @param isPoweredOn - Whether powered on is active.
 * @param isGameOver - Whether game over is active.
 * @param isShocked - Whether shocked is active.
 * @param triggerShock - Callback that activates the Kabelsalat shock state.
 * @param t - Translation callback used for localized labels and messages.
 * @returns State, derived values, and callbacks for kabelsalat Void Surge.
 */
export const useKabelsalatVoidSurge = (
  isPoweredOn: boolean,
  isGameOver: boolean,
  isShocked: boolean,
  triggerShock: (reason: string) => void,
  t: TFunction<['ui'], undefined>
) => {
  const [voidSurge, setVoidSurge] = useState(0)
  const [voidSurgesPurged, setVoidSurgesPurged] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const triggeredRef = useRef(false)
  const isActive = !isPoweredOn && !isGameOver && !isShocked

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setVoidSurge(prev => Math.min(100, prev + 5))
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
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
