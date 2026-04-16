// @ts-nocheck
import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '../shared/ToggleSwitch'

export const VisualSettings = memo(function VisualSettings({
  crtEnabled,
  onToggleCRT
}) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className='font-[Metal_Mania] text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:visual_interface')}
      </h2>
      <div className='flex items-center justify-between'>
        <span className='font-[Courier_New] text-sm uppercase tracking-wide text-ash-gray'>
          {t('ui:crt_effect')}
        </span>
        <ToggleSwitch
          isOn={crtEnabled}
          onToggle={onToggleCRT}
          ariaLabel={
            crtEnabled
              ? t('ui:settings.crt_disable')
              : t('ui:settings.crt_enable')
          }
        />
      </div>
    </div>
  )
})

VisualSettings.propTypes = {
  crtEnabled: PropTypes.bool.isRequired,
  onToggleCRT: PropTypes.func.isRequired
}
