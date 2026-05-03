import { useState, useEffect } from 'react'

export const useGlitchEffect = () => {
  const [glitch, setGlitch] = useState('')

  useEffect(() => {
    const TYPES = ['glitch-on', 'g-hue', 'g-pixel'] as const
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const id = setInterval(() => {
      if (Math.random() < 0.22) {
        const glitchType = TYPES[Math.floor(Math.random() * TYPES.length)]
        if (!glitchType) {
          return
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        setGlitch(glitchType)
        timeoutId = setTimeout(() => setGlitch(''), 160 + Math.random() * 120)
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
