import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getLoanProfileImagePrompt } from '../../utils/imageGen'
import { LOAN_PROFILES, type LoanProfileId } from '../../utils/loanProfiles'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (profile: LoanProfileId) => void
  title?: string
}

interface LoanProfileChoiceGridProps {
  value?: LoanProfileId
  onSelect: (profile: LoanProfileId) => void
}

export const LoanProfileChoiceGrid = ({
  value,
  onSelect
}: LoanProfileChoiceGridProps) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='grid grid-cols-1 gap-3 font-mono text-sm sm:grid-cols-2'>
      {Object.values(LOAN_PROFILES).map(profile => {
        const isActive = value === profile.id
        return (
          <button
            key={profile.id}
            type='button'
            onClick={() => onSelect(profile.id)}
            className='flex gap-2 border-2 p-2 text-left'
            style={{
              background: isActive
                ? 'var(--section-accent, var(--color-toxic-green))'
                : 'transparent',
              borderColor: 'var(--section-accent, var(--color-toxic-green))',
              color: isActive ? 'var(--color-void-black)' : 'inherit'
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
                {t('assets:loan.profileMeta', {
                  days: profile.termDays,
                  rate: (profile.interestRate * 100).toFixed(1)
                })}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export const LoanProfileModal = ({
  isOpen,
  onClose,
  onSelect,
  title
}: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? t('assets:mode.loan')}
      className='max-w-2xl'
    >
      <div className='p-4'>
        <LoanProfileChoiceGrid
          onSelect={profile => {
            onSelect(profile)
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}
