import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

export const BandMembersLayer = memo(({
  matzeUrl,
  mariusUrl,
  larsUrl,
  setBandMemberRef
}) => {
  const { t } = useTranslation()

  return (
    <div
      className='absolute inset-0 pointer-events-none'
      style={{ zIndex: 'var(--z-crt)' }}
    >
      {/* Matze (Guitar) - Left */}
      <div
        id='band-member-0'
        ref={setBandMemberRef(0)}
        className='absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
      >
        <img
          src={matzeUrl}
          alt={t('minigame:bandMembers.matze', { defaultValue: 'Matze' })}
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
          src={mariusUrl}
          alt={t('minigame:bandMembers.marius', { defaultValue: 'Marius' })}
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
          src={larsUrl}
          alt={t('minigame:bandMembers.lars', { defaultValue: 'Lars' })}
          className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-toxic-green)]'
        />
      </div>
    </div>
  )
})

BandMembersLayer.displayName = 'BandMembersLayer'

BandMembersLayer.propTypes = {
  matzeUrl: PropTypes.string.isRequired,
  mariusUrl: PropTypes.string.isRequired,
  larsUrl: PropTypes.string.isRequired,
  setBandMemberRef: PropTypes.func.isRequired
}
