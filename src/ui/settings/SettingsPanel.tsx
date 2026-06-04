import { memo } from 'react'
import { LanguageSettings } from './LanguageSettings'
import { AudioSettings } from './AudioSettings'
import { VisualSettings } from './VisualSettings'
import { LogSettings } from './LogSettings'
import { DataManagement } from './DataManagement'
import { LOG_LEVELS } from '../../utils/logger'
import type { GameSettings } from '../../types'

/**
 * Props for the Settings Panel component.
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
 * Renders the Settings Panel view from settings, musicVol, sfxVol, isMuted, onMusicChange, onSfxChange, onToggleMute, onToggleCRT, onLogLevelChange, onDeleteSave, and className.
 * @param props - Settings, audio state, and callbacks for updating audio, visual, log, language, and save-data controls.
 * @returns The rendered Settings Panel UI.
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
