// @ts-nocheck
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../GlitchButton'

export const SettingsReturnButton = ({ onReturn }) => {
  const { t } = useTranslation()
  return (
    <div className='mt-8'>
      <GlitchButton onClick={onReturn}>
        {t('ui:settings.return', { defaultValue: 'RETURN' })}
      </GlitchButton>
    </div>
  )
}

SettingsReturnButton.propTypes = {
  onReturn: PropTypes.func.isRequired
}
