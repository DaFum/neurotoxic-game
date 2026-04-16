// @ts-nocheck
import { useTranslation } from 'react-i18next'

export const SettingsTitle = () => {
  const { t } = useTranslation()
  return (
    <h1 className="text-6xl text-toxic-green font-['Metal_Mania'] mb-12">
      {t('ui:settings.systemConfig', { defaultValue: 'SYSTEM CONFIG' })}
    </h1>
  )
}
