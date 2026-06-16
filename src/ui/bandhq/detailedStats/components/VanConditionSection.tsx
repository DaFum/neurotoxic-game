import { DetailRow } from './DetailRow'
import type { PlayerData } from '../types'
import type { BasicTProps } from '../types'
import { Panel, ProgressBar } from '../../../shared'

export const VanConditionSection = ({
  player,
  t
}: { player: PlayerData } & BasicTProps) => (
  <Panel title={t('ui:stats.van_condition', { defaultValue: 'Van Condition' })}>
    {/* jscpd:ignore-start */}
    <div className='mb-4 space-y-2'>
      <ProgressBar
        label={t('ui:stats.fuel', { defaultValue: 'Fuel' })}
        value={player.van?.fuel}
        max={100}
        color='bg-fuel-yellow'
        size='sm'
      />
      <ProgressBar
        label={t('ui:stats.condition', { defaultValue: 'Condition' })}
        value={player.van?.condition}
        max={100}
        color='bg-condition-blue'
        size='sm'
      />
    </div>
    {/* jscpd:ignore-end */}
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
