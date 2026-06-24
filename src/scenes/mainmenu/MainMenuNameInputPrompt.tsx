import { useActionState } from 'react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'
import { GlitchButton } from '../../ui/GlitchButton'

export const MainMenuNameInputPrompt = ({
  playerNameInput,
  setPlayerNameInput,
  handleNameSubmit,
  onClose,
  inputRef
}: {
  playerNameInput: string
  setPlayerNameInput: (value: string) => void
  handleNameSubmit: (name?: string) => void
  onClose: () => void
  inputRef?: RefObject<HTMLInputElement | null>
}) => {
  const { t } = useTranslation()

  // React 19 Action State Paradigm
  const [error, submitAction] = useActionState(
    async (_previousState: string | null, formData: FormData) => {
      const name = String(formData.get('playerName') ?? '').trim()

      if (!name) {
        return t('ui:enter_name_error', { defaultValue: 'Please enter a name' })
      }

      setPlayerNameInput(name)
      handleNameSubmit(name)
      return null
    },
    null
  )

  return (
    <Modal
      isOpen={true}
      title={t('ui:identity_required')}
      onClose={onClose}
      className='max-w-md'
      ariaLabel={t('ui:identity_required')}
    >
      <form action={submitAction} className='flex flex-col gap-4'>
        <label
          htmlFor='playerName'
          className='text-ash-gray font-mono text-sm cursor-pointer'
        >
          {t('ui:enter_alias_desc')}
        </label>
        <input
          id='playerName'
          name='playerName'
          ref={inputRef}
          type='text'
          value={playerNameInput}
          onChange={e => setPlayerNameInput(e.target.value)}
          placeholder={t('ui:enter_name_placeholder')}
          className='bg-void-black border border-toxic-green p-2 text-toxic-green font-mono text-base sm:text-lg focus:outline-none focus:ring-1 focus:ring-toxic-green uppercase min-w-0'
          maxLength={20}
          aria-label={t('ui:enter_alias_desc')}
        />
        {error && (
          <div className='text-blood-red font-mono text-sm' role='alert'>
            {error}
          </div>
        )}
        <GlitchButton type='submit' className='w-full'>
          {t('ui:confirm_identity')}
        </GlitchButton>
      </form>
    </Modal>
  )
}
