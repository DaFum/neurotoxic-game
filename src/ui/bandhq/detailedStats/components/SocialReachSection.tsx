import type { SocialState } from '../../../../types'
import type { BasicTProps } from '../types'
import { DetailRow } from './DetailRow'
import { getTranslatedBrandDealDisplay } from '../../../../utils/brandDealI18n'
import { Panel } from '../../../shared'
import { isUnlocked } from '../helpers'

export const SocialReachSection = ({
  social,
  t
}: { social: SocialState } & BasicTProps) => {
  const activeDeals = social?.activeDeals ?? []
  const activeDealDisplays = activeDeals.flatMap((deal, index) => {
    const display = getTranslatedBrandDealDisplay(deal, t, index)
    return display ? [display] : []
  })
  const totalReach =
    (social?.instagram ?? 0) +
    (social?.tiktok ?? 0) +
    (social?.youtube ?? 0) +
    (social?.newsletter ?? 0)

  return (
    <Panel
      title={t('ui:stats.social_reach', {
        defaultValue: 'Social Media Reach'
      })}
    >
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4'>
        <DetailRow
          label={t('ui:stats.instagram', { defaultValue: 'Instagram' })}
          value={social?.instagram ?? 0}
          locked={!isUnlocked(social?.instagram ?? 0)}
        />
        <DetailRow
          label={t('ui:stats.tiktok', { defaultValue: 'TikTok' })}
          value={social?.tiktok ?? 0}
          locked={!isUnlocked(social?.tiktok ?? 0)}
        />
        <DetailRow
          label={t('ui:stats.youtube', { defaultValue: 'YouTube' })}
          value={social?.youtube ?? 0}
          locked={!isUnlocked(social?.youtube ?? 0)}
        />
        <DetailRow
          label={t('ui:stats.newsletter', { defaultValue: 'Newsletter' })}
          value={social?.newsletter ?? 0}
          locked={!isUnlocked(social?.newsletter ?? 0)}
        />
        <DetailRow
          label={t('ui:stats.totalReach', { defaultValue: 'Total Reach' })}
          value={totalReach}
        />
        <DetailRow
          label={t('ui:stats.viralStatus', { defaultValue: 'Viral Status' })}
          value={
            social.viral
              ? t('ui:stats.viral', { defaultValue: 'VIRAL' })
              : t('ui:stats.normal', { defaultValue: 'Normal' })
          }
          locked={!social.viral}
        />
      </div>

      <div className='mt-2 border-t border-ash-gray/20 pt-2'>
        <div className='text-xs text-ash-gray mb-1 font-bold italic tracking-tighter'>
          {t('ui:stats.socialDynamics', {
            defaultValue: 'SOCIAL DYNAMICS'
          })}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4'>
          <DetailRow
            label={t('ui:stats.currentTrend', {
              defaultValue: 'Current Trend'
            })}
            value={
              social.trend ||
              t('ui:stats.trendNeutral', { defaultValue: 'NEUTRAL' })
            }
          />
          <DetailRow
            label={t('ui:stats.repCooldown', {
              defaultValue: 'Rep Cooldown'
            })}
            value={social.reputationCooldown ?? 0}
            subtext={t('ui:stats.repCooldownDesc', {
              defaultValue: 'Days until rep-gated posts clear'
            })}
            locked={!isUnlocked(social.reputationCooldown)}
          />
          <DetailRow
            label={t('ui:stats.brandDeals', { defaultValue: 'Brand Deals' })}
            value={activeDealDisplays.length}
            subtext={
              activeDealDisplays.length > 0 ? (
                <div className='space-y-1'>
                  {activeDealDisplays.map(deal => (
                    <div key={deal.key}>
                      <div className='font-bold text-star-white'>
                        {deal.name}
                      </div>
                      {deal.description ? (
                        <div className='leading-snug text-ash-gray/70'>
                          {deal.description}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                t('ui:stats.noContracts', {
                  defaultValue: 'No active contracts'
                })
              )
            }
            locked={!isUnlocked(activeDealDisplays)}
          />
        </div>
      </div>

      <div className='mt-2 border-t border-ash-gray/20 pt-2'>
        <div className='text-xs text-ash-gray mb-1 font-bold'>
          {t('ui:stats.advancedMetrics', {
            defaultValue: 'Advanced Metrics'
          })}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4'>
          <DetailRow
            label={t('ui:stats.fanLoyalty', { defaultValue: 'Fan Loyalty' })}
            value={social.loyalty ?? 0}
            subtext={t('ui:stats.fanLoyaltyDesc', {
              defaultValue: 'Shields against bad gigs'
            })}
            locked={!isUnlocked(social.loyalty)}
          />
          <DetailRow
            label={t('ui:stats.controversy', { defaultValue: 'Controversy' })}
            value={`${Math.min(100, social.controversyLevel ?? 0)}/100`}
            subtext={
              (social.controversyLevel ?? 0) >= 100
                ? t('ui:stats.shadowbanned', {
                    defaultValue: 'SHADOWBANNED (-75% Growth)'
                  })
                : t('ui:stats.riskOfShadowban', {
                    defaultValue: 'Risk of Shadowban'
                  })
            }
            locked={!isUnlocked(social.controversyLevel ?? 0)}
          />
        </div>
      </div>
    </Panel>
  )
}
