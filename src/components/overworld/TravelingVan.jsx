import React from 'react'
import { motion } from 'framer-motion'

export const TravelingVan = React.memo(({
  t,
  isTraveling,
  currentNode,
  travelTarget,
  vanUrl,
  travelCompletedRef,
  onTravelComplete
}) => {
  if (!isTraveling || !currentNode || !travelTarget) return null

  return (
    <motion.div
      className='absolute z-[60] pointer-events-none'
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
      <img
        src={vanUrl}
        alt={t('ui:overworld.traveling_van')}
        className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--color-toxic-green)]'
        style={{ transform: 'translate(0, -50%)' }}
      />
    </motion.div>
  )
})
