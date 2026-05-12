import { useState, useEffect, useCallback, useRef } from 'react'

export const useKabelsalatVoidSurge = (
  isPoweredOn: boolean,
  isGameOver: boolean,
  isShocked: boolean,
  triggerShock: (reason: string) => void,
  t: (key: string) => string
) => {
  const [voidSurge, setVoidSurge] = useState(0)
  const [voidSurgesPurged, setVoidSurgesPurged] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isActive = !isPoweredOn && !isGameOver && !isShocked

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setVoidSurge(prev => {
          const next = prev + 5 // Increase by 5% every tick
          if (next >= 100) {
            triggerShock(t('ui:minigames.amp.hud.anomaly')) // Reuse anomaly string or add a new one later
            return 0
          }
          return next
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, triggerShock, t])

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
