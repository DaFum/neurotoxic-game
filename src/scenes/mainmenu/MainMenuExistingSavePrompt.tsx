import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'
import { GlitchButton } from '../../ui/GlitchButton'

export const MainMenuExistingSavePrompt = ({
  onLoad,
  onStartNew,
  onClose
}: {
  onLoad: () => void
  onStartNew: () => void
  onClose: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={true}
      title={t('ui:mainMenu.existingSave.title')}
      onClose={onClose}
    >
      <div className='flex flex-col gap-4'>
        <p className='text-ash-gray font-mono text-sm'>
          {t('ui:mainMenu.existingSave.desc')}
        </p>
        <div className='flex gap-2 justify-end'>
          <GlitchButton
            onClick={onLoad}
            className='border-toxic-green text-toxic-green'
          >
            {t('ui:mainMenu.existingSave.load')}
          </GlitchButton>
          <GlitchButton
            onClick={onStartNew}
            className='border-blood-red text-blood-red'
          >
            {t('ui:mainMenu.existingSave.startNew')}
          </GlitchButton>
        </div>
      </div>
    </Modal>
  )
}

MainMenuExistingSavePrompt.propTypes = {
  onLoad: PropTypes.func.isRequired,
  onStartNew: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}
