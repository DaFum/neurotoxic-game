import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { VolumeSlider } from '../shared/VolumeSlider'
import { ToggleSwitch } from '../shared/ToggleSwitch'
import type { ChangeEvent } from 'react'

type AudioSettingsProps = {
  musicVol: number
  sfxVol: number
  isMuted: boolean
  onMusicChange: (v: number) => void
  onSfxChange: (v: number) => void
  onToggleMute: () => void
}

export const AudioSettings = memo(function AudioSettings({
  musicVol,
  sfxVol,
  isMuted,
  onMusicChange,
  onSfxChange,
  onToggleMute
}: AudioSettingsProps) {
  const { t } = useTranslation()

  const handleMusicChange = useCallback(
    (e: ChangeEvent<HTMLInputElement> | { target: { value: number } }) => {
      const raw = (e as any).target?.value
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw))
      onMusicChange(num)
    },
    [onMusicChange]
  )

  const handleSfxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement> | { target: { value: number } }) => {
      const raw = (e as any).target?.value
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw))
      onSfxChange(num)
    },
    [onSfxChange]
  )

  return (
    <div>
      <h2 className='font-[Metal_Mania] text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:audio_protocols')}
      </h2>
      <div className='space-y-6'>
        <VolumeSlider
          label={t('ui:music_volume')}
          value={musicVol}
          onChange={handleMusicChange}
        />
        <VolumeSlider
          label={t('ui:sfx_volume')}
          value={sfxVol}
          onChange={handleSfxChange}
        />
        <div className='flex items-center justify-between'>
          <span className='font-[Courier_New] text-sm uppercase tracking-wide text-ash-gray'>
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
  )
})

AudioSettings.propTypes = {
  musicVol: PropTypes.number.isRequired,
  sfxVol: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  onMusicChange: PropTypes.func.isRequired,
  onSfxChange: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired
}
