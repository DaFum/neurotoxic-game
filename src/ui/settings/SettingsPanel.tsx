// @ts-nocheck
import PropTypes from 'prop-types'
import { memo } from 'react'
import { LanguageSettings } from './LanguageSettings'
import { AudioSettings } from './AudioSettings'
import { VisualSettings } from './VisualSettings'
import { LogSettings } from './LogSettings'
import { DataManagement } from './DataManagement'
import { LOG_LEVELS } from '../../utils/logger'

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  musicVol = 0,
  sfxVol = 0,
  isMuted = false,
  onMusicChange = () => {},
  onSfxChange = () => {},
  onToggleMute = () => {},
  onToggleCRT = () => {},
  onLogLevelChange = () => {},
  onDeleteSave,
  className = ''
}) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Language Settings */}
      <LanguageSettings />

      {/* Audio Settings */}
      <AudioSettings
        musicVol={musicVol}
        sfxVol={sfxVol}
        isMuted={isMuted}
        onMusicChange={onMusicChange}
        onSfxChange={onSfxChange}
        onToggleMute={onToggleMute}
      />

      {/* Visual Settings */}
      <VisualSettings
        crtEnabled={settings?.crtEnabled ?? false}
        onToggleCRT={onToggleCRT}
      />

      {/* Log Settings */}
      {import.meta.env.DEV && (
        <LogSettings
          logLevel={settings?.logLevel ?? LOG_LEVELS.DEBUG}
          onLogLevelChange={onLogLevelChange}
        />
      )}

      {/* Data Management */}
      <DataManagement onDeleteSave={onDeleteSave} />
    </div>
  )
})

SettingsPanel.propTypes = {
  settings: PropTypes.shape({
    crtEnabled: PropTypes.bool,
    logLevel: PropTypes.number
  }),
  musicVol: PropTypes.number,
  sfxVol: PropTypes.number,
  isMuted: PropTypes.bool,
  onMusicChange: PropTypes.func,
  onSfxChange: PropTypes.func,
  onToggleMute: PropTypes.func,
  onToggleCRT: PropTypes.func,
  onLogLevelChange: PropTypes.func,
  onDeleteSave: PropTypes.func.isRequired,
  className: PropTypes.string
}
