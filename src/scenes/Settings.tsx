import { useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useAudioControl } from '../hooks/useAudioControl'
import { useSettingsActions } from '../hooks/useSettingsActions'
import { SettingsPanel } from '../ui/shared'
import { SettingsTitle } from '../ui/settings/SettingsTitle'
import { SettingsReturnButton } from '../ui/settings/SettingsReturnButton'

/**
 * Settings scene for configuring audio, visuals, and data management.
 */
export const Settings = () => {
  const { changeScene, settings, updateSettings, deleteSave } = useGameState()
  const { audioState, handleAudioChange } = useAudioControl()
  const { handleToggleCRT, handleLogLevelChange } = useSettingsActions(
    settings,
    updateSettings
  )

  const handleReturn = useCallback(
    () => changeScene(GAME_PHASES.MENU),
    [changeScene]
  )

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-50 p-8'>
      <SettingsTitle />

      <div className='w-full max-w-2xl border-2 border-toxic-green p-8 bg-void-black/80'>
        <SettingsPanel
          settings={settings}
          musicVol={audioState.musicVol}
          sfxVol={audioState.sfxVol}
          isMuted={audioState.isMuted}
          onMusicChange={handleAudioChange.setMusic}
          onSfxChange={handleAudioChange.setSfx}
          onToggleMute={handleAudioChange.toggleMute}
          onToggleCRT={handleToggleCRT}
          onLogLevelChange={handleLogLevelChange}
          onDeleteSave={deleteSave}
        />
      </div>

      <SettingsReturnButton onReturn={handleReturn} />
    </div>
  )
}

export default Settings
