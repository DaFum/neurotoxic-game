import { useState, useRef, useEffect, useCallback } from 'react'
import { logger } from '../../utils/logger'

/**
 * Wraps manual overworld saves with a short delay and visible saving state.
 *
 * @param saveGame - Save callback supplied by game actions.
 * @returns Saving flag and delayed save trigger.
 */
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
