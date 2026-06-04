import { useEffect } from 'react'
import { audioService } from '../../utils/audio/audioEngine'

/**
 * Attempts to resume ambient overworld music once on mount, with one delayed retry.
 */
export const useAmbientResume = () => {
  useEffect(() => {
    let cancelled = false
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

    const attemptResume = async (attempt = 0) => {
      const started = await audioService.resumeMusic().catch(() => false)
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
