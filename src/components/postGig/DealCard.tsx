import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { BRAND_ALIGNMENTS } from '../../context/initialState'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import { IMG_PROMPTS } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import type {
  DealImageProps,
  DealInfoProps,
  DealActionsProps,
  DealCardProps
} from '../../types/components'
import type { BrandAlignment } from '../../types/social'

const getNegotiationStatus = (value: unknown): string | undefined => {
  if (
    value &&
    typeof value === 'object' &&
    Object.hasOwn(value, 'status') &&
    typeof (value as { status?: unknown }).status === 'string'
  ) {
    return (value as { status: string }).status
  }
  return undefined
}

type AlignmentMetadata = {
  imagePrompt: string
  badgeKey: string
  defaultLabel: string
  colorClass: string
}

const DEFAULT_ALIGNMENT_METADATA: AlignmentMetadata = {
  imagePrompt: IMG_PROMPTS.SOCIAL_POST_COMMERCIAL,
  badgeKey: 'ui:deals.alignment.unknown',
  defaultLabel: '❓ UNKNOWN',
  colorClass: 'text-ash-gray'
}

const ALIGNMENT_METADATA = {
  [BRAND_ALIGNMENTS.EVIL]: {
    imagePrompt: IMG_PROMPTS.BRAND_DEAL_EVIL,
    badgeKey: 'ui:deals.alignment.evil',
    defaultLabel: '😈 EVIL',
    colorClass: 'text-toxic-green'
  },
  [BRAND_ALIGNMENTS.CORPORATE]: {
    imagePrompt: IMG_PROMPTS.BRAND_DEAL_CORPORATE,
    badgeKey: 'ui:deals.alignment.corporate',
    defaultLabel: '🏢 CORP',
    colorClass: 'text-electric-blue'
  },
  [BRAND_ALIGNMENTS.INDIE]: {
    imagePrompt: IMG_PROMPTS.BRAND_DEAL_INDIE,
    badgeKey: 'ui:deals.alignment.indie',
    defaultLabel: '🎸 INDIE',
    colorClass: 'text-hot-pink'
  },
  [BRAND_ALIGNMENTS.SUSTAINABLE]: {
    imagePrompt: IMG_PROMPTS.BRAND_DEAL_SUSTAINABLE,
    badgeKey: 'ui:deals.alignment.sustainable',
    defaultLabel: '🌱 ECO',
    colorClass: 'text-warning-yellow'
  },
  [BRAND_ALIGNMENTS.GOOD]: {
    imagePrompt: IMG_PROMPTS.SOCIAL_POST_COMMERCIAL,
    badgeKey: 'ui:deals.alignment.good',
    defaultLabel: '🕊️ GOOD',
    colorClass: 'text-pure-white'
  },
  [BRAND_ALIGNMENTS.NEUTRAL]: {
    imagePrompt: IMG_PROMPTS.SOCIAL_POST_COMMERCIAL,
    badgeKey: 'ui:deals.alignment.neutral',
    defaultLabel: '⚖️ NEUTRAL',
    colorClass: 'text-ash-gray'
  }
} as const satisfies Record<BrandAlignment, AlignmentMetadata>

const getAlignmentMetadata = (alignment?: string): AlignmentMetadata => {
  if (alignment && Object.hasOwn(ALIGNMENT_METADATA, alignment)) {
    return ALIGNMENT_METADATA[alignment as BrandAlignment]
  }
  return DEFAULT_ALIGNMENT_METADATA
}

const isDeal = (value: unknown): value is DealCardProps['deal'] => {
  if (!value || typeof value !== 'object') return false
  if (!Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'name')) return false
  if (!Object.hasOwn(value, 'offer')) {
    return false
  }
  const deal = value as {
    id?: unknown
    name?: unknown
    description?: unknown
    offer?: unknown
  }

  const offer =
    typeof deal.offer === 'object' && deal.offer !== null
      ? (deal.offer as { upfront?: unknown; duration?: unknown })
      : null

  return (
    typeof deal.id === 'string' &&
    typeof deal.name === 'string' &&
    typeof deal.description === 'string' &&
    offer !== null &&
    Number.isFinite(offer.upfront) &&
    Number.isFinite(offer.duration)
  )
}

const DealImage = memo(({ alignment, name }: DealImageProps) => (
  <div className='shrink-0 w-20 h-20 sm:w-24 sm:h-24 border border-current opacity-80 overflow-hidden'>
    <GeneratedImagePanel
      prompt={getAlignmentMetadata(alignment).imagePrompt}
      alt={name}
      aspectRatio='1:1'
      variant='inline'
      className='w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-300 !border-0 !shadow-none'
    />
  </div>
))
DealImage.displayName = 'DealImage'
const urgencyClass = (urgency: string | undefined): string => {
  if (urgency === 'high') return 'text-blood-red'
  if (urgency === 'low') return 'text-ash-gray'
  return 'text-warning-yellow'
}

const DealInfo = memo(
  ({ displayDeal, isRevoked, brandReputation }: DealInfoProps) => {
    const { t, i18n } = useTranslation()
    const alignment = displayDeal.alignment
    const alignmentMetadata = getAlignmentMetadata(alignment)
    const alignmentReputation =
      alignment != null ? brandReputation?.[alignment] : undefined
    const flavor = displayDeal.flavor

    return (
      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline gap-2 sm:gap-3 flex-wrap'>
          <div
            className={`font-bold text-base sm:text-lg break-words ${isRevoked ? 'text-blood-red line-through' : 'text-toxic-green'}`}
          >
            {displayDeal.name}
          </div>
          {displayDeal.alignment && (
            <span
              className={`text-xs font-mono border border-current px-1 ${alignmentMetadata.colorClass}`}
            >
              {t(alignmentMetadata.badgeKey, {
                defaultValue: alignmentMetadata.defaultLabel
              })}
            </span>
          )}
          {flavor && flavor.variant !== 'standard' && (
            <span className='text-xs font-mono border border-electric-blue/60 text-electric-blue px-1 '>
              {t(flavor.variantLabelKey, {
                defaultValue: flavor.variantLabelDefault
              })}
            </span>
          )}
          {flavor && (
            <span
              className={`text-xs font-mono uppercase tracking-wider ${urgencyClass(flavor.urgency)}`}
            >
              {t(`economy:brandFlavor.urgency.${flavor.urgency}`, {
                defaultValue: flavor.urgency
              })}
            </span>
          )}
        </div>

        {flavor && (
          <div className='text-xs font-mono text-electric-blue/80 mt-1 break-words'>
            {t('economy:brandFlavor.campaignLabel', {
              defaultValue: 'Campaign'
            })}
            : “{flavor.campaignCodename}”
            <span className='text-ash-gray ml-2'>
              ·{' '}
              {t('economy:brandFlavor.repLabel', {
                defaultValue: 'Pitched by'
              })}
              :{' '}
              <span className='text-star-white/80'>
                {t(flavor.rep.nameKey, {
                  defaultValue: flavor.rep.nameDefault
                })}
              </span>{' '}
              <span className='italic'>
                (
                {t(flavor.rep.titleKey, {
                  defaultValue: flavor.rep.titleDefault
                })}
                )
              </span>
            </span>
          </div>
        )}

        <div className='text-xs text-ash-gray italic mb-2 break-words'>
          {displayDeal.description}
        </div>

        {flavor && (
          <div className='text-xs mb-2 border-l-2 border-toxic-green/60 pl-2 break-words'>
            <div className='text-toxic-green/90 italic'>
              “{t(flavor.taglineKey, { defaultValue: flavor.taglineDefault })}”
            </div>
            <div className='text-ash-gray/90 text-xs mt-0.5'>
              {t(flavor.hookKey, { defaultValue: flavor.hookDefault })}
            </div>
          </div>
        )}
        <div className='text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-star-white/80 break-words'>
          <div>
            💰 {t('ui:deals.upfront', { defaultValue: 'Upfront' })}:{' '}
            {formatCurrency(displayDeal.offer.upfront, i18n.language)}
          </div>
          <div>
            📅 {t('ui:deals.duration', { defaultValue: 'Duration' })}:{' '}
            {displayDeal.offer.duration}{' '}
            {t('ui:deals.gigs', { defaultValue: 'Gigs' })}
          </div>
          {displayDeal.offer.perGig != null && (
            <div>
              💵 {t('ui:deals.perGig', { defaultValue: 'Per Gig' })}:{' '}
              {formatCurrency(displayDeal.offer.perGig, i18n.language)}
            </div>
          )}
          {displayDeal.offer.item != null && (
            <div>
              🎁 {t('ui:deals.item', { defaultValue: 'Item' })}:{' '}
              {displayDeal.offer.item}
            </div>
          )}
          {displayDeal.penalty && (
            <div className='text-blood-red'>
              ⚠️ {t('ui:deals.risk', { defaultValue: 'Risk' })}:{' '}
              {Object.entries(displayDeal.penalty)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')}
            </div>
          )}
        </div>

        {/* Reputation Status */}
        {alignmentReputation !== undefined && (
          <div className='mt-2 text-xs text-ash-gray'>
            {t('ui:deals.reputation', { defaultValue: 'Reputation' })}:{' '}
            <span
              className={
                alignmentReputation > 0 ? 'text-toxic-green' : 'text-blood-red'
              }
            >
              {alignmentReputation}
            </span>
          </div>
        )}
      </div>
    )
  }
)
DealInfo.displayName = 'DealInfo'
const getNegotiationStatusText = (
  status: string | undefined,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (status === 'SUCCESS') {
    return t('ui:deals.termImproved', { defaultValue: 'TERM IMPROVED' })
  }
  if (status === 'WORSENED') {
    return t('ui:deals.termsWorsened', { defaultValue: 'TERMS WORSENED' })
  }
  return t('ui:deals.negotiationFailed', { defaultValue: 'NEGOTIATION FAILED' })
}

const DealActions = memo(
  ({
    deal,
    displayDeal,
    isRevoked,
    hasNegotiated,
    negotiationState,
    handleAcceptDeal,
    handleNegotiationStart
  }: DealActionsProps) => {
    const { t } = useTranslation()
    const negotiationStatus = getNegotiationStatus(negotiationState)

    return (
      <div className='flex flex-col gap-2 z-10 w-full sm:w-auto sm:min-w-36 sm:ml-4'>
        {!isRevoked ? (
          <>
            <ActionButton
              onClick={() => handleAcceptDeal(displayDeal)}
              className='w-full min-h-11 bg-toxic-green text-void-black font-bold uppercase hover:scale-105'
            >
              {t('ui:deals.accept', { defaultValue: 'ACCEPT' })}
            </ActionButton>
            {!hasNegotiated && (
              <button
                type='button'
                onClick={() => handleNegotiationStart(deal)}
                className='w-full min-h-11 px-4 py-2 border border-warning-yellow text-warning-yellow text-xs font-bold uppercase hover:bg-warning-yellow hover:text-void-black transition-colors'
              >
                {t('ui:deals.negotiate', { defaultValue: 'NEGOTIATE' })}
              </button>
            )}
            {hasNegotiated && (
              <div
                className={`text-center text-xs font-mono tracking-wider ${negotiationStatus === 'SUCCESS' ? 'text-toxic-green' : 'text-warning-yellow'}`}
              >
                {getNegotiationStatusText(negotiationStatus, t)}
              </div>
            )}
          </>
        ) : (
          <div className='text-blood-red font-bold font-mono text-center tracking-widest'>
            {t('ui:deals.revoked', { defaultValue: 'REVOKED' })}
          </div>
        )}
      </div>
    )
  }
)
DealActions.displayName = 'DealActions'
export const DealCard = memo(
  ({
    deal,
    negotiationState,
    brandReputation,
    handleAcceptDeal,
    handleNegotiationStart
  }: DealCardProps) => {
    const { t } = useTranslation(['ui', 'economy'])
    const isRevoked = getNegotiationStatus(negotiationState) === 'REVOKED'
    const negotiatedDeal = negotiationState?.deal
    const displayDeal = isDeal(negotiatedDeal) ? negotiatedDeal : deal
    const translatedDisplay = getTranslatedBrandDealDisplay(displayDeal, t)
    const localizedDisplayDeal = translatedDisplay
      ? {
          ...displayDeal,
          name: translatedDisplay.name,
          description: translatedDisplay.description ?? displayDeal.description
        }
      : displayDeal
    const hasNegotiated = !!negotiationState

    return (
      <div
        className={`border-2 border-toxic-green p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 group transition-colors relative overflow-hidden ${isRevoked ? 'bg-blood-red/20 border-blood-red grayscale opacity-50' : 'bg-void-black/80 hover:bg-toxic-green/10'}`}
      >
        {/* Background Alignment Watermark */}
        <div
          className={`absolute -right-4 -bottom-4 text-8xl sm:text-9xl opacity-5 font-black pointer-events-none select-none ${getAlignmentMetadata(displayDeal.alignment).colorClass}`}
        >
          {displayDeal.alignment?.[0]}
        </div>

        <div className='flex-1 min-w-0 z-10 flex gap-3 sm:gap-4 items-start'>
          <DealImage
            alignment={localizedDisplayDeal.alignment}
            name={localizedDisplayDeal.name}
          />
          <DealInfo
            displayDeal={localizedDisplayDeal}
            isRevoked={isRevoked}
            brandReputation={brandReputation}
          />
        </div>

        <DealActions
          deal={deal}
          displayDeal={displayDeal}
          isRevoked={isRevoked}
          hasNegotiated={hasNegotiated}
          negotiationState={negotiationState}
          handleAcceptDeal={handleAcceptDeal}
          handleNegotiationStart={handleNegotiationStart}
        />
      </div>
    )
  }
)
DealCard.displayName = 'DealCard'
