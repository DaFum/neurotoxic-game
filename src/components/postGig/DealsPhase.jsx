import PropTypes from 'prop-types'
import { useState, useCallback } from 'react'
import { useGameState } from '../../context/GameState'
import { negotiateDeal } from '../../utils/socialEngine'
import { Modal, ActionButton } from '../../ui/shared'
import { BRAND_ALIGNMENTS } from '../../context/initialState'

export const DealsPhase = ({ offers, onAccept, onSkip }) => {
  const { player, band, social, addToast } = useGameState()
  const [negotiatedDeals, setNegotiatedDeals] = useState({}) // id: { status, deal }

  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [negotiationResult, setNegotiationResult] = useState(null) // To show result in modal before closing

  const handleNegotiationStart = (deal) => {
    setSelectedDeal(deal)
    setNegotiationResult(null)
    setNegotiationModalOpen(true)
  }

  const handleNegotiationSubmit = (strategy) => {
    if (!selectedDeal) return

    const gameState = { player, band, social }
    const result = negotiateDeal(selectedDeal, strategy, gameState)

    setNegotiationResult(result)

    if (result.status === 'REVOKED') {
      setNegotiatedDeals(prev => ({ ...prev, [selectedDeal.id]: { status: 'REVOKED', deal: null } }))
      addToast(result.feedback, 'error')
    } else if (result.status === 'FAILED') {
      setNegotiatedDeals(prev => ({ ...prev, [selectedDeal.id]: { status: 'FAILED', deal: selectedDeal } }))
      addToast(result.feedback, 'warning')
    } else if (result.success) {
      setNegotiatedDeals(prev => ({ ...prev, [selectedDeal.id]: { status: 'SUCCESS', deal: result.deal } }))
      addToast(result.feedback, 'success')
    } else {
      // Accepted but worse terms (Persuasive fail)
      setNegotiatedDeals(prev => ({ ...prev, [selectedDeal.id]: { status: 'WORSENED', deal: result.deal } }))
      addToast(result.feedback, 'warning')
    }

    // Delay closing to let user see result?
    // Or just close and let the toast/UI update handle it.
    // Let's keep modal open for a second or show a "Continue" button in modal if we want.
    // For now, let's just close it after a short delay or immediately.
    setTimeout(() => {
        setNegotiationModalOpen(false)
        setSelectedDeal(null)
    }, 1500)
  }

  const getAlignmentBadge = (alignment) => {
    switch (alignment) {
      case BRAND_ALIGNMENTS.EVIL: return '😈 EVIL'
      case BRAND_ALIGNMENTS.CORPORATE: return '🏢 CORP'
      case BRAND_ALIGNMENTS.INDIE: return '🎸 INDIE'
      case BRAND_ALIGNMENTS.SUSTAINABLE: return '🌱 ECO'
      default: return '❓ UNKNOWN'
    }
  }

  const getAlignmentColor = (alignment) => {
    switch (alignment) {
      case BRAND_ALIGNMENTS.EVIL: return 'text-(--toxic-green)'
      case BRAND_ALIGNMENTS.CORPORATE: return 'text-(--electric-blue)'
      case BRAND_ALIGNMENTS.INDIE: return 'text-(--hot-pink)'
      case BRAND_ALIGNMENTS.SUSTAINABLE: return 'text-(--warning-yellow)'
      default: return 'text-(--ash-gray)'
    }
  }

  return (
    <div className='space-y-6'>
      <div className='text-center mb-4'>
        <h3 className='text-xl font-mono tracking-widest text-(--warning-yellow)'>
          INCOMING BRAND OFFERS
        </h3>
        <div className='text-[10px] text-(--ash-gray) tracking-wider mt-1'>
          SELL OUT OR STAY TRUE?
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {offers.map((deal) => {
          const negotiationState = negotiatedDeals[deal.id]
          const isRevoked = negotiationState?.status === 'REVOKED'
          const displayDeal = negotiationState?.deal || deal
          const hasNegotiated = !!negotiationState

          return (
            <div key={deal.id} className={`border-2 border-(--toxic-green) p-4 flex justify-between items-center group transition-colors relative overflow-hidden ${isRevoked ? 'bg-(--blood-red)/20 border-(--blood-red) grayscale opacity-50' : 'bg-(--void-black)/80 hover:bg-(--toxic-green)/10'}`}>

               {/* Background Alignment Watermark */}
               <div className={`absolute -right-4 -bottom-4 text-9xl opacity-5 font-black pointer-events-none select-none ${getAlignmentColor(displayDeal.alignment)}`}>
                 {displayDeal.alignment?.[0]}
               </div>

              <div className='flex-1 z-10'>
                <div className='flex items-baseline gap-3'>
                    <div className={`font-bold text-lg ${isRevoked ? 'text-(--blood-red) line-through' : 'text-(--toxic-green)'}`}>{displayDeal.name}</div>
                    {displayDeal.alignment && (
                        <span className={`text-[10px] font-mono border border-current px-1 rounded ${getAlignmentColor(displayDeal.alignment)}`}>
                            {getAlignmentBadge(displayDeal.alignment)}
                        </span>
                    )}
                </div>

                <div className='text-xs text-(--ash-gray) italic mb-2'>{displayDeal.description}</div>
                <div className='text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1 text-(--star-white)/80'>
                  <div>💰 Upfront: {displayDeal.offer.upfront}€</div>
                  <div>📅 Duration: {displayDeal.offer.duration} Gigs</div>
                  {displayDeal.offer.perGig && <div>💵 Per Gig: {displayDeal.offer.perGig}€</div>}
                  {displayDeal.offer.item && <div>🎁 Item: {displayDeal.offer.item}</div>}
                  {displayDeal.penalty && <div className='text-(--blood-red)'>⚠️ Risk: {JSON.stringify(displayDeal.penalty)}</div>}
                </div>

                {/* Reputation Status */}
                {social.brandReputation?.[displayDeal.alignment] !== undefined && (
                   <div className='mt-2 text-[10px] text-(--ash-gray)'>
                      Reputation: <span className={social.brandReputation[displayDeal.alignment] > 0 ? 'text-(--toxic-green)' : 'text-(--blood-red)'}>{social.brandReputation[displayDeal.alignment]}</span>
                   </div>
                )}
              </div>
              
              <div className='flex flex-col gap-2 ml-4 z-10 min-w-[140px]'>
                {!isRevoked ? (
                  <>
                    <ActionButton
                      onClick={() => onAccept(displayDeal)}
                      className='bg-(--toxic-green) text-(--void-black) font-bold uppercase hover:scale-105'
                    >
                      ACCEPT
                    </ActionButton>
                    {!hasNegotiated && (
                      <button
                        type="button"
                        onClick={() => handleNegotiationStart(deal)}
                        className='px-4 py-1.5 border border-(--warning-yellow) text-(--warning-yellow) text-xs font-bold uppercase hover:bg-(--warning-yellow) hover:text-(--void-black) transition-colors'
                      >
                        NEGOTIATE
                      </button>
                    )}
                    {hasNegotiated && (
                        <div className={`text-center text-[10px] font-mono tracking-wider ${negotiationState.status === 'SUCCESS' ? 'text-(--toxic-green)' : 'text-(--warning-yellow)'}`}>
                            {negotiationState.status === 'SUCCESS' ? 'TERM IMPROVED' : negotiationState.status === 'WORSENED' ? 'TERMS WORSENED' : 'NEGOTIATION FAILED'}
                        </div>
                    )}
                  </>
                ) : (
                  <div className='text-(--blood-red) font-bold font-mono text-center tracking-widest'>
                    REVOKED
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className='text-center mt-6'>
        <button
          type="button"
          onClick={onSkip}
          className='text-sm text-(--ash-gray) hover:text-(--star-white) underline decoration-dotted'
        >
          Reject All Offers & Continue &gt;
        </button>
      </div>

      {/* Negotiation Modal */}
      <Modal
        isOpen={negotiationModalOpen}
        onClose={() => !negotiationResult && setNegotiationModalOpen(false)} // Prevent closing if showing result
        title="NEGOTIATION TACTICS"
      >
        {!negotiationResult ? (
            <div className='space-y-4'>
                <p className='text-sm text-(--ash-gray) text-center mb-4'>
                    Choose your approach. Your fame and traits affect the outcome.
                </p>

                <button
                    onClick={() => handleNegotiationSubmit('SAFE')}
                    className='w-full p-3 border border-(--toxic-green) hover:bg-(--toxic-green)/20 text-left group transition-all'
                >
                    <div className='text-(--toxic-green) font-bold mb-1'>SAFE (Low Risk)</div>
                    <div className='text-xs text-(--ash-gray) group-hover:text-(--star-white)'>
                        Attempt to get +10% upfront. High chance of success.
                    </div>
                </button>

                <button
                    onClick={() => handleNegotiationSubmit('PERSUASIVE')}
                    className='w-full p-3 border border-(--electric-blue) hover:bg-(--electric-blue)/20 text-left group transition-all'
                >
                    <div className='text-(--electric-blue) font-bold mb-1'>PERSUASIVE (Medium Risk)</div>
                    <div className='text-xs text-(--ash-gray) group-hover:text-(--star-white)'>
                        Try for +20% upfront & +10% per gig. Failure worsens terms (-10%).
                    </div>
                </button>

                <button
                    onClick={() => handleNegotiationSubmit('AGGRESSIVE')}
                    className='w-full p-3 border border-(--blood-red) hover:bg-(--blood-red)/20 text-left group transition-all'
                >
                    <div className='text-(--blood-red) font-bold mb-1'>AGGRESSIVE (High Risk)</div>
                    <div className='text-xs text-(--ash-gray) group-hover:text-(--star-white)'>
                        Demand +50% upfront. Failure loses the deal completely.
                    </div>
                </button>
            </div>
        ) : (
            <div className='text-center py-6'>
                <div className={`text-4xl mb-4 ${negotiationResult.success ? 'text-(--toxic-green)' : 'text-(--blood-red)'}`}>
                    {negotiationResult.success ? 'SUCCESS!' : 'FAILURE'}
                </div>
                <div className='text-lg font-bold text-(--star-white) mb-2'>
                    {negotiationResult.feedback}
                </div>
                {negotiationResult.status === 'REVOKED' && (
                    <div className='text-(--blood-red) font-mono uppercase tracking-widest mt-4'>
                        DEAL LOST
                    </div>
                )}
            </div>
        )}
      </Modal>
    </div>
  )
}

DealsPhase.propTypes = {
  offers: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
}
