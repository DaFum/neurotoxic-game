import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getLoanProfileImagePrompt } from '../../utils/imageGen'
import {
  LOAN_PROFILES_ARRAY,
  calculateTotalRepayment,
  computeAmortization,
  isLoanProfileEligible,
  type LoanProfileId
} from '../../utils/assets/loanProfiles'
import { formatCurrency, formatPercent } from '../../utils/numberUtils'
import { finiteNumberOr } from '../../utils/gameState'
import { useGameSelector } from '../../context/GameState'
import type { BaseModalProps } from '../../types/ui'

interface Props extends BaseModalProps {
  /** Returns whether the selection was accepted; the modal closes only then. */
  onSelect: (profile: LoanProfileId) => boolean
  title?: string
  /** Principal each profile's daily payment and total repayment price. */
  principal?: number
  /** Content above the profiles, e.g. the current loan terms. */
  children?: ReactNode
}

interface LoanProfileChoiceGridProps {
  value?: LoanProfileId
  onSelect: (profile: LoanProfileId) => void
  /** Principal to price each profile's daily payment and total repayment. */
  principal?: number
}

/**
 * Displays available loan profiles and eligibility state.
 * @param props - Selected loan profile and selection callback.
 */
export const LoanProfileChoiceGrid = ({
  value,
  onSelect,
  principal
}: LoanProfileChoiceGridProps) => {
  const { t, i18n } = useTranslation(['assets'])
  const baseId = useId()
  // Read the eligibility inputs exactly as the action creators do.
  const fame = useGameSelector(s => s.player.fame)
  const scenePresence = useGameSelector(s =>
    finiteNumberOr(s.social.scenePresence, 0)
  )
  return (
    <div className='grid grid-cols-1 gap-3 font-mono text-sm sm:grid-cols-2'>
      {LOAN_PROFILES_ARRAY.map(profile => {
        const isActive = value === profile.id
        // Same amortization the reducer stamps on the liability.
        const dailyPayment =
          principal === undefined
            ? undefined
            : computeAmortization(
                principal,
                profile.interestRate,
                profile.termDays
              )
        const eligible = isLoanProfileEligible(profile, {
          fame,
          scenePresence
        })
        const requirements = [
          profile.minFameRequired !== undefined &&
            t('assets:loan.requirement.fame', {
              value: profile.minFameRequired
            }),
          profile.minScenePresenceRequired !== undefined &&
            t('assets:loan.requirement.scenePresence', {
              value: profile.minScenePresenceRequired
            })
        ].filter((text): text is string => typeof text === 'string')
        const requirementId =
          requirements.length > 0
            ? `${baseId}-${profile.id}-requirement`
            : undefined
        return (
          <div key={profile.id} className='flex flex-col gap-1'>
            <button
              type='button'
              onClick={() => onSelect(profile.id)}
              disabled={!eligible}
              aria-describedby={requirementId}
              className='flex gap-2 border-2 p-2 text-left disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
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
                    rate: formatPercent(profile.interestRate, i18n.language, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })
                  })}
                </span>
                {dailyPayment !== undefined && (
                  <span className='text-xs'>
                    {t('assets:loan.quote', {
                      daily: formatCurrency(dailyPayment, i18n.language),
                      total: formatCurrency(
                        calculateTotalRepayment(dailyPayment, profile.termDays),
                        i18n.language
                      )
                    })}
                  </span>
                )}
              </div>
            </button>
            {requirementId && (
              <span id={requirementId} className='text-xs opacity-70'>
                {requirements.join(' · ')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Presents loan-profile selection for financed chassis acquisition.
 * @param props - Modal state, close handler, profile selection callback, and title.
 */
export const LoanProfileModal = ({
  isOpen,
  onClose,
  onSelect,
  title,
  principal,
  children
}: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? t('assets:mode.loan')}
      className='assets-modal-sheet max-w-2xl'
    >
      <div className='flex flex-col gap-3 p-4'>
        {children}
        <LoanProfileChoiceGrid
          principal={principal}
          onSelect={profile => {
            if (onSelect(profile)) onClose()
          }}
        />
      </div>
    </Modal>
  )
}
