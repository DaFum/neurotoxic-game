import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import {
  getTotalDailyObligations,
  getTotalDebt
} from '../../utils/assetSelectors'
import { formatCurrency } from '../../utils/numberUtils'

const StatusCell = ({
  label,
  value,
  tone = 'neutral',
  featured = false
}: {
  label: string
  value: string | number
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
  featured?: boolean
}) => {
  const color =
    tone === 'danger'
      ? 'var(--color-blood-red-bright)'
      : tone === 'warning'
        ? 'var(--color-warning-yellow)'
        : tone === 'good'
          ? 'var(--color-toxic-green)'
          : 'var(--color-star-white)'

  return (
    <div
      className={`assets-status-cell min-w-0 border-l-2 px-2 py-1 first:border-l-0 sm:px-3 ${
        featured ? 'assets-status-cell--featured' : ''
      }`}
    >
      <span className='block truncate text-xxs uppercase opacity-60'>
        {label}
      </span>
      <strong
        className='block truncate text-xs leading-tight sm:text-sm'
        style={{ color }}
      >
        {value}
      </strong>
    </div>
  )
}

/**
 * Renders liquidity, obligations, debt, and crowdfund status for assets.
 */
export const AssetsStatusStrip = () => {
  const { t, i18n } = useTranslation(['assets'])
  const money = useGameSelector(state => state.player.money)
  const obligations = useGameSelector(getTotalDailyObligations)
  const totalDebt = useGameSelector(getTotalDebt)
  const campaignCount = useGameSelector(
    state => state.crowdfundCampaigns.length
  )

  return (
    <header className='assets-hub-panel assets-hub-reveal assets-status-strip mx-2 mt-2 overflow-hidden sm:mx-4'>
      <div className='assets-status-strip__header flex items-center justify-between border-b-2 px-2 py-1 sm:px-3'>
        <h1 className='assets-hub-title truncate text-lg uppercase sm:text-2xl'>
          {t('assets:scene.title')}
        </h1>
        <span className='assets-hub-control text-xxs uppercase opacity-60'>
          {t('assets:scene.subtitle')}
        </span>
      </div>
      <div className='grid grid-cols-4 divide-x divide-ash-gray/35'>
        <StatusCell
          label={t('assets:hub.status.cash')}
          value={formatCurrency(money, i18n.language)}
          tone={money < 0 ? 'danger' : 'good'}
          featured
        />
        <StatusCell
          label={t('assets:hub.status.daily')}
          value={formatCurrency(-obligations, i18n.language, 'always')}
          tone={obligations > 0 ? 'danger' : 'good'}
        />
        <StatusCell
          label={t('assets:hub.status.debt')}
          value={
            totalDebt > 0
              ? formatCurrency(totalDebt, i18n.language)
              : t('assets:hub.status.noDebt')
          }
          tone={totalDebt > 0 ? 'warning' : 'neutral'}
        />
        <StatusCell
          label={t('assets:hub.status.campaigns')}
          value={campaignCount}
          tone={campaignCount > 0 ? 'warning' : 'neutral'}
        />
      </div>
    </header>
  )
}
