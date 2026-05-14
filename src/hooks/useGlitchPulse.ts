import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Triggers a brief glitch flag on demand. The flag stays true for `durationMs`
 * after each `trigger()` call, then resets. Used by interactive controls (e.g.
 * toggles, sliders) to flash the brutalist offset effect on press.
 */
export const useGlitchPulse = (
  durationMs = 150
): { isGlitching: boolean; trigger: () => void } => {
  const [isGlitching, setIsGlitching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    setIsGlitching(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsGlitching(false), durationMs)
  }, [durationMs])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { isGlitching, trigger }
}
