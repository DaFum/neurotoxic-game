import React from 'react'
import { m } from 'motion/react'
import { FallbackImage } from '../../ui/shared/FallbackImage'
import type { TravelingVanProps } from '../../types/components'
import { nodeToPercentPosition } from '../../utils/mapUtils'
import { TRAVEL_ANIMATION_DURATION_MS } from '../../utils/travelUtils'

/**
 * Animates the player van between the current node and pending travel target.
 * @param props - Travel state, route endpoints, van image URL, completion guard ref, and completion callback.
 */
export const TravelingVan = React.memo(
  ({
    t,
    isTraveling,
    currentNode,
    travelTarget,
    vanUrl,
    travelCompletedRef,
    onTravelComplete
  }: TravelingVanProps) => {
    if (!isTraveling || !currentNode || !travelTarget) return null

    return (
      <m.div
        className='absolute z-(--z-chatter) pointer-events-none'
        initial={nodeToPercentPosition(currentNode)}
        animate={nodeToPercentPosition(travelTarget)}
        transition={{ duration: TRAVEL_ANIMATION_DURATION_MS / 1000, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (!travelCompletedRef.current) {
            onTravelComplete(travelTarget)
          }
        }}
      >
        <FallbackImage
          src={vanUrl}
          alt={t('ui:overworld.traveling_van', {
            defaultValue: 'Traveling Van'
          })}
          className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--color-toxic-green)]'
          style={{ transform: 'translate(0, -50%)' }}
        />
      </m.div>
    )
  }
)

TravelingVan.displayName = 'TravelingVan'
