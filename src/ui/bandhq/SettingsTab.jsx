import PropTypes from 'prop-types'
import { SettingsPanel } from '../shared'
import { AudioStatePropType, OnAudioChangePropType } from '../shared/propTypes'

export const SettingsTab = ({
  settings,
  audioState,
  onAudioChange,
  updateSettings,
  deleteSave
}) => {
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
        onToggleCRT={() => updateSettings({ crtEnabled: !settings.crtEnabled })}
        onLogLevelChange={level => updateSettings({ logLevel: level })}
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
