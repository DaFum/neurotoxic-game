import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BRAND_DEALS } from '../../data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import { formatCurrency } from '../../utils/numberUtils'
import { resolveGenImageUrl } from '../../utils/imageGen'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import type { SocialState } from '../../types'

interface BrandDealsTabProps {
  social: SocialState
}

/**
 * Displays active brand deals and reputation context inside Band HQ.
 * @param props - Social sponsorship state shown in the brand deals tab.
 */
export const BrandDealsTab = ({ social }: BrandDealsTabProps) => {
  const { t, i18n } = useTranslation()
  const isOnline = useNetworkStatus()

  // ⚡ BOLT OPTIMIZATION: Replaced activeDealIds Set and O(N) Array.find() inside render loop with a precomputed Map for O(1) lookups.
  const activeDealsMap = useMemo(() => {
    const deals = social?.activeDeals ?? []
    const map = new Map<string, unknown>()
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i]
      if (deal && typeof deal === 'object' && 'id' in deal && typeof deal.id === 'string') {
        map.set(deal.id, deal)
      }
    }
    return map
  }, [social?.activeDeals])

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {BRAND_DEALS.map(deal => {
        const displayDeal = getTranslatedBrandDealDisplay(
          { id: deal.id, name: deal.name, description: deal.description },
          t
        )

        const isActive = activeDealsMap.has(deal.id)
        const activeDeal = activeDealsMap.get(deal.id) ?? null

        // Generate a specific, fitting image prompt for each deal
        const prompt = `pixel art logo for ${deal.name}, ${deal.description}, dark grunge aesthetic, high contrast, visually striking`
        const imageUrl = resolveGenImageUrl(prompt, isOnline)

        return (
          <div
            key={deal.id}
            className={`border-2 p-4 relative flex flex-col ${isActive ? 'border-toxic-green bg-toxic-green/10 ' : 'border-ash-gray/30 bg-void-black/80'}`}
          >
            {isActive && (
              <div className='absolute top-0 right-0 bg-toxic-green text-void-black text-xs font-bold px-2 py-1 uppercase tracking-wider transform translate-x-2 -translate-y-2 border border-toxic-green'>
                {t('ui:brandDeals.activeLabel', {
                  defaultValue: 'ACTIVE DEAL'
                })}
              </div>
            )}

            <div
              className='h-32 w-full mb-4 bg-cover bg-center border border-ash-gray/20'
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />

            <h3
              className={`text-lg font-bold mb-2 font-mono uppercase tracking-wide ${isActive ? 'text-toxic-green' : 'text-star-white'}`}
            >
              {displayDeal?.name || deal.name}
            </h3>

            <p className='text-sm text-ash-gray mb-4 flex-grow'>
              {displayDeal?.description || deal.description}
            </p>

            <div className='mt-auto pt-3 border-t border-ash-gray/20 text-xs font-mono'>
              <div className='flex justify-between mb-1'>
                <span className='text-ash-gray'>
                  {t('ui:brandDeals.alignment', { defaultValue: 'Alignment:' })}
                </span>
                <span
                  className={`font-bold ${
                    deal.alignment === 'EVIL'
                      ? 'text-blood-red'
                      : deal.alignment === 'GOOD'
                        ? 'text-star-white'
                        : deal.alignment === 'SUSTAINABLE'
                          ? 'text-stamina-green'
                          : deal.alignment === 'INDIE'
                            ? 'text-mood-pink'
                            : deal.alignment === 'CORPORATE'
                              ? 'text-warning-yellow'
                              : 'text-ash-gray'
                  }`}
                >
                  {t(`ui:deals.alignment.${deal.alignment.toLowerCase()}`, {
                    defaultValue: deal.alignment
                  })}
                </span>
              </div>
              <div className='flex justify-between mb-1'>
                <span className='text-ash-gray'>
                  {isActive
                    ? t('ui:brandDeals.remaining', {
                        defaultValue: 'Remaining:'
                      })
                    : t('ui:brandDeals.duration', {
                        defaultValue: 'Duration:'
                      })}
                </span>
                <span className='text-star-white'>
                  {t('ui:brandDeals.durationValue', {
                    count:
                      isActive &&
                      activeDeal !== null &&
                      typeof activeDeal === 'object' &&
                      'remainingGigs' in activeDeal &&
                      typeof activeDeal.remainingGigs === 'number'
                        ? activeDeal.remainingGigs
                        : deal.offer.duration,
                    defaultValue: '{{count}} Gigs'
                  })}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-ash-gray'>
                  {t('ui:brandDeals.upfront', { defaultValue: 'Upfront:' })}
                </span>
                <span className='text-toxic-green'>
                  {formatCurrency(deal.offer.upfront, i18n.language)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
