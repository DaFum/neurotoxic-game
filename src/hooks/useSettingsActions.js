/**
 * REVIEW
 * #1 Actual updates
 * Extracted duplicate `handleToggleCRT` and `handleLogLevelChange` logic from `src/scenes/Settings.jsx` and `src/ui/bandhq/SettingsTab.jsx` into this reusable hook.
 *
 * #2 Next steps and ideas to develop further
 * Expand this hook if more general settings actions are needed across different components.
 *
 * #3 Found errors + solutions
 * No errors found. The settings actions are purely state update functions interacting with `useGameState` context values.
 */

import { useCallback, useRef, useEffect } from 'react'

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
  useEffect(() => {
    crtRef.current = settings.crtEnabled
  }, [settings.crtEnabled])

  const handleToggleCRT = useCallback(() => {
    updateSettings({ crtEnabled: !crtRef.current })
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
