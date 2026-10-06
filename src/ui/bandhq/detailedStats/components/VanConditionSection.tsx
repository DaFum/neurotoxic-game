import { useTranslation } from 'react-i18next'
import { DetailRow } from './DetailRow'
import { formatPercent } from '../../../../utils/numberUtils'
import { finiteNumberOr } from '../../../../utils/finiteNumber'
import type { PlayerState } from '../../../../types'
import type { BasicTProps } from '../types'
import { Panel } from '../../../shared'
import { VanStatusBars } from '../../VanStatusBars'

export const VanConditionSection = ({
  player,
  t
}: { player: PlayerState } & BasicTProps) => {
  const { i18n } = useTranslation()
  return (
    <Panel
      title={t('ui:stats.van_condition', { defaultValue: 'Van Condition' })}
    >
      <div className='mb-4'>
        <VanStatusBars van={player.van} t={t} fuelSize='sm' />
      </div>
      <DetailRow
        label={t('ui:detailedStats.breakdownChance', {
          defaultValue: 'Breakdown Chance'
        })}
        value={formatPercent(
          finiteNumberOr(player.van?.breakdownChance, 0),
          i18n.language,
          { minimumFractionDigits: 1, maximumFractionDigits: 1 }
        )}
      />
      <DetailRow
        label={t('ui:detailedStats.upgrades', { defaultValue: 'Upgrades' })}
        value={t('ui:detailedStats.vanUpgrades.installed', {
          count: (player.van?.upgrades || []).length,
          defaultValue: `${(player.van?.upgrades || []).length} Installed`
        })}
        subtext={
          player.van?.upgrades?.join(', ') ||
          t('ui:detailedStats.none', { defaultValue: 'None' })
        }
      />
    </Panel>
  )
}
