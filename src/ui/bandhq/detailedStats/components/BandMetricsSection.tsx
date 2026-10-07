import { useTranslation } from 'react-i18next'
import type { BasicTProps } from '../types'
import { Panel, ProgressBar } from '../../../shared'
import { DetailRow } from './DetailRow'
import type { BandState, SocialState } from '../../../../types'
import { formatNumber } from '../../../../utils/numberUtils'

/** Number of most-recent banter outcomes listed in the metrics panel. */
const VISIBLE_BANTER_EVENTS = 5

export const BandMetricsSection = ({
  band,
  social,
  t
}: { band: BandState; social: SocialState } & BasicTProps) => {
  const { i18n } = useTranslation()
  const banterLog = Array.isArray(band?.banterEvents) ? band.banterEvents : []
  // The log is append-only (newest last), so an entry's position in it is a
  // stable identity for the list key.
  const recentBanter = banterLog
    .map((entry, position) => ({ entry, position }))
    .slice(-VISIBLE_BANTER_EVENTS)
    .reverse()
  return (
    <Panel title={t('ui:stats.band_metrics', { defaultValue: 'Band Metrics' })}>
      <div className='mb-4'>
        <ProgressBar
          label={t('ui:stats.harmony', { defaultValue: 'Harmony' })}
          value={band?.harmony ?? 0}
          max={100}
          color='bg-toxic-green'
        />
      </div>
      <DetailRow
        label={t('ui:detailedStats.luck', { defaultValue: 'Luck' })}
        value={band.luck ?? 0}
        subtext={t('ui:detailedStats.luckDesc', {
          defaultValue: 'Affects random events'
        })}
      />
      <DetailRow
        label={t('ui:detailedStats.inventorySlots', {
          defaultValue: 'Inventory Slots'
        })}
        value={band?.inventorySlots ?? 0}
      />
      {social.egoFocus && (
        <DetailRow
          label={t('ui:detailedStats.egoSpotlight', {
            defaultValue: 'Ego Spotlight'
          })}
          value={social.egoFocus}
          subtext={t('ui:detailedStats.harmonyDrain', {
            defaultValue: 'Harmony Drain Active'
          })}
          className='bg-mood-pink/10'
        />
      )}
      <div className='mt-2 border-t border-ash-gray/20 pt-2'>
        <div className='text-xs text-ash-gray mb-1 font-bold'>
          {t('ui:detailedStats.perfModifiers', {
            defaultValue: 'Performance Modifiers'
          })}
        </div>
        <DetailRow
          label={t('ui:detailedStats.guitarDiff', {
            defaultValue: 'Guitar Difficulty'
          })}
          value={`x${band.performance?.guitarDifficulty ?? 1.0}`}
        />
        <DetailRow
          label={t('ui:detailedStats.drumSpeed', {
            defaultValue: 'Drum Speed'
          })}
          value={`x${band.performance?.drumMultiplier ?? 1.0}`}
        />
        <DetailRow
          label={t('ui:detailedStats.crowdDecay', {
            defaultValue: 'Crowd Decay'
          })}
          value={`x${band.performance?.crowdDecay ?? 1.0}`}
        />
      </div>
      {recentBanter.length > 0 && (
        <div className='mt-2 border-t border-ash-gray/20 pt-2'>
          <div className='text-xs text-ash-gray mb-1 font-bold'>
            {t('ui:detailedStats.recentBanter', {
              defaultValue: 'Recent Banter'
            })}
          </div>
          {recentBanter.map(({ entry, position }) => (
            <DetailRow
              key={position}
              label={`${entry.member1} ↔ ${entry.member2}`}
              value={`${entry.delta > 0 ? '+' : ''}${formatNumber(entry.delta, i18n.language)}`}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}
