import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { useDealNegotiation } from '../../hooks/useDealNegotiation'
import { DealCard } from './DealCard'
import { NegotiationModal } from './NegotiationModal'
import type { DealsPhaseProps } from '../../types/components'

const DealsPhaseComponent = ({ offers, onAccept, onSkip }: DealsPhaseProps) => {
  const { t } = useTranslation()
  const social = useGameSelector(state => state.social)

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
    <div className='space-y-4 sm:space-y-6'>
      <div className='text-center mb-2 sm:mb-4'>
        <h3 className='text-lg sm:text-xl font-mono tracking-widest text-warning-yellow break-words'>
          {t('ui:deals.incomingOffers', {
            defaultValue: 'INCOMING BRAND OFFERS'
          })}
        </h3>
        <div className='text-xs text-ash-gray tracking-wider mt-1'>
          {t('ui:deals.sellOutOrStayTrue', {
            defaultValue: 'SELL OUT OR STAY TRUE?'
          })}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:gap-4'>
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
          className='min-h-11 w-full sm:w-auto px-4 py-2 border border-ash-gray/40 text-sm text-ash-gray hover:text-star-white hover:border-star-white transition-colors'
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

/**
 * Renders available brand deals and the skip-deals control.
 * @param props - Brand offers plus accept and skip callbacks.
 */
export const DealsPhase = memo(DealsPhaseComponent)
