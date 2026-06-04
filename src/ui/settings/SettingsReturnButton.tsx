import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../GlitchButton'
import type { MouseEvent } from 'react'

type SettingsReturnButtonProps = {
  onReturn: (e?: MouseEvent) => void
}

/**
 * Displays the settings return-to-menu action.
 * @param props - Return callback for leaving the settings screen.
 */
export const SettingsReturnButton = ({
  onReturn
}: SettingsReturnButtonProps) => {
  const { t } = useTranslation()
  return (
    <div className='mt-8'>
      <GlitchButton onClick={onReturn}>
        {t('ui:settings.return', { defaultValue: 'RETURN' })}
      </GlitchButton>
    </div>
  )
}
