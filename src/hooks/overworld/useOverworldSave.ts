import { useState, useRef, useEffect, useCallback } from 'react'
import { logger } from '../../utils/logger'

export const useOverworldSave = (saveGame: () => Promise<void> | void) => {
  const [isSaving, setIsSaving] = useState(false)
  const isMountedRef = useRef(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleSaveWithDelay = useCallback(() => {
    if (isSaving) return
    setIsSaving(true)
    saveTimeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          await saveGame()
        } catch (err) {
          logger.error('OverworldSave', 'Save failed', err)
        } finally {
          if (isMountedRef.current) {
            setIsSaving(false)
          }
        }
      })()
    }, 500)
  }, [isSaving, saveGame])

  return { isSaving, handleSaveWithDelay }
}
