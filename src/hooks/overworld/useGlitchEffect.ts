import { useState, useEffect } from 'react'
import { getSafeRandom } from '../../utils/crypto'

/**
 * Produces intermittent CRT glitch class names for the overworld shell.
 *
 * @returns Current glitch class name, or an empty string when idle.
 */
export const useGlitchEffect = () => {
  const [glitch, setGlitch] = useState('')

  useEffect(() => {
    const TYPES = ['glitch-on', 'g-hue', 'g-pixel'] as const
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const id = setInterval(() => {
      if (getSafeRandom() < 0.22) {
        const glitchType = TYPES[Math.floor(getSafeRandom() * TYPES.length)]
        if (!glitchType) {
          return
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        setGlitch(glitchType)
        timeoutId = setTimeout(() => setGlitch(''), 160 + getSafeRandom() * 120)
      }
    }, 4000)

    return () => {
      clearInterval(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return glitch
}
