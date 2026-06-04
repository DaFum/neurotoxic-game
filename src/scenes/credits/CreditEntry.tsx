import React from 'react'
import { motion } from 'framer-motion'

type CreditEntryProps = {
  role: string
  name: string
  delay: number
}

/**
 * Renders the Credit Entry scene.
 * @param props - Credit role, credited name, and animation delay.
 */
export const CreditEntry = React.memo(
  ({ role, name, delay }: CreditEntryProps) => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className='flex flex-col gap-2'
      >
        <span className='text-ash-gray text-xs font-mono tracking-[0.4em] uppercase'>
          {role}
        </span>
        <span className='text-star-white text-2xl font-bold font-display tracking-wide'>
          {name}
        </span>
        <div className='w-16 h-px bg-ash-gray/20 mx-auto mt-2' />
      </motion.div>
    )
  }
)
CreditEntry.displayName = 'CreditEntry'
