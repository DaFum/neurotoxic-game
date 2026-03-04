import PropTypes from 'prop-types'
import { SettingsPanel } from '../shared'
import { AudioStatePropType, OnAudioChangePropType } from '../shared/propTypes'

import { useCallback } from 'react'

export const SettingsTab = ({
  settings,
  audioState,
  onAudioChange,
  updateSettings,
  deleteSave
}) => {
  const handleToggleCRT = useCallback(() => {
    updateSettings({ crtEnabled: !settings.crtEnabled })
  }, [updateSettings, settings.crtEnabled])

  const handleLogLevelChange = useCallback((level) => {
    updateSettings({ logLevel: level })
  }, [updateSettings])

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
