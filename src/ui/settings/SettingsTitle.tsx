import { useTranslation } from 'react-i18next'

/**
 * Renders the settings screen heading.
 */
export const SettingsTitle = () => {
  const { t } = useTranslation()
  return (
    <h1 className='text-6xl text-toxic-green font-display mb-12'>
      {t('ui:settings.systemConfig', { defaultValue: 'SYSTEM CONFIG' })}
    </h1>
  )
}
