import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import { AlertIcon } from './shared/BrutalistUI'
import { VoidSkullIcon } from './shared/Icons'

const CATEGORY_IMAGE_MAP = {
  transport: IMG_PROMPTS.EVENT_VAN,
  band: IMG_PROMPTS.EVENT_BAND,
  gig: IMG_PROMPTS.EVENT_GIG,
  financial: IMG_PROMPTS.EVENT_MONEY,
  special: IMG_PROMPTS.EVENT_SPECIAL
}

/**
 * A modal dialog for displaying game events and capturing player choices.
 * Traps focus, supports keyboard selection (1-4 number keys), and
 * provides visual hints for option effects.
 * @param {object} props
 * @param {object} props.event - The active event object.
 * @param {Function} props.onOptionSelect - Callback when an option is selected.
 */
export const EventModal = ({ event, onOptionSelect, className = '' }) => {
  const { t } = useTranslation()
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

  const categoryImagePrompt = event.category
    ? CATEGORY_IMAGE_MAP[event.category]
    : null
  const categoryImageUrl = categoryImagePrompt
    ? getGenImageUrl(categoryImagePrompt)
    : null

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role='dialog'
      aria-modal='true'
      aria-labelledby='event-title'
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${className}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-(--void-black)/80 backdrop-blur-sm"></div>
      {/* Scanline FX on background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(var(--void-black-rgb), 0.5) 50%)', backgroundSize: '100% 4px' }}></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className='relative w-full max-w-lg border-2 border-(--toxic-green) bg-[color:var(--void-black)] shadow-[0_0_40px_var(--toxic-green-glow)] animate-[glitch-anim_0.2s_ease-in-out]'
      >
        {/* Hardware details */}
        <div className="absolute top-0 left-0 w-full h-1 bg-(--toxic-green)"></div>
        <div className="absolute top-0 left-2 px-2 h-4 bg-(--toxic-green) text-(--void-black) text-[10px] font-bold text-center leading-4 uppercase">
          {t('ui:event.severity.critical', 'CRITICAL')}
        </div>

        <div className='p-8 flex flex-col gap-6'>
          <div className="flex items-start gap-4 border-b border-(--toxic-green)/30 pb-6">
            {event.category === 'special' ? (
              <VoidSkullIcon className="w-12 h-12 text-(--toxic-green) animate-pulse shrink-0 mt-1" />
            ) : (
              <AlertIcon className="w-12 h-12 text-(--toxic-green) animate-pulse shrink-0 mt-1" />
            )}
            <div>
              <h2
                id='event-title'
                className='text-2xl font-bold tracking-[0.1em] uppercase text-(--toxic-green)'
              >
                {t(event.title, event.context)}
              </h2>
              <p className='mt-2 text-sm opacity-80 leading-relaxed text-(--star-white) font-mono'>
                {t(event.description, event.context)}
              </p>
            </div>
          </div>

          {/* Keyboard hint */}
          <p className='text-[10px] text-(--ash-gray) font-mono uppercase tracking-widest text-center'>
            {t('ui:keyboardHint', { count: event.options.length, defaultValue: `Press [1-${event.options.length}] or click to choose` })}
          </p>

          <motion.div
            className='flex flex-col gap-3'
            initial='hidden'
            animate='visible'
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {event.options.map((option, index) => (
              <motion.button
                type="button"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                key={
                  option.id || option.nextEventId || `${option.label}-${index}`
                }
                onClick={() => {
                  if (option.action) option.action()
                  else onOptionSelect(option)
                }}
                className={`w-full p-3 border font-bold tracking-widest uppercase transition-colors text-left flex justify-between
                  ${index === 0 ? 'border-(--toxic-green) bg-(--toxic-green)/10 hover:bg-(--toxic-green) hover:text-[color:var(--void-black)] text-(--toxic-green)' : 'border-(--star-white)/50 text-(--star-white)/50 hover:border-(--star-white) hover:text-(--star-white) hover:bg-(--star-white)/10'}
                `}
              >
                <span>
                   <span className="opacity-50 mr-2">[{index + 1}]</span>
                   {t(option.label, event.context)}
                </span>

                <div className="flex flex-col items-end text-right">
                  {/* Outcome hint if available */}
                  {option.outcomeText && (
                    <span className={`text-[10px] mt-1 opacity-70`}>
                      {t(option.outcomeText, event.context)}
                    </span>
                  )}
                  {/* Skill check indicator */}
                  {option.skillCheck && (
                    <span className='inline-block mt-1 text-[10px] text-(--warning-yellow)'>
                      [{'\u2694'} {t('ui:skillCheck', 'Skill Check')}]
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
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
