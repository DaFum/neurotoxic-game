import { useState, useEffect, useCallback, useRef } from 'react'
import type { TFunction } from 'i18next'

/**
 * Tracks Kabelsalat void surge buildup and purge state for the board.
 * @param isPoweredOn - Suspends surge timers after successful wiring.
 * @param isGameOver - Suspends surge timers after terminal overlay state.
 * @param isShocked - Suspends surge timers during shock recovery.
 * @param triggerShock - Callback that activates the Kabelsalat shock state.
 * @param t - Translation callback used for localized labels and messages.
 * @returns Current surge meter, purge count, and purge command.
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
