import { memo } from 'react'
import { LanguageSettings } from './LanguageSettings'
import { AudioSettings } from './AudioSettings'
import { VisualSettings } from './VisualSettings'
import { LogSettings } from './LogSettings'
import { ControllerSettings } from './ControllerSettings'
import { DEFAULT_GAMEPAD_LANE_BINDINGS } from '../../utils/gamepad/constants'
import { DataManagement } from './DataManagement'
import { LOG_LEVELS } from '../../utils/logger'
import type { GameSettings } from '../../types'

/**
 * Settings, audio state, and callbacks used by the settings control groups.
 */
interface SettingsPanelProps {
  settings?: Pick<
    GameSettings,
    'crtEnabled' | 'logLevel' | 'gamepadLaneBindings'
  >
  musicVol?: number
  sfxVol?: number
  isMuted?: boolean
  onMusicChange?: (value: number) => void
  onSfxChange?: (value: number) => void
  onToggleMute?: () => void
  onToggleCRT?: () => void
  onLogLevelChange?: (level: number) => void
  onGamepadLaneBindingsChange?: (
    bindings: GameSettings['gamepadLaneBindings']
  ) => void
  onResetGamepadLaneBindings?: () => void
  onDeleteSave: () => void
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
  onGamepadLaneBindingsChange = () => {},
  onResetGamepadLaneBindings = () => {}
}: SettingsPanelProps) {
  return (
    <div className='space-y-8'>
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

      <ControllerSettings
        bindings={
          settings?.gamepadLaneBindings ?? DEFAULT_GAMEPAD_LANE_BINDINGS
        }
        onChange={onGamepadLaneBindingsChange}
        onReset={onResetGamepadLaneBindings}
      />

      {/* Data Management */}
      <DataManagement onDeleteSave={onDeleteSave} />
    </div>
  )
})
