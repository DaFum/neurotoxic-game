import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { LoanProfileModal } from './LoanProfileModal'
import {
  calculateRefinanceFee,
  type LoanProfileId
} from '../../utils/loanProfiles'
import { finiteNumberOr } from '../../utils/gameStateUtils'

/**
 * Lightweight read-only list of every outstanding liability with the most
 * gameplay-relevant fields (daily payment, principal remaining, default
 * countdown). Section views can embed this alongside their asset views.
 */
export const LiabilitiesPanel = () => {
  const { t, i18n } = useTranslation(['assets'])
  const liabilitiesMap = useGameSelector(s => s.liabilities)
  const liabilities = Object.values(liabilitiesMap || {})
  const { refinanceLiability } = useGameActions()
  const [refinanceTargetId, setRefinanceTargetId] = useState<string | null>(
    null
  )
  const refinanceTarget = refinanceTargetId ? liabilitiesMap[refinanceTargetId] : undefined

  const handleRefinance = (profile: LoanProfileId) => {
    if (!refinanceTarget) return
    refinanceLiability(refinanceTarget.id, profile)
  }

  if (liabilities.length === 0) {
    return (
      <p className='font-mono text-xs opacity-60'>
        {t('assets:liability.paymentDue', { amount: '—' })}
      </p>
    )
  }

  return (
    <>
      <ul className='flex flex-col gap-1 font-mono text-xs'>
        {liabilities.map(l => {
          const refinanceFee = calculateRefinanceFee(l.principalRemaining)
          const defaultCounter = finiteNumberOr(l.defaultCounter, 0)
          const canRefinance = l.source === 'loan' && defaultCounter <= 0
          return (
            <li
              key={l.id}
              className='flex flex-wrap items-center justify-between gap-2 border-2 px-2 py-1'
              style={{
                borderColor: 'var(--section-accent, var(--color-toxic-green))'
              }}
            >
              <span className='opacity-70'>
                {t(`assets:mode.${l.source}`, { defaultValue: l.source })}
              </span>
              <span>
                {t('assets:loan.dailyPayment', {
                  amount: formatCurrency(l.dailyPayment, i18n.language)
                })}
              </span>
              <span>
                {formatCurrency(l.principalRemaining, i18n.language)} (
                {t('assets:liability.termDays', {
                  count: l.termDaysRemaining
                })}
                )
              </span>
              {defaultCounter > 0 && (
                <span style={{ color: 'var(--color-blood-red)' }}>
                  {t('assets:loan.defaultWarning', {
                    daysLeft: Math.max(0, 7 - defaultCounter)
                  })}
                </span>
              )}
              {canRefinance && (
                <button
                  type='button'
                  onClick={() => setRefinanceTargetId(l.id)}
                  className='border px-2 py-1 uppercase'
                  style={{
                    borderColor:
                      'var(--section-accent, var(--color-toxic-green))'
                  }}
                >
                  {t('assets:loan.refinance', {
                    fee: formatCurrency(refinanceFee, i18n.language)
                  })}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <LoanProfileModal
        isOpen={Boolean(refinanceTarget)}
        onClose={() => setRefinanceTargetId(null)}
        onSelect={handleRefinance}
        title={t('assets:loan.refinanceTitle')}
      />
    </>
  )
}
