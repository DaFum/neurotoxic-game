import PropTypes from 'prop-types'

export const BandMembersLayer = ({
  matzeUrl,
  MariusUrl,
  LarsUrl,
  setBandMemberRef
}) => {
  return (
    <div className='absolute inset-0 z-10 pointer-events-none'>
      {/* Matze (Guitar) - Left */}
      <div
        id='band-member-0'
        ref={setBandMemberRef(0)}
        className='absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
      >
        <img
          src={matzeUrl}
          alt='Matze'
          className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-blood-red)]'
        />
      </div>
      {/* Marius (Drums) - Center Back */}
      <div
        id='band-member-1'
        ref={setBandMemberRef(1)}
        className='absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100'
      >
        <img
          src={MariusUrl}
          alt='Marius'
          className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-toxic-green-glow)]'
        />
      </div>
      {/* Lars (Bass) - Right */}
      <div
        id='band-member-2'
        ref={setBandMemberRef(2)}
        className='absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
      >
        <img
          src={LarsUrl}
          alt='Lars'
          className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-toxic-green)]'
        />
      </div>
    </div>
  )
}

BandMembersLayer.propTypes = {
  matzeUrl: PropTypes.string.isRequired,
  MariusUrl: PropTypes.string.isRequired,
  LarsUrl: PropTypes.string.isRequired,
  setBandMemberRef: PropTypes.func.isRequired
}
