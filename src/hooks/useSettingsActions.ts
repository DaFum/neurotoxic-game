import { useCallback, useRef, useLayoutEffect } from 'react'
import type { GameSettings } from '../types'
import type { useGameActions } from '../context/GameState'

type UpdateSettings = ReturnType<typeof useGameActions>['updateSettings']

/**
 * Handlers used by settings UI controls.
 */
export type UseSettingsActionsReturn = {
  handleToggleCRT: () => void
  handleLogLevelChange: (level: GameSettings['logLevel']) => void
}

/**
 * Hook that provides shared settings action handlers.
 * @param settings - The current game settings.
 * @param updateSettings - The function to update the settings.
 * @returns Object containing the handlers `handleToggleCRT` and `handleLogLevelChange`.
 */
export const useSettingsActions = (
  settings: GameSettings,
  updateSettings: UpdateSettings
): UseSettingsActionsReturn => {
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
    (level: GameSettings['logLevel']) => {
      updateSettings({ logLevel: level })
    },
    [updateSettings]
  )

  return {
    handleToggleCRT,
    handleLogLevelChange
  }
}
