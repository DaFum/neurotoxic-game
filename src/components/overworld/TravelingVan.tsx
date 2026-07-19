import React from 'react'
import { motion } from 'framer-motion'
import { FallbackImage } from '../../ui/shared/FallbackImage'
import type { TravelingVanProps } from '../../types/components'

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
      <motion.div
        className='absolute z-(--z-chatter) pointer-events-none'
        initial={{
          left: `${currentNode.x}%`,
          top: `${currentNode.y}%`
        }}
        animate={{
          left: `${travelTarget.x}%`,
          top: `${travelTarget.y}%`
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
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
      </motion.div>
    )
  }
)

TravelingVan.displayName = 'TravelingVan'
