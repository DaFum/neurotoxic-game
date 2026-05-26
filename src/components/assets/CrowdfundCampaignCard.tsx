import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getCrowdfundImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import type { CrowdfundCampaign } from '../../types/assets'

interface Props {
  campaign: CrowdfundCampaign
}

/**
 * Compact campaign card for the LiabilitiesPanel / hub overview.
 * Shows target, days remaining, fame stake, and a pitch image.
 */
export const CrowdfundCampaignCard = ({ campaign }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  return (
    <div
      className='flex gap-3 border-2 p-2 font-mono text-xs'
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))'
      }}
    >
      <div className='w-20 shrink-0'>
        <GeneratedImagePanel
          prompt={getCrowdfundImagePrompt(
            campaign.assetSpec.kind,
            campaign.assetSpec.flavor
          )}
          alt={t(`assets:kind.${campaign.assetSpec.kind}`)}
          aspectRatio='4:3'
          sizeHint={{ width: 160, height: 120 }}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <strong>{t(`assets:kind.${campaign.assetSpec.kind}`)}</strong>
        <span>
          {formatCurrency(campaign.targetAmount, i18n.language)} ·{' '}
          {t('assets:campaign.daysRemaining', {
            count: campaign.daysRemaining
          })}
        </span>
        <span style={{ color: 'var(--color-warning-yellow)' }}>
          {t('assets:crowdfund.fameStake', { amount: campaign.fameStake })}
        </span>
      </div>
    </div>
  )
}
