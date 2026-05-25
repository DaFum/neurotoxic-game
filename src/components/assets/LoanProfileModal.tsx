import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getLoanProfileImagePrompt } from '../../utils/imageGen'
import { LOAN_PROFILES, type LoanProfileId } from '../../utils/loanProfiles'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (profile: LoanProfileId) => void
}

/**
 * Standalone profile picker. The acquisition modal embeds its own profile
 * select inline; this modal stays available as a reusable surface (e.g., for
 * a future refinance flow) without duplicating the embedded UI.
 */
export const LoanProfileModal = ({ isOpen, onClose, onSelect }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:mode.loan')}
      className='max-w-2xl'
    >
      <div className='grid grid-cols-1 gap-3 p-4 font-mono text-sm sm:grid-cols-2'>
        {Object.values(LOAN_PROFILES).map(profile => (
          <button
            key={profile.id}
            type='button'
            onClick={() => {
              onSelect(profile.id)
              onClose()
            }}
            className='flex gap-2 border-2 p-2 text-left'
            style={{
              borderColor: 'var(--section-accent, var(--color-toxic-green))'
            }}
          >
            <div className='w-16 shrink-0'>
              <GeneratedImagePanel
                prompt={getLoanProfileImagePrompt(profile.id)}
                alt={t(profile.labelKey)}
                aspectRatio='1:1'
                sizeHint={{ width: 96, height: 96 }}
              />
            </div>
            <div className='flex flex-col'>
              <strong>{t(profile.labelKey)}</strong>
              <span className='text-xs opacity-60'>
                {profile.termDays}d · {(profile.interestRate * 100).toFixed(1)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
