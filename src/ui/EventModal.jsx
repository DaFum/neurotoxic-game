import React from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

export const EventModal = ({ event, onOptionSelect }) => {
  if (!event) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4'>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className='w-full max-w-lg border-2 border-[var(--toxic-green)] bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)] p-6'
      >
        <h2 className='text-3xl font-[Metal_Mania] text-[var(--blood-red)] mb-4 animate-pulse'>
          ⚠ {event.title} ⚠
        </h2>
        <p className='font-mono text-white mb-8 text-lg border-l-4 border-[var(--toxic-green)] pl-4'>
          {event.text}
        </p>

        <div className='flex flex-col gap-3'>
          {event.options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                if (option.action) option.action()
                else onOptionSelect(option)
              }}
              className='w-full text-left p-4 border border-[var(--ash-gray)] hover:bg-[var(--toxic-green)] hover:text-black hover:border-transparent transition-all group relative overflow-hidden'
            >
              <span className='relative z-10 font-bold uppercase tracking-wider'>
                {option.label}
              </span>
              {/* Scanline effect on hover */}
              <div className='absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite] skew-x-12' />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

EventModal.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        effect: PropTypes.object,
        skillCheck: PropTypes.object,
        outcomeText: PropTypes.string
      })
    ).isRequired
  }),
  onOptionSelect: PropTypes.func.isRequired
}
