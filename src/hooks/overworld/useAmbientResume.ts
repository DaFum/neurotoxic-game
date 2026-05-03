import { useEffect } from 'react'
import { audioManager } from '../../utils/audio/AudioManager'

export const useAmbientResume = () => {
  useEffect(() => {
    let cancelled = false
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

    const attemptResume = async (attempt = 0) => {
      const started = await audioManager.resumeMusic().catch(() => false)
      if (!started && !cancelled && attempt < 1) {
        retryTimeoutId = setTimeout(() => {
          void attemptResume(attempt + 1)
        }, 1200)
      }
    }

    void attemptResume()

    return () => {
      cancelled = true
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
      }
    }
  }, [])
}
