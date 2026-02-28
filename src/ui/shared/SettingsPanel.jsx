import { useState } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { VolumeSlider } from './VolumeSlider'
import { ActionButton } from './ActionButton'
import { Modal } from './Modal'
import { ToggleSwitch } from './ToggleSwitch'
import { LOG_LEVELS } from '../../utils/logger.js'
import { DeadmanButton } from './BrutalistUI'

export const SettingsPanel = ({
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
}) => {
  const { t, i18n } = useTranslation()

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Language Settings */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
          {t('ui:language')}
        </h2>
        <div className='flex gap-4'>
          <ActionButton
            onClick={() => i18n.changeLanguage('en')}
            className={`flex-1 ${i18n.language.startsWith('en') ? 'bg-(--toxic-green) text-(--void-black)' : 'bg-(--void-black) text-(--ash-gray)'}`}
          >
            {t('ui:language_option_en')}
          </ActionButton>
          <ActionButton
            onClick={() => i18n.changeLanguage('de')}
            className={`flex-1 ${i18n.language.startsWith('de') ? 'bg-(--toxic-green) text-(--void-black)' : 'bg-(--void-black) text-(--ash-gray)'}`}
          >
            {t('ui:language_option_de')}
          </ActionButton>
        </div>
      </div>

      {/* Audio Settings */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
          {t('ui:audio_protocols')}
        </h2>
        <div className='space-y-6'>
          <VolumeSlider
            label={t('ui:music_volume')}
            value={musicVol}
            onChange={e => onMusicChange(parseFloat(e.target.value))}
          />
          <VolumeSlider
            label={t('ui:sfx_volume')}
            value={sfxVol}
            onChange={e => onSfxChange(parseFloat(e.target.value))}
          />
          <div className='flex items-center justify-between'>
            <span className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'>
              {t('ui:mute_all')}
            </span>
            <ToggleSwitch
              isOn={isMuted}
              onToggle={onToggleMute}
              ariaLabel={
                isMuted
                  ? t('ui:settings.audio_unmute')
                  : t('ui:settings.audio_mute')
              }
            />
          </div>
        </div>
      </div>

      {/* Visual Settings */}
      <div>
        <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
          {t('ui:visual_interface')}
        </h2>
        <div className='flex items-center justify-between'>
          <span className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'>
            {t('ui:crt_effect')}
          </span>
          <ToggleSwitch
            isOn={settings?.crtEnabled ?? false}
            onToggle={onToggleCRT}
            ariaLabel={
              settings?.crtEnabled
                ? t('ui:settings.crt_disable')
                : t('ui:settings.crt_enable')
            }
          />
        </div>
      </div>

      {/* Log Settings */}
      {import.meta.env.DEV && (
        <div>
          <h2 className='font-[Metal_Mania] text-4xl uppercase text-(--toxic-green) mb-6 border-b border-(--ash-gray) pb-2'>
            {t('ui:log_protocols')}
          </h2>
          <div className='flex items-center justify-between'>
            <label
              htmlFor='logLevelSelect'
              className='font-[Courier_New] text-sm uppercase tracking-wide text-(--ash-gray)'
            >
              {t('ui:min_log_level')}
            </label>
            <select
              id='logLevelSelect'
              value={settings?.logLevel ?? LOG_LEVELS.DEBUG}
              onChange={e => onLogLevelChange(parseInt(e.target.value, 10))}
              className='bg-(--void-black) text-(--toxic-green) border-2 border-(--toxic-green) p-1 font-mono focus:outline-none'
            >
              {Object.entries(LOG_LEVELS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Data Management */}
      <DataManagement onDeleteSave={onDeleteSave} />
    </div>
  )
}

const DataManagement = ({ onDeleteSave }) => {
  const { t } = useTranslation()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleOpenConfirm = () => setIsConfirmOpen(true)
  const handleCloseConfirm = () => setIsConfirmOpen(false)
  const handleDeleteSave = () => {
    onDeleteSave()
    setIsConfirmOpen(false)
  }

  return (
    <div>
      <h2 className='font-(--font-display) text-4xl uppercase text-(--blood-red) mb-6 border-b border-(--ash-gray) pb-2'>
        {t('ui:data_purge')}
      </h2>
      <div className='flex justify-between items-center gap-8'>
        <p className='font-(--font-ui) text-sm text-(--ash-gray) max-w-xs'>
          {t('ui:delete_warning')}
        </p>
        <div className="flex-1 max-w-sm">
          <DeadmanButton
            label={t('ui:delete_save')}
            onConfirm={onDeleteSave}
          />
        </div>
      </div>
    </div>
  )
}

DataManagement.propTypes = {
  onDeleteSave: PropTypes.func.isRequired
}

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
