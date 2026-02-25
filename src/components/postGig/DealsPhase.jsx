import PropTypes from 'prop-types'
import { useState } from 'react'
import { secureRandom } from '../../utils/crypto'
import { useGameState } from '../../context/GameState'

export const DealsPhase = ({ offers, onAccept, onSkip }) => {
  const { addToast } = useGameState()
  const [negotiatedDeals, setNegotiatedDeals] = useState({}) // id: true/false/deal

  const handleNegotiate = (deal) => {
    // Basic 50/50 chance
    const success = secureRandom() > 0.5
    if (success) {
      addToast('Negotiation successful! Better terms secured.', 'success')
      const betterDeal = {
        ...deal,
        offer: {
          ...deal.offer,
          upfront: Math.floor(deal.offer.upfront * 1.5)
        }
      }
      setNegotiatedDeals(prev => ({ ...prev, [deal.id]: betterDeal }))
    } else {
      addToast('Negotiation failed! Brand pulled the offer out of spite.', 'error')
      setNegotiatedDeals(prev => ({ ...prev, [deal.id]: 'FAILED' }))
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
          const status = negotiatedDeals[deal.id]
          const isFailed = status === 'FAILED'
          const displayDeal = (status && !isFailed) ? status : deal

          return (
            <div key={deal.id} className={`border-2 border-(--toxic-green) p-4 flex justify-between items-center group transition-colors ${isFailed ? 'bg-(--blood-red)/20 border-(--blood-red) grayscale opacity-50' : 'bg-(--void-black)/80 hover:bg-(--toxic-green)/10'}`}>
              <div className='flex-1'>
                <div className={`font-bold text-lg ${isFailed ? 'text-(--blood-red) line-through' : 'text-(--toxic-green)'}`}>{displayDeal.name}</div>
                <div className='text-xs text-(--ash-gray) italic mb-2'>{displayDeal.description}</div>
                <div className='text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1 text-(--star-white)/80'>
                  <div>💰 Upfront: {displayDeal.offer.upfront}€</div>
                  <div>📅 Duration: {displayDeal.offer.duration} Gigs</div>
                  {displayDeal.offer.perGig && <div>💵 Per Gig: {displayDeal.offer.perGig}€</div>}
                  {displayDeal.offer.item && <div>🎁 Item: {displayDeal.offer.item}</div>}
                  {displayDeal.penalty && <div className='text-(--blood-red)'>⚠️ Risk: {JSON.stringify(displayDeal.penalty)}</div>}
                </div>
              </div>
              
              <div className='flex flex-col gap-2 ml-4'>
                {!isFailed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onAccept(displayDeal)}
                      className='px-4 py-2 bg-(--toxic-green) text-(--void-black) font-bold uppercase hover:scale-105 transition-transform'
                    >
                      ACCEPT
                    </button>
                    {!status && (
                      <button
                        type="button"
                        onClick={() => handleNegotiate(deal)}
                        className='px-4 py-1.5 border border-(--warning-yellow) text-(--warning-yellow) text-xs font-bold uppercase hover:bg-(--warning-yellow) hover:text-(--void-black) transition-colors'
                      >
                        NEGOTIATE (RISK)
                      </button>
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
    </div>
  )
}

DealsPhase.propTypes = {
  offers: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
}
