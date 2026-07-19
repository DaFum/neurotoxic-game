import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FallbackImage } from '../../../ui/shared/FallbackImage'
import type { BandMembersLayerProps } from '../../../types/components'

/**
 * Positions the rendered band member images over the rhythm stage.
 * @param props - Band member image URLs and ref registration callback.
 */
export const BandMembersLayer = memo(
  ({
    matzeUrl,
    mariusUrl,
    larsUrl,
    setBandMemberRef
  }: BandMembersLayerProps) => {
    const { t } = useTranslation()

    return (
      <div className='absolute inset-0 z-(--z-base) pointer-events-none'>
        {/* Matze (Guitar) - Left */}
        <div
          id='band-member-0'
          ref={setBandMemberRef(0)}
          className='absolute left-1/10 sm:left-1/6 top-1/3 sm:top-1/3 w-20 h-32 sm:w-32 sm:h-48 transition-transform duration-100'
        >
          <FallbackImage
            src={matzeUrl}
            alt={t('minigame:bandMembers.matze', { defaultValue: 'Matze' })}
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-blood-red)]'
          />
        </div>
        {/* Marius (Drums) - Center Back */}
        <div
          id='band-member-1'
          ref={setBandMemberRef(1)}
          className='absolute left-1/2 top-1/5 sm:top-1/5 -translate-x-1/2 w-24 h-24 sm:w-40 sm:h-40 transition-transform duration-100'
        >
          <FallbackImage
            src={mariusUrl}
            alt={t('minigame:bandMembers.marius', { defaultValue: 'Marius' })}
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-toxic-green-glow)]'
          />
        </div>
        {/* Lars (Bass) - Right */}
        <div
          id='band-member-2'
          ref={setBandMemberRef(2)}
          className='absolute right-1/10 sm:right-1/6 top-1/3 sm:top-1/3 w-20 h-32 sm:w-32 sm:h-48 transition-transform duration-100'
        >
          <FallbackImage
            src={larsUrl}
            alt={t('minigame:bandMembers.lars', { defaultValue: 'Lars' })}
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--color-toxic-green)]'
          />
        </div>
      </div>
    )
  }
)

BandMembersLayer.displayName = 'BandMembersLayer'
