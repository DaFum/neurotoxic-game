import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameSelector } from '../../context/GameState'

/**
 * Lightweight read-only list of every outstanding liability with the most
 * gameplay-relevant fields (daily payment, principal remaining, default
 * countdown). Section views can embed this alongside their asset views.
 */
export const LiabilitiesPanel = () => {
  const { t, i18n } = useTranslation(['assets'])
  const liabilities = useGameSelector(s => s.liabilities)

  if (liabilities.length === 0) {
    return (
      <p className='font-mono text-xs opacity-60'>
        {t('assets:liability.paymentDue', { amount: '—' })}
      </p>
    )
  }

  return (
    <ul className='flex flex-col gap-1 font-mono text-xs'>
      {liabilities.map(l => (
        <li
          key={l.id}
          className='flex items-center justify-between border-2 px-2 py-1'
          style={{
            borderColor: 'var(--section-accent, var(--color-toxic-green))'
          }}
        >
          <span className='opacity-70'>{l.source}</span>
          <span>
            {t('assets:loan.dailyPayment', {
              amount: formatCurrency(l.dailyPayment, i18n.language)
            })}
          </span>
          <span>
            {formatCurrency(l.principalRemaining, i18n.language)} (
            {t('assets:liability.termDays', { count: l.termDaysRemaining })})
          </span>
          {l.defaultCounter > 0 && (
            <span style={{ color: 'var(--color-blood-red)' }}>
              {t('assets:loan.defaultWarning', {
                daysLeft: Math.max(0, 7 - l.defaultCounter)
              })}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
