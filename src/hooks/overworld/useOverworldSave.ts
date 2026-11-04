import { useState, useRef, useEffect, useCallback } from 'react'
import { logger } from '../../utils/logger'

/**
 * Starts manual overworld saves immediately and tracks their pending state.
 *
 * @param saveGame - Save callback supplied by game actions.
 * @returns Saving flag and save trigger.
 */
export const useOverworldSave = (saveGame: () => Promise<void> | void) => {
  const [isSaving, setIsSaving] = useState(false)
  const isMountedRef = useRef(true)
  const savingRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleSaveWithDelay = useCallback(() => {
    if (savingRef.current) return
    savingRef.current = true
    setIsSaving(true)
    void (async () => {
      try {
        await saveGame()
      } catch (err) {
        logger.error('OverworldSave', 'Save failed', err)
      } finally {
        savingRef.current = false
        if (isMountedRef.current) {
          setIsSaving(false)
        }
      }
    })()
  }, [saveGame])

  return { isSaving, handleSaveWithDelay }
}
