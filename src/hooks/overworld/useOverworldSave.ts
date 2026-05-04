import { useState, useRef, useEffect, useCallback } from 'react'

export const useOverworldSave = (saveGame: () => Promise<void>) => {
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
          console.error('Save failed', err)
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
