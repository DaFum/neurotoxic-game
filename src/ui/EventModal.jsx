import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

/**
 * A modal dialog for displaying game events and capturing player choices.
 * Traps focus, supports keyboard selection (1-4 number keys), and
 * provides visual hints for option effects.
 * @param {object} props
 * @param {object} props.event - The active event object.
 * @param {Function} props.onOptionSelect - Callback when an option is selected.
 */
export const EventModal = ({ event, onOptionSelect, className = '' }) => {
  const containerRef = useRef(null)

  // Keyboard shortcut: press 1-4 to select options
  useEffect(() => {
    if (!event) return

    const handleKey = e => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= event.options.length) {
        const option = event.options[num - 1]
        if (option.action) option.action()
        else onOptionSelect(option)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [event, onOptionSelect])

  // Auto-focus container for screen readers
  useEffect(() => {
    containerRef.current?.focus()
  }, [event])

  if (!event) return null

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role='dialog'
      aria-modal='true'
      aria-labelledby='event-title'
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-(--void-black)/80 backdrop-blur-sm p-4 ${className}`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className='w-full max-w-lg border-2 border-(--toxic-green) bg-(--void-black) shadow-[0_0_50px_var(--toxic-green-glow)] p-6'
      >
        <h2
          id='event-title'
          className='text-3xl font-[Metal_Mania] text-(--blood-red) mb-4 animate-pulse'
        >
          {'\u26A0'} {event.title} {'\u26A0'}
        </h2>
        <p className='font-mono text-(--star-white) mb-6 text-lg border-l-4 border-(--toxic-green) pl-4'>
          {event.description}
        </p>

        {/* Keyboard hint */}
        <p className='text-[10px] text-(--ash-gray) font-mono mb-3 uppercase tracking-widest'>
          Press [1-{event.options.length}] or click to choose
        </p>

        <motion.div
          className='flex flex-col gap-3'
          initial='hidden'
          animate='visible'
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {event.options.map((option, index) => (
            <motion.button
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
              key={index}
              onClick={() => {
                if (option.action) option.action()
                else onOptionSelect(option)
              }}
              className='w-full text-left p-4 border border-(--ash-gray) hover:bg-(--toxic-green) hover:text-(--void-black) hover:border-transparent transition-all group relative overflow-hidden'
            >
              <div className='flex items-start gap-3 relative z-10'>
                {/* Number badge */}
                <span className='shrink-0 w-6 h-6 flex items-center justify-center border border-(--ash-gray) text-xs font-mono group-hover:border-(--void-black) group-hover:bg-(--void-black)/20 transition-colors'>
                  {index + 1}
                </span>
                <div className='flex-1'>
                  <span className='font-bold uppercase tracking-wider'>
                    {option.label}
                  </span>
                  {/* Outcome hint if available */}
                  {option.outcomeText && (
                    <span className='block text-xs mt-1 text-(--ash-gray) group-hover:text-(--void-black)/60 font-mono italic'>
                      {option.outcomeText}
                    </span>
                  )}
                  {/* Skill check indicator */}
                  {option.skillCheck && (
                    <span className='inline-block mt-1 text-[10px] text-(--warning-yellow) font-mono uppercase'>
                      [{'\u2694'} Skill Check]
                    </span>
                  )}
                </div>
              </div>
              {/* Scanline effect on hover */}
              <div className='absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite] skew-x-12' />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

EventModal.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        action: PropTypes.func,
        effect: PropTypes.object,
        skillCheck: PropTypes.object,
        outcomeText: PropTypes.string
      })
    ).isRequired
  }),
  onOptionSelect: PropTypes.func.isRequired,
  className: PropTypes.string
}
