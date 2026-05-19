import { useTranslation } from 'react-i18next'
import { BRAND_DEALS } from '../../data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import { formatCurrency } from '../../utils/numberUtils'
import { resolveGenImageUrl } from '../../utils/imageGen'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { SocialState } from '../../types'

interface BrandDealsTabProps {
  social: SocialState
}

export const BrandDealsTab = ({ social }: BrandDealsTabProps) => {
  const { t } = useTranslation()
  const isOnline = useNetworkStatus()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {BRAND_DEALS.map((deal) => {
        const displayDeal = getTranslatedBrandDealDisplay({ id: deal.id, name: deal.name, description: deal.description }, t)

        // Find if this deal is active by checking social.activeDeals
        const isActive = social.activeDeals?.some((activeDeal: any) => activeDeal.id === deal.id)

        // Generate a specific, fitting image prompt for each deal
        const prompt = `pixel art logo for ${deal.name}, ${deal.description}, dark grunge aesthetic, high contrast, visually striking`
        const imageUrl = resolveGenImageUrl(prompt, isOnline)

        return (
          <div
            key={deal.id}
            className={`border-2 p-4 relative flex flex-col ${isActive ? 'border-toxic-green bg-toxic-green/10 shadow-[0_0_15px_var(--color-toxic-green)]' : 'border-ash-gray/30 bg-void-black/80'}`}
          >
            {isActive && (
              <div className="absolute top-0 right-0 bg-toxic-green text-void-black text-xs font-bold px-2 py-1 uppercase tracking-wider transform translate-x-2 -translate-y-2 border border-toxic-green">
                {t('ui:brandDeals.activeLabel', { defaultValue: 'ACTIVE DEAL' })}
              </div>
            )}

            <div
              className="h-32 w-full mb-4 bg-cover bg-center border border-ash-gray/20"
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />

            <h3 className={`text-lg font-bold mb-2 font-mono uppercase tracking-wide ${isActive ? 'text-toxic-green' : 'text-star-white'}`}>
              {displayDeal?.name || deal.name}
            </h3>

            <p className="text-sm text-ash-gray mb-4 flex-grow">
              {displayDeal?.description || deal.description}
            </p>

            <div className="mt-auto pt-3 border-t border-ash-gray/20 text-xs font-mono">
              <div className="flex justify-between mb-1">
                <span className="text-ash-gray">{t('ui:brandDeals.alignment', { defaultValue: 'Alignment:' })}</span>
                <span className={`font-bold ${
                  deal.alignment === 'EVIL' ? 'text-blood-red' :
                  deal.alignment === 'GOOD' ? 'text-star-white' :
                  deal.alignment === 'SUSTAINABLE' ? 'text-stamina-green' :
                  deal.alignment === 'INDIE' ? 'text-mood-pink' :
                  deal.alignment === 'CORPORATE' ? 'text-warning-yellow' :
                  'text-ash-gray'
                }`}>{deal.alignment}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-ash-gray">{t('ui:brandDeals.duration', { defaultValue: 'Duration:' })}</span>
                <span className="text-star-white">{deal.offer.duration} {t('ui:brandDeals.gigs', { defaultValue: 'Gigs' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash-gray">{t('ui:brandDeals.upfront', { defaultValue: 'Upfront:' })}</span>
                <span className="text-toxic-green">{formatCurrency(deal.offer.upfront)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
