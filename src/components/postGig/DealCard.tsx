/**
 * (#1) Actual Updates:
 * - Extracted subcomponents (`DealImage`, `DealInfo`, `DealActions`) from the main `DealCard` component.
 * - Reduced complexity and overall length of the `DealCard` render function.
 *
 * (#2) Next Steps:
 * - Check if other complex cards in the DealsPhase or SocialPhase can benefit from similar granular extraction.
 *
 * (#3) Found Errors + Solutions:
 * - Complexity was getting high due to multiple conditionals and inline rendering logic. Solution: Used `memo()` wrapper on new granular display components and moved their relevant prop types to themselves.
 */
import PropTypes from 'prop-types'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { BRAND_ALIGNMENTS } from '../../context/initialState'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'
import type {
  DealImageProps,
  DealInfoProps,
  DealActionsProps,
  DealCardProps
} from '../../types/components'

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

const getAlignmentImagePrompt = (alignment?: string) => {
  switch (alignment) {
    case BRAND_ALIGNMENTS.EVIL:
      return IMG_PROMPTS.BRAND_DEAL_EVIL
    case BRAND_ALIGNMENTS.CORPORATE:
      return IMG_PROMPTS.BRAND_DEAL_CORPORATE
    case BRAND_ALIGNMENTS.INDIE:
      return IMG_PROMPTS.BRAND_DEAL_INDIE
    case BRAND_ALIGNMENTS.SUSTAINABLE:
      return IMG_PROMPTS.BRAND_DEAL_SUSTAINABLE
    default:
      return IMG_PROMPTS.SOCIAL_POST_COMMERCIAL
  }
}

const getAlignmentBadge = (alignment?: string) => {
  switch (alignment) {
    case BRAND_ALIGNMENTS.EVIL:
      return '😈 EVIL'
    case BRAND_ALIGNMENTS.CORPORATE:
      return '🏢 CORP'
    case BRAND_ALIGNMENTS.INDIE:
      return '🎸 INDIE'
    case BRAND_ALIGNMENTS.SUSTAINABLE:
      return '🌱 ECO'
    case BRAND_ALIGNMENTS.GOOD:
      return '🕊️ GOOD'
    case BRAND_ALIGNMENTS.NEUTRAL:
      return '⚖️ NEUTRAL'
    default:
      return '❓ UNKNOWN'
  }
}

const getAlignmentColor = (alignment?: string) => {
  switch (alignment) {
    case BRAND_ALIGNMENTS.EVIL:
      return 'text-toxic-green'
    case BRAND_ALIGNMENTS.CORPORATE:
      return 'text-electric-blue'
    case BRAND_ALIGNMENTS.INDIE:
      return 'text-hot-pink'
    case BRAND_ALIGNMENTS.SUSTAINABLE:
      return 'text-warning-yellow'
    case BRAND_ALIGNMENTS.GOOD:
      return 'text-pure-white'
    case BRAND_ALIGNMENTS.NEUTRAL:
      return 'text-ash-gray'
    default:
      return 'text-ash-gray'
  }
}

const DealImage = memo(({ alignment, name }: DealImageProps) => (
  <div className='shrink-0 w-24 h-24 border border-current opacity-80 overflow-hidden'>
    <img
      src={getGenImageUrl(getAlignmentImagePrompt(alignment))}
      alt={name}
      className='w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-300'
      loading='lazy'
    />
  </div>
))
DealImage.displayName = 'DealImage'
DealImage.propTypes = {
  alignment: PropTypes.string,
  name: PropTypes.string.isRequired
}

const DealInfo = memo(
  ({ displayDeal, isRevoked, brandReputation }: DealInfoProps) => {
    const { t } = useTranslation()
    const alignment = displayDeal.alignment
    const alignmentReputation =
      alignment != null ? brandReputation?.[alignment] : undefined

    return (
      <div className='flex-1'>
        <div className='flex items-baseline gap-3'>
          <div
            className={`font-bold text-lg ${isRevoked ? 'text-blood-red line-through' : 'text-toxic-green'}`}
          >
            {displayDeal.name}
          </div>
          {displayDeal.alignment && (
            <span
              className={`text-[10px] font-mono border border-current px-1 rounded ${getAlignmentColor(displayDeal.alignment)}`}
            >
              {getAlignmentBadge(displayDeal.alignment)}
            </span>
          )}
        </div>

        <div className='text-xs text-ash-gray italic mb-2'>
          {displayDeal.description}
        </div>
        <div className='text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1 text-star-white/80'>
          <div>
            💰 {t('ui:deals.upfront', { defaultValue: 'Upfront' })}:{' '}
            {displayDeal.offer.upfront}€
          </div>
          <div>
            📅 {t('ui:deals.duration', { defaultValue: 'Duration' })}:{' '}
            {displayDeal.offer.duration}{' '}
            {t('ui:deals.gigs', { defaultValue: 'Gigs' })}
          </div>
          {displayDeal.offer.perGig != null && (
            <div>
              💵 {t('ui:deals.perGig', { defaultValue: 'Per Gig' })}:{' '}
              {displayDeal.offer.perGig}€
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
          <div className='mt-2 text-[10px] text-ash-gray'>
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
DealInfo.propTypes = {
  displayDeal: PropTypes.object.isRequired,
  isRevoked: PropTypes.bool,
  brandReputation: PropTypes.object
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
      <div className='flex flex-col gap-2 ml-4 z-10 min-w-[140px]'>
        {!isRevoked ? (
          <>
            <ActionButton
              onClick={() => handleAcceptDeal(displayDeal)}
              className='bg-toxic-green text-void-black font-bold uppercase hover:scale-105'
            >
              {t('ui:deals.accept', { defaultValue: 'ACCEPT' })}
            </ActionButton>
            {!hasNegotiated && (
              <button
                type='button'
                onClick={() => handleNegotiationStart(deal)}
                className='px-4 py-1.5 border border-warning-yellow text-warning-yellow text-xs font-bold uppercase hover:bg-warning-yellow hover:text-void-black transition-colors'
              >
                {t('ui:deals.negotiate', { defaultValue: 'NEGOTIATE' })}
              </button>
            )}
            {hasNegotiated && (
              <div
                className={`text-center text-[10px] font-mono tracking-wider ${negotiationStatus === 'SUCCESS' ? 'text-toxic-green' : 'text-warning-yellow'}`}
              >
                {negotiationStatus === 'SUCCESS'
                  ? t('ui:deals.termImproved', {
                      defaultValue: 'TERM IMPROVED'
                    })
                  : negotiationStatus === 'WORSENED'
                    ? t('ui:deals.termsWorsened', {
                        defaultValue: 'TERMS WORSENED'
                      })
                    : t('ui:deals.negotiationFailed', {
                        defaultValue: 'NEGOTIATION FAILED'
                      })}
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
DealActions.propTypes = {
  deal: PropTypes.object.isRequired,
  displayDeal: PropTypes.object.isRequired,
  isRevoked: PropTypes.bool,
  hasNegotiated: PropTypes.bool,
  negotiationState: PropTypes.object,
  handleAcceptDeal: PropTypes.func.isRequired,
  handleNegotiationStart: PropTypes.func.isRequired
}

export const DealCard = memo(
  ({
    deal,
    negotiationState,
    brandReputation,
    handleAcceptDeal,
    handleNegotiationStart
  }: DealCardProps) => {
    const isRevoked = negotiationState?.status === 'REVOKED'
    const negotiatedDeal = negotiationState?.deal as DealCardProps['deal'] | undefined
    const displayDeal = negotiatedDeal ?? deal
    const hasNegotiated = !!negotiationState

    return (
      <div
        className={`border-2 border-toxic-green p-4 flex justify-between items-center group transition-colors relative overflow-hidden ${isRevoked ? 'bg-blood-red/20 border-blood-red grayscale opacity-50' : 'bg-void-black/80 hover:bg-toxic-green/10'}`}
      >
        {/* Background Alignment Watermark */}
        <div
          className={`absolute -right-4 -bottom-4 text-9xl opacity-5 font-black pointer-events-none select-none ${getAlignmentColor(displayDeal.alignment)}`}
        >
          {displayDeal.alignment?.[0]}
        </div>

        <div className='flex-1 z-10 flex gap-4 items-start'>
          <DealImage
            alignment={displayDeal.alignment}
            name={displayDeal.name}
          />
          <DealInfo
            displayDeal={displayDeal}
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

DealCard.propTypes = {
  deal: PropTypes.object.isRequired,
  negotiationState: PropTypes.object,
  brandReputation: PropTypes.object,
  handleAcceptDeal: PropTypes.func.isRequired,
  handleNegotiationStart: PropTypes.func.isRequired
}
