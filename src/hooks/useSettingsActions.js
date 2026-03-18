import { useCallback, useRef, useLayoutEffect } from 'react'

/**
 * Hook that provides shared settings action handlers.
 * @param {object} settings - The current game settings.
 * @param {function} updateSettings - The function to update the settings.
 * @returns {object} Object containing the handlers `handleToggleCRT` and `handleLogLevelChange`.
 */
export const useSettingsActions = (settings, updateSettings) => {
  // We use settings.crtEnabled in the closure but don't add it to the dependency array.
  // We store the latest value in a ref so the callback identity remains stable.
  const crtRef = useRef(settings.crtEnabled)
  useLayoutEffect(() => {
    crtRef.current = settings.crtEnabled
  }, [settings.crtEnabled])

  const handleToggleCRT = useCallback(() => {
    const newValue = !crtRef.current
    crtRef.current = newValue
    updateSettings({ crtEnabled: newValue })
  }, [updateSettings])

  const handleLogLevelChange = useCallback(
    level => {
      updateSettings({ logLevel: level })
    },
    [updateSettings]
  )

  return {
    handleToggleCRT,
    handleLogLevelChange
  }
}
