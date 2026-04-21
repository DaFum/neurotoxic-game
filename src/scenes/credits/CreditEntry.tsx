/*
 * (#1) Actual Updates: Extracted CreditEntry component, wrapped in React.memo.


 */
import React from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

export const CreditEntry = React.memo(({ role, name, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className='flex flex-col gap-2'
    >
      <span className='text-ash-gray/60 text-[10px] font-mono tracking-[0.4em] uppercase'>
        {role}
      </span>
      <span className='text-star-white text-2xl font-bold font-[Metal_Mania] tracking-wide'>
        {name}
      </span>
      <div className='w-16 h-[1px] bg-ash-gray/20 mx-auto mt-2' />
    </motion.div>
  )
})
CreditEntry.displayName = 'CreditEntry'

CreditEntry.propTypes = {
  role: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  delay: PropTypes.number.isRequired
}
