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

import { useCallback } from 'react'

/**
 * Hook that provides shared settings action handlers.
 * @param {object} settings - The current game settings.
 * @param {function} updateSettings - The function to update the settings.
 * @returns {object} Object containing the handlers `handleToggleCRT` and `handleLogLevelChange`.
 */
export const useSettingsActions = (settings, updateSettings) => {
  const handleToggleCRT = useCallback(() => {
    updateSettings({ crtEnabled: !settings.crtEnabled })
  }, [updateSettings, settings.crtEnabled])

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
