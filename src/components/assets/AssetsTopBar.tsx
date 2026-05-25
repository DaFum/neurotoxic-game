import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { formatCurrency } from '../../utils/numberUtils'

/**
 * Hub top bar showing the player's three asset-relevant financial summaries:
 * cash on hand, net daily obligations (positive = bleeding, negative = net
 * positive cashflow), and total outstanding debt across all liabilities.
 *
 * Cross-section visible by design — every section view sees the same money
 * picture, so the player doesn't have to leave a section to check whether
 * upgrading a Studio will tip them into bankruptcy.
 */
export const AssetsTopBar = () => {
  const { t, i18n } = useTranslation(['assets'])
  const money = useGameSelector(state => state.player.money)
  const obligations = useGameSelector(getTotalDailyObligations)
  const totalDebt = useGameSelector(state =>
    state.liabilities.reduce((sum, l) => sum + l.principalRemaining, 0)
  )

  return (
    <header
      className='flex flex-wrap items-center justify-between gap-3 border-b-2 px-4 py-2'
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))',
        background: 'var(--color-void)'
      }}
    >
      <div className='flex items-center gap-2'>
        <span className='font-mono text-xs uppercase opacity-60'>
          {t('assets:scene.title')}
        </span>
      </div>
      <div className='flex items-center gap-6 font-mono text-sm'>
        <span className='whitespace-nowrap'>
          💰 {formatCurrency(money, i18n.language)}
        </span>
        <span
          className='whitespace-nowrap'
          style={{
            color:
              obligations > 0
                ? 'var(--color-blood)'
                : 'var(--color-toxic-green)'
          }}
        >
          {obligations > 0 ? '↘' : '↗'}{' '}
          {formatCurrency(obligations, i18n.language, 'always')}/d
        </span>
        {totalDebt > 0 && (
          <span
            className='whitespace-nowrap'
            style={{ color: 'var(--color-warning-yellow)' }}
          >
            ⚠ {formatCurrency(totalDebt, i18n.language)}
          </span>
        )}
      </div>
    </header>
  )
}
