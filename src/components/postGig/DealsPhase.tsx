import PropTypes from 'prop-types'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState'
import { useDealNegotiation } from '../../hooks/useDealNegotiation'
import { DealCard } from './DealCard'
import { NegotiationModal } from './NegotiationModal'
import type { DealsPhaseProps } from '../../types/components'

const DealsPhaseComponent = ({ offers, onAccept, onSkip }: DealsPhaseProps) => {
  const { t } = useTranslation()
  const { social } = useGameState()

  const {
    negotiatedDeals,
    negotiationModalOpen,
    setNegotiationModalOpen,
    negotiationResult,
    handleNegotiationStart,
    handleAcceptDeal,
    handleNegotiationSubmit
  } = useDealNegotiation({ onAccept })

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
