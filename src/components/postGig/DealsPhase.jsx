// TODO: Review this file
import PropTypes from 'prop-types'
import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState'
import { negotiateDeal } from '../../utils/socialEngine'
import { handleError } from '../../utils/errorHandler.js'
import { DealCard } from './DealCard'
import { NegotiationModal } from './NegotiationModal'

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

  const handleAcceptDeal = useCallback(
    async deal => {
      try {
        await onAccept(deal)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: t('ui:postGig.dealFailed')
        })
      }
    },
    [onAccept, addToast, t]
  )

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
        fallbackMessage: t('ui:postGig.negotiationFailed')
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
            brandReputation={social?.brandReputation}
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

      <NegotiationModal
        isOpen={negotiationModalOpen}
        onClose={() => !negotiationResult && setNegotiationModalOpen(false)}
        negotiationResult={negotiationResult}
        handleNegotiationSubmit={handleNegotiationSubmit}
      />
    </div>
  )
}

export const DealsPhase = memo(DealsPhaseComponent)

DealsPhase.propTypes = {
  offers: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
}
