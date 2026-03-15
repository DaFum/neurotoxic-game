import PropTypes from 'prop-types'
import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState'
import { negotiateDeal } from '../../utils/socialEngine'
import { Modal, ActionButton } from '../../ui/shared'
import { BRAND_ALIGNMENTS } from '../../context/initialState'
import { handleError } from '../../utils/errorHandler.js'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen.js'

const getAlignmentImagePrompt = alignment => {
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

const getAlignmentBadge = alignment => {
  switch (alignment) {
    case BRAND_ALIGNMENTS.EVIL:
      return '😈 EVIL'
    case BRAND_ALIGNMENTS.CORPORATE:
      return '🏢 CORP'
    case BRAND_ALIGNMENTS.INDIE:
      return '🎸 INDIE'
    case BRAND_ALIGNMENTS.SUSTAINABLE:
      return '🌱 ECO'
    default:
      return '❓ UNKNOWN'
  }
}

const getAlignmentColor = alignment => {
  switch (alignment) {
    case BRAND_ALIGNMENTS.EVIL:
      return 'text-toxic-green'
    case BRAND_ALIGNMENTS.CORPORATE:
      return 'text-electric-blue'
    case BRAND_ALIGNMENTS.INDIE:
      return 'text-hot-pink'
    case BRAND_ALIGNMENTS.SUSTAINABLE:
      return 'text-warning-yellow'
    default:
      return 'text-ash-gray'
  }
}

const DealCard = memo(({
  deal,
  negotiationState,
  social,
  handleAcceptDeal,
  handleNegotiationStart
}) => {
  const { t } = useTranslation()
  const isRevoked = negotiationState?.status === 'REVOKED'
  const displayDeal = negotiationState?.deal || deal
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
        <div className='shrink-0 w-24 h-24 border border-current opacity-80 overflow-hidden'>
          <img
            src={getGenImageUrl(getAlignmentImagePrompt(displayDeal.alignment))}
            alt={displayDeal.name}
            className='w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-300'
            loading='lazy'
          />
        </div>
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
            {displayDeal.offer.perGig && (
              <div>
                💵 {t('ui:deals.perGig', { defaultValue: 'Per Gig' })}:{' '}
                {displayDeal.offer.perGig}€
              </div>
            )}
            {displayDeal.offer.item && (
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
          {social.brandReputation?.[displayDeal.alignment] !== undefined && (
            <div className='mt-2 text-[10px] text-ash-gray'>
              {t('ui:deals.reputation', { defaultValue: 'Reputation' })}:{' '}
              <span
                className={
                  social.brandReputation[displayDeal.alignment] > 0
                    ? 'text-toxic-green'
                    : 'text-blood-red'
                }
              >
                {social.brandReputation[displayDeal.alignment]}
              </span>
            </div>
          )}
        </div>
      </div>

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
                className={`text-center text-[10px] font-mono tracking-wider ${negotiationState.status === 'SUCCESS' ? 'text-toxic-green' : 'text-warning-yellow'}`}
              >
                {negotiationState.status === 'SUCCESS'
                  ? t('ui:deals.termImproved', {
                      defaultValue: 'TERM IMPROVED'
                    })
                  : negotiationState.status === 'WORSENED'
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
    </div>
  )
})

DealCard.propTypes = {
  deal: PropTypes.object.isRequired,
  negotiationState: PropTypes.object,
  social: PropTypes.object.isRequired,
  handleAcceptDeal: PropTypes.func.isRequired,
  handleNegotiationStart: PropTypes.func.isRequired
}

const DealsPhaseComponent = ({ offers, onAccept, onSkip }) => {
  const { t } = useTranslation()
  const { player, band, social, addToast } = useGameState()
  const [negotiatedDeals, setNegotiatedDeals] = useState({}) // id: { status, deal }

  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [negotiationResult, setNegotiationResult] = useState(null) // To show result in modal before closing
  const negotiationTimerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (negotiationTimerRef.current) {
        clearTimeout(negotiationTimerRef.current)
      }
    }
  }, [])

  const handleNegotiationStart = useCallback(deal => {
    setSelectedDeal(deal)
    setNegotiationResult(null)
    setNegotiationModalOpen(true)
  }, [])

  const handleAcceptDeal = useCallback(async deal => {
    try {
      await onAccept(deal)
    } catch (error) {
      handleError(error, {
        addToast,
        fallbackMessage: 'Deal failed'
      })
    }
  }, [onAccept, addToast])

  const handleNegotiationSubmit = strategy => {
    if (!selectedDeal) return

    try {
      const gameState = { player, band, social }
      const result = negotiateDeal(selectedDeal, strategy, gameState)

      setNegotiationResult(result)

      if (result.status === 'REVOKED') {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'REVOKED', deal: null }
        }))
        addToast(result.feedback, 'error')
      } else if (result.status === 'FAILED') {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'FAILED', deal: selectedDeal }
        }))
        addToast(result.feedback, 'warning')
      } else if (result.success) {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'SUCCESS', deal: result.deal }
        }))
        addToast(result.feedback, 'success')
      } else {
        // Accepted but worse terms (Persuasive fail)
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'WORSENED', deal: result.deal }
        }))
        addToast(result.feedback, 'warning')
      }

      // Delay closing to let user see result?
      // Or just close and let the toast/UI update handle it.
      // Let's keep modal open for a second or show a "Continue" button in modal if we want.
      // For now, let's just close it after a short delay or immediately.
      if (negotiationTimerRef.current) {
        clearTimeout(negotiationTimerRef.current)
      }
      negotiationTimerRef.current = setTimeout(() => {
        setNegotiationModalOpen(false)
        setSelectedDeal(null)
      }, 1500)
    } catch (error) {
      handleError(error, {
        addToast,
        fallbackMessage: 'Negotiation failed unexpectedly.'
      })
      // Close modal on error to prevent stuck state
      setNegotiationModalOpen(false)
      setSelectedDeal(null)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='text-center mb-4'>
        <h3 className='text-xl font-mono tracking-widest text-warning-yellow'>
          {t('ui:deals.incomingOffers', {
            defaultValue: 'INCOMING BRAND OFFERS'
          })}
        </h3>
        <div className='text-[10px] text-ash-gray tracking-wider mt-1'>
          {t('ui:deals.sellOutOrStayTrue', {
            defaultValue: 'SELL OUT OR STAY TRUE?'
          })}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {offers.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            negotiationState={negotiatedDeals[deal.id]}
            social={social}
            handleAcceptDeal={handleAcceptDeal}
            handleNegotiationStart={handleNegotiationStart}
          />
        ))}
      </div>

      <div className='text-center mt-6'>
        <button
          type='button'
          onClick={onSkip}
          className='text-sm text-ash-gray hover:text-star-white underline decoration-dotted'
        >
          {t('ui:deals.rejectAll', {
            defaultValue: 'Reject All Offers & Continue >'
          })}
        </button>
      </div>

      {/* Negotiation Modal */}
      <Modal
        isOpen={negotiationModalOpen}
        onClose={() => !negotiationResult && setNegotiationModalOpen(false)} // Prevent closing if showing result
        title={t('ui:deals.negotiationTactics', {
          defaultValue: 'NEGOTIATION TACTICS'
        })}
      >
        {!negotiationResult ? (
          <div className='space-y-4'>
            <p className='text-sm text-ash-gray text-center mb-4'>
              {t('ui:deals.chooseApproach', {
                defaultValue:
                  'Choose your approach. Your fame and traits affect the outcome.'
              })}
            </p>

            <button
              type='button'
              onClick={() => handleNegotiationSubmit('SAFE')}
              className='w-full p-3 border border-toxic-green hover:bg-toxic-green/20 text-left group transition-all'
            >
              <div className='text-toxic-green font-bold mb-1'>
                {t('ui:deals.safe', { defaultValue: 'SAFE (Low Risk)' })}
              </div>
              <div className='text-xs text-ash-gray group-hover:text-star-white'>
                {t('ui:deals.safeDesc', {
                  defaultValue:
                    'Attempt to get +10% upfront. High chance of success.'
                })}
              </div>
            </button>

            <button
              type='button'
              onClick={() => handleNegotiationSubmit('PERSUASIVE')}
              className='w-full p-3 border border-electric-blue hover:bg-electric-blue/20 text-left group transition-all'
            >
              <div className='text-electric-blue font-bold mb-1'>
                {t('ui:deals.persuasive', {
                  defaultValue: 'PERSUASIVE (Medium Risk)'
                })}
              </div>
              <div className='text-xs text-ash-gray group-hover:text-star-white'>
                {t('ui:deals.persuasiveDesc', {
                  defaultValue:
                    'Try for +20% upfront & +10% per gig. Failure worsens terms (-10%).'
                })}
              </div>
            </button>

            <button
              type='button'
              onClick={() => handleNegotiationSubmit('AGGRESSIVE')}
              className='w-full p-3 border border-blood-red hover:bg-blood-red/20 text-left group transition-all'
            >
              <div className='text-blood-red font-bold mb-1'>
                {t('ui:deals.aggressive', {
                  defaultValue: 'AGGRESSIVE (High Risk)'
                })}
              </div>
              <div className='text-xs text-ash-gray group-hover:text-star-white'>
                {t('ui:deals.aggressiveDesc', {
                  defaultValue:
                    'Demand +50% upfront. Failure loses the deal completely.'
                })}
              </div>
            </button>
          </div>
        ) : (
          <div className='text-center py-6'>
            <div
              className={`text-4xl mb-4 ${negotiationResult.success ? 'text-toxic-green' : 'text-blood-red'}`}
            >
              {negotiationResult.success
                ? t('ui:deals.success', { defaultValue: 'SUCCESS!' })
                : t('ui:deals.failure', { defaultValue: 'FAILURE' })}
            </div>
            <div className='text-lg font-bold text-star-white mb-2'>
              {negotiationResult.feedback}
            </div>
            {negotiationResult.status === 'REVOKED' && (
              <div className='text-blood-red font-mono uppercase tracking-widest mt-4'>
                {t('ui:deals.dealLost', { defaultValue: 'DEAL LOST' })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export const DealsPhase = memo(DealsPhaseComponent)

DealsPhase.propTypes = {
  offers: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
}
