import PropTypes from 'prop-types'
import type { GameSettings } from '../../types/game'
import type { GameStateWithActions } from '../../context/GameState'
import { SettingsPanel } from '../shared'
import { AudioStatePropType, OnAudioChangePropType } from '../shared/propTypes'
import { useSettingsActions } from '../../hooks/useSettingsActions'

type SettingsTabProps = {
  settings: GameSettings
  audioState: { musicVol: number; sfxVol: number; isMuted: boolean }
  onAudioChange: {
    setMusic: (value: number) => void
    setSfx: (value: number) => void
    toggleMute: () => void
  }
  updateSettings: GameStateWithActions['updateSettings']
  deleteSave: () => void
}

export const SettingsTab = ({
  settings,
  audioState,
  onAudioChange,
  updateSettings,
  deleteSave
}: SettingsTabProps) => {
  const { handleToggleCRT, handleLogLevelChange } = useSettingsActions(
    settings,
    updateSettings
  )

  return (
    <div className='max-w-3xl mx-auto'>
      <SettingsPanel
        settings={settings}
        musicVol={audioState.musicVol}
        sfxVol={audioState.sfxVol}
        isMuted={audioState.isMuted}
        onMusicChange={onAudioChange.setMusic}
        onSfxChange={onAudioChange.setSfx}
        onToggleMute={onAudioChange.toggleMute}
        onToggleCRT={handleToggleCRT}
        onLogLevelChange={handleLogLevelChange}
        onDeleteSave={deleteSave}
      />
    </div>
  )
}

SettingsTab.propTypes = {
  settings: PropTypes.object.isRequired,
  audioState: AudioStatePropType.isRequired,
  onAudioChange: OnAudioChangePropType.isRequired,
  updateSettings: PropTypes.func.isRequired,
  deleteSave: PropTypes.func.isRequired
}
