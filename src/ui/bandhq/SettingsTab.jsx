import PropTypes from 'prop-types'
import { SettingsPanel } from '../shared'

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
  audioState: PropTypes.shape({
    musicVol: PropTypes.number,
    sfxVol: PropTypes.number,
    isMuted: PropTypes.bool
  }).isRequired,
  onAudioChange: PropTypes.shape({
    setMusic: PropTypes.func,
    setSfx: PropTypes.func,
    toggleMute: PropTypes.func
  }).isRequired,
  updateSettings: PropTypes.func.isRequired,
  deleteSave: PropTypes.func.isRequired
}
