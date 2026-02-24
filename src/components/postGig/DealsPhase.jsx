import PropTypes from 'prop-types'

export const DealsPhase = ({ offers, onAccept, onSkip }) => (
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
      {offers.map((deal) => (
        <div key={deal.id} className='border-2 border-(--toxic-green) p-4 bg-(--void-black)/80 flex justify-between items-center group hover:bg-(--toxic-green)/10 transition-colors'>
          <div className='flex-1'>
            <div className='font-bold text-lg text-(--toxic-green)'>{deal.name}</div>
            <div className='text-xs text-(--ash-gray) italic mb-2'>{deal.description}</div>
            <div className='text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1 text-(--star-white)/80'>
              <div>💰 Upfront: {deal.offer.upfront}€</div>
              <div>📅 Duration: {deal.offer.duration} Gigs</div>
              {deal.offer.perGig && <div>💵 Per Gig: {deal.offer.perGig}€</div>}
              {deal.offer.item && <div>🎁 Item: {deal.offer.item}</div>}
              {deal.penalty && <div className='text-(--blood-red)'>⚠️ Risk: {JSON.stringify(deal.penalty)}</div>}
            </div>
          </div>
          <button
            onClick={() => onAccept(deal)}
            className='ml-4 px-4 py-2 bg-(--toxic-green) text-black font-bold uppercase hover:scale-105 transition-transform'
          >
            ACCEPT
          </button>
        </div>
      ))}
    </div>

    <div className='text-center mt-6'>
      <button
        onClick={onSkip}
        className='text-sm text-(--ash-gray) hover:text-(--star-white) underline decoration-dotted'
      >
        Reject All Offers & Continue &gt;
      </button>
    </div>
  </div>
)

DealsPhase.propTypes = {
  offers: PropTypes.array.isRequired,
  onAccept: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
}
