import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'
import { GlitchButton } from '../../ui/GlitchButton'

export const MainMenuNameInputPrompt = ({
  playerNameInput,
  setPlayerNameInput,
  handleNameSubmit,
  onClose,
  inputRef
}) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={true}
      title={t('ui:identity_required')}
      onClose={onClose}
      className='max-w-md'
      aria-label={t('ui:identity_required')}
    >
      <div className='flex flex-col gap-4'>
        <label
          htmlFor='playerName'
          className='text-ash-gray font-mono text-sm cursor-pointer'
        >
          {t('ui:enter_alias_desc')}
        </label>
        <input
          id='playerName'
          ref={inputRef}
          type='text'
          value={playerNameInput}
          onChange={e => setPlayerNameInput(e.target.value)}
          placeholder={t('ui:enter_name_placeholder')}
          className='bg-void-black border border-toxic-green p-2 text-toxic-green font-mono text-lg focus:outline-none focus:ring-1 focus:ring-toxic-green uppercase'
          maxLength={20}
          onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
          aria-label={t('ui:enter_alias_desc')}
        />
        <GlitchButton onClick={handleNameSubmit}>
          {t('ui:confirm_identity')}
        </GlitchButton>
      </div>
    </Modal>
  )
}

MainMenuNameInputPrompt.propTypes = {
  playerNameInput: PropTypes.string.isRequired,
  setPlayerNameInput: PropTypes.func.isRequired,
  handleNameSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.object })
  ])
}
