import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import {
  getTotalDailyObligations,
  getTotalDebt
} from '../../utils/assetSelectors'
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
  const totalDebt = useGameSelector(getTotalDebt)

  return (
    <header
      className='flex items-center gap-3 border-b-2 px-3 py-2 sm:px-4'
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))',
        background: 'var(--color-void)'
      }}
    >
      <span className='hidden shrink-0 font-mono text-xs uppercase opacity-60 sm:inline'>
        {t('assets:scene.title')}
      </span>
      <div className='scrollbar-hidden flex flex-1 items-center gap-4 overflow-x-auto font-mono text-xs sm:gap-6 sm:text-sm'>
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
          {formatCurrency(obligations, i18n.language, 'always')}
          {t('assets:common.dailySuffix')}
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
