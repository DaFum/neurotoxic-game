import type { BasicTProps } from '../types'
import { translateLocation } from '../../../../utils/locationI18n'
import { DetailRow } from './DetailRow'
import { isUnlocked } from '../helpers'
import type { PlayerState } from '../../../../types'
import { Panel } from '../../../shared'
import { finiteNumberOr, wrapClockHour } from '../../../../utils/gameState'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../../../utils/numberUtils'

export const CareerOverviewSection = ({
  player,
  t
}: { player: PlayerState } & BasicTProps) => {
  const { i18n } = useTranslation()
  const locationName = translateLocation(
    t,
    player.location ?? '',
    player.location ?? ''
  )
  return (
    <Panel
      title={t('ui:stats.career_overview', {
        defaultValue: 'Career Overview'
      })}
    >
      <DetailRow
        label={t('ui:stats.funds', { defaultValue: 'Funds' })}
        value={formatCurrency(player.money ?? 0, i18n.language)}
      />
      <DetailRow
        label={t('ui:stats.fame', { defaultValue: 'Fame' })}
        value={Math.floor(finiteNumberOr(player?.fame, 0))}
        subtext={`${t('ui:ui.level', { defaultValue: 'Level' })} ${finiteNumberOr(player?.fameLevel, 0)}`}
      />
      <DetailRow
        label={t('ui:ui.day', { defaultValue: 'Day' })}
        value={finiteNumberOr(player?.day, 1)}
      />
      <DetailRow
        label={t('ui:ui.time', { defaultValue: 'Time' })}
        value={`${String(wrapClockHour(finiteNumberOr(player?.time, 12))).padStart(2, '0')}:00`}
      />
      <DetailRow
        label={t('ui:ui.location', { defaultValue: 'Location' })}
        value={locationName}
      />
      <DetailRow
        label={t('ui:detailedStats.totalTravels')}
        value={finiteNumberOr(player?.totalTravels, 0)}
      />
      <DetailRow
        label={t('ui:detailedStats.passiveFollowers')}
        value={t('ui:detailedStats.passiveFollowersPerDay', {
          count: finiteNumberOr(player?.passiveFollowers, 0)
        })}
        locked={!isUnlocked(finiteNumberOr(player?.passiveFollowers, 0))}
      />
      <DetailRow
        label={t('ui:detailedStats.hqUpgrades.count')}
        value={t('ui:detailedStats.hqUpgrades.installed', {
          count: (player.hqUpgrades || []).length,
          defaultValue: `${(player.hqUpgrades || []).length} Installed`
        })}
        subtext={
          player.hqUpgrades?.join(', ') ||
          t('ui:detailedStats.hqUpgrades.none', { defaultValue: 'None' })
        }
      />
      {player.stats?.proveYourselfMode && (
        <DetailRow
          label={t('ui:detailedStats.mode.label')}
          value={t('ui:detailedStats.mode.proveYourself')}
          subtext={t('ui:detailedStats.mode.restrictions')}
          className='bg-toxic-green/10'
        />
      )}
    </Panel>
  )
}
