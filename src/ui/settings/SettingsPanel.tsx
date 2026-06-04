import { memo } from 'react'
import { LanguageSettings } from './LanguageSettings'
import { AudioSettings } from './AudioSettings'
import { VisualSettings } from './VisualSettings'
import { LogSettings } from './LogSettings'
import { DataManagement } from './DataManagement'
import { LOG_LEVELS } from '../../utils/logger'
import type { GameSettings } from '../../types'

/**
 * Settings, audio state, and callbacks used by the settings control groups.
 */
export interface SettingsPanelProps {
  settings?: Pick<GameSettings, 'crtEnabled' | 'logLevel'>
  musicVol?: number
  sfxVol?: number
  isMuted?: boolean
  onMusicChange?: (value: number) => void
  onSfxChange?: (value: number) => void
  onToggleMute?: () => void
  onToggleCRT?: () => void
  onLogLevelChange?: (level: number) => void
  onDeleteSave: () => void
  className?: string
}

/**
 * Groups language, audio, visual, log, and save-data settings controls.
 * @param props - Settings, audio state, and callbacks for updating audio, visual, log, language, and save-data controls.
 */
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
}: SettingsPanelProps) {
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
