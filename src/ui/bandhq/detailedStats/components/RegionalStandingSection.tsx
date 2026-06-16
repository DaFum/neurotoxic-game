import type { BasicTProps } from '../types'
import { useMemo } from 'react'
import { isEmptyObject } from '../../../../utils/gameState'
import { translateLocation } from '../../../../utils/locationI18n'
import { DetailRow } from './DetailRow'
import { getUnblacklistCost } from '../../../../context/reducers/socialReducer'
import { Panel } from '../../../shared'
import { getCityKeyFromVenueId } from '../../../../utils/mapGenerator'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../../../utils/numberUtils'

export const RegionalStandingSection = ({
  reputationByRegion,
  venueBlacklist,
  playerMoney,
  onMakeAmends,
  t
}: {
  reputationByRegion: Record<string, number>
  venueBlacklist: string[]
  playerMoney: number
  onMakeAmends?: (venueId: string) => void
} & BasicTProps) => {
  const { i18n } = useTranslation()
  const blacklistedCityKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const v of venueBlacklist) {
      const k = getCityKeyFromVenueId(v)
      if (k !== '') keys.add(k)
    }
    return keys
  }, [venueBlacklist])

  const regionalRows = useMemo(() => {
    return Object.entries(reputationByRegion).map(([region, rep]) => (
      <DetailRow
        key={region}
        label={translateLocation(t, region, region)}
        value={rep}
        subtext={
          blacklistedCityKeys.has(region)
            ? t('ui:detailedStats.blacklisted', {
                defaultValue: 'BLACKLISTED VENUES'
              })
            : null
        }
      />
    ))
  }, [reputationByRegion, blacklistedCityKeys, t])

  return (
    <Panel
      title={t('ui:stats.regional_standing', {
        defaultValue: 'Regional Standing'
      })}
    >
      {isEmptyObject(reputationByRegion) ? (
        <div className='text-xs text-ash-gray italic py-4 text-center'>
          {t('ui:detailedStats.noRegionalData', {
            defaultValue: 'No regional data yet. Play gigs to build reputation.'
          })}
        </div>
      ) : (
        <div className='space-y-1'>{regionalRows}</div>
      )}
      {venueBlacklist.length > 0 && (
        <div className='mt-2 pt-2 border-t border-ash-gray/20'>
          <div className='text-xs text-ash-gray mb-1 uppercase tracking-widest'>
            {t('ui:detailedStats.blacklistedVenues', {
              defaultValue: 'Blacklisted Venues'
            })}
          </div>
          <div className='space-y-1'>
            {venueBlacklist.map(venueId => {
              const cost = getUnblacklistCost(venueId)
              const affordable = playerMoney >= cost
              return (
                <div
                  key={venueId}
                  className='flex items-center justify-between gap-2'
                >
                  <span className='text-xs text-toxic-green font-mono italic'>
                    {translateLocation(t, venueId, venueId)}
                  </span>
                  {onMakeAmends && (
                    <button
                      type='button'
                      disabled={!affordable}
                      onClick={() => onMakeAmends(venueId)}
                      aria-label={`${t('ui:detailedStats.makeAmends', {
                        amount: formatCurrency(cost, i18n.language),
                        defaultValue: 'Make Amends ({{amount}})'
                      })} — ${translateLocation(t, venueId, venueId)}`}
                      className='text-xs px-2 py-0.5 border border-toxic-green/50 text-toxic-green uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-toxic-green/10'
                    >
                      {t('ui:detailedStats.makeAmends', {
                        amount: formatCurrency(cost, i18n.language),
                        defaultValue: 'Make Amends ({{amount}})'
                      })}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Panel>
  )
}
