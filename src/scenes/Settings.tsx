import { useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
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
  const settings = useGameSelector(state => state.settings)
  const { changeScene, updateSettings, deleteSave } = useGameActions()
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
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-(--z-overlay) p-8 relative overflow-hidden'>
      {/* Atmosphere: descending green scan bar */}
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-0 h-28 pointer-events-none animate-scan-bar z-(--z-base)'
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--color-toxic-green-10) 50%, transparent)'
        }}
      />

      <SettingsTitle />

      <div className='corner-frame w-full max-w-2xl border-2 border-toxic-green p-8 bg-void-black/80 relative z-(--z-crt) shadow-[6px_6px_0_var(--color-toxic-green-20)]'>
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
