import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '../shared/ToggleSwitch'

type VisualSettingsProps = {
  crtEnabled: boolean
  onToggleCRT: () => void
}

/**
 * Displays visual effect toggles for the settings panel.
 * @param props - CRT display state and callback for toggling the visual filter.
 */
export const VisualSettings = memo(function VisualSettings({
  crtEnabled,
  onToggleCRT
}: VisualSettingsProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className='font-display text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:visual_interface')}
      </h2>
      <div className='flex items-center justify-between'>
        <ToggleSwitch
          isOn={crtEnabled}
          onToggle={onToggleCRT}
          ariaLabel={t('ui:crt_effect')}
        />
      </div>
    </div>
  )
})
