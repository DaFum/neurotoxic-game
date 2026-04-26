import PropTypes from 'prop-types'
import { SettingsPanel } from '../shared'
import { AudioStatePropType, OnAudioChangePropType } from '../shared/propTypes'
import { useSettingsActions } from '../../hooks/useSettingsActions'

export const SettingsTab = ({
  settings,
  audioState,
  onAudioChange,
  updateSettings,
  deleteSave
}: Record<string, unknown>) => {
  const { handleToggleCRT, handleLogLevelChange } = useSettingsActions(
    settings,
    updateSettings
  )

  return (
    <div className='max-w-3xl mx-auto'>
      <SettingsPanel
        settings={settings}
        musicVol={(audioState as any).musicVol}
        sfxVol={(audioState as any).sfxVol}
        isMuted={(audioState as any).isMuted}
        onMusicChange={(onAudioChange as any).setMusic}
        onSfxChange={(onAudioChange as any).setSfx}
        onToggleMute={(onAudioChange as any).toggleMute}
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
