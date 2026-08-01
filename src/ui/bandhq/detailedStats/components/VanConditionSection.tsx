import { DetailRow } from './DetailRow'
import type { PlayerState } from '../../../../types'
import type { BasicTProps } from '../types'
import { Panel } from '../../../shared'
import { VanStatusBars } from '../../VanStatusBars'

export const VanConditionSection = ({
  player,
  t
}: { player: PlayerState } & BasicTProps) => (
  <Panel title={t('ui:stats.van_condition', { defaultValue: 'Van Condition' })}>
    <div className='mb-4'>
      <VanStatusBars van={player.van} t={t} fuelSize='sm' />
    </div>
    <DetailRow
      label={t('ui:detailedStats.breakdownChance', {
        defaultValue: 'Breakdown Chance'
      })}
      value={`${((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%`}
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
