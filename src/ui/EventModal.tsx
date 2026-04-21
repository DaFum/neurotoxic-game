import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { logger } from '../utils/logger'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { AlertIcon } from './shared/BrutalistUI'
import { VoidSkullIcon } from './shared/Icons'
import { generateEffectText } from '../utils/effectFormatter'
import { resolveEventChoice } from '../utils/eventEngine'
import { useGameState } from '../context/GameState'

/**
 * A modal dialog for displaying game events and capturing player choices.
 * Traps focus, supports keyboard selection (1-4 number keys), and
 * provides visual hints for option effects.
 * @param {object} props
 * @param {object} props.event - The active event object.
 * @param {Function} props.onOptionSelect - Callback when an option is selected.
 */

export const EventModal = ({ event, onOptionSelect, className = '' }) => {
  const { t } = useTranslation(['ui', 'events', 'items'])
  const containerRef = useRef(null)

  const gameState = useGameState()

  // Track preview outcomes locally instead of injecting them from GameState, avoiding render cycle race conditions
  const [outcome, setOutcome] = useState(null)
  const [previewError, setPreviewError] = useState(false)

  // Keep game state ref stable so handleOptionSelect doesn't refresh constantly, resetting the keyboard listener
  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Reset outcome on new events
  const [prevEventId, setPrevEventId] = useState(null)
  const eventId = event?.id
  useEffect(() => {
    if (eventId !== prevEventId) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPrevEventId(eventId)
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setOutcome(null)
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPreviewError(false)
    }
  }, [eventId, prevEventId])

  const handleOptionSelect = useCallback(option => {
    try {
      // Pre-calculate the result so we can show the actual outcome text and applied effects dynamically.
      // Snapshot vs Latest State Decision:
      // We capture this _precomputedResult as a static snapshot based on the game state *at the exact moment of selection*.
      // This guarantees the UI preview precisely matches what the player ultimately receives when continuing,
      // preventing any background state mutations from altering the event outcome between preview and confirmation.
      const { result, appliedDelta, delta, outcomeText, description } =
        resolveEventChoice(option, gameStateRef.current)

      setOutcome({
        option,
        _precomputedResult: {
          result,
          delta,
          appliedDelta: appliedDelta || delta,
          outcomeText,
          description
        }
      })
    } catch (error) {
      logger.error('EventModal', 'Failed to preview event outcome', error)
      setPreviewError(true)
      setOutcome({ option })
    }
  }, [])

  const handleContinue = useCallback(() => {
    if (outcome) {
      onOptionSelect({
        ...outcome.option,
        _precomputedResult: outcome._precomputedResult
      })
    }
  }, [onOptionSelect, outcome])

  // Keyboard shortcut: press 1-4 to select options
  useEffect(() => {
    if (!event || outcome) return

    const handleKey = e => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= event.options.length) {
        const option = event.options[num - 1]
        if (!option.disabled) {
          handleOptionSelect(option)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [event, outcome, handleOptionSelect])

  // Auto-focus container for screen readers
  useEffect(() => {
    containerRef.current?.focus()
  }, [event])

  const precomputedDelta =
    outcome?._precomputedResult?.appliedDelta ||
    outcome?._precomputedResult?.delta
  const memoizedEffectText = useMemo(() => {
    return precomputedDelta ? generateEffectText(precomputedDelta, t) : ''
  }, [precomputedDelta, t])

  const outcomeMessage = useMemo(() => {
    if (!outcome || !event) return ''
    if (previewError)
      return t('ui:event_error', {
        defaultValue: 'An error occurred loading this event.',
        ...event.context
      })

    const texts = [
      outcome._precomputedResult?.outcomeText &&
        t(outcome._precomputedResult.outcomeText, event.context),
      outcome._precomputedResult?.description &&
        t(outcome._precomputedResult.description, event.context)
    ].filter(Boolean)

    return texts.join(' ') || t('ui:event.resolved', event.context)
  }, [outcome, t, event, previewError])

  if (!event) return null

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
      <div className='absolute inset-0 bg-void-black/80 backdrop-blur-sm'></div>
      {/* Scanline FX on background */}
      <div
        className='absolute inset-0 pointer-events-none opacity-20'
        style={{
          backgroundImage:
            'linear-gradient(transparent 50%, rgb(var(--color-void-black-rgb) / 50%) 50%)',
          backgroundSize: '100% 4px'
        }}
      ></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className='relative w-full max-w-lg border-2 border-toxic-green bg-void-black shadow-[0_0_40px_var(--color-toxic-green-glow)] animate-[glitch-anim_0.2s_ease-in-out]'
      >
        {/* Hardware details */}
        <div className='absolute top-0 left-0 w-full h-1 bg-toxic-green'></div>
        <div className='absolute top-0 left-2 px-2 h-4 bg-toxic-green text-void-black text-[10px] font-bold text-center leading-4 uppercase'>
          {t('ui:event.severity.critical')}
        </div>

        <div className='p-8 flex flex-col gap-6'>
          <div className='flex items-start gap-4 border-b border-toxic-green/30 pb-6'>
            {event.category === 'special' ? (
              <VoidSkullIcon className='w-12 h-12 text-toxic-green animate-pulse shrink-0 mt-1' />
            ) : (
              <AlertIcon className='w-12 h-12 text-toxic-green animate-pulse shrink-0 mt-1' />
            )}
            <div>
              <h2
                id='event-title'
                className='text-2xl font-bold tracking-[0.1em] uppercase text-toxic-green'
              >
                {t(event.title, event.context)}
              </h2>
              <p className='mt-2 text-sm opacity-80 leading-relaxed text-star-white font-mono'>
                {t(event.description, event.context)}
              </p>
            </div>
          </div>

          {outcome ? (
            <motion.div
              className='flex flex-col gap-4'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='p-4 border border-toxic-green bg-toxic-green/5'>
                <p className='text-star-white font-mono leading-relaxed'>
                  {outcomeMessage}
                </p>
                {memoizedEffectText && (
                  <p className='text-toxic-green font-mono mt-4 text-sm font-bold bg-toxic-green/10 inline-block p-2'>
                    {memoizedEffectText}
                  </p>
                )}
              </div>
              <button
                type='button'
                onClick={handleContinue}
                className='w-full p-3 border border-toxic-green bg-toxic-green/20 hover:bg-toxic-green hover:text-void-black text-toxic-green font-bold tracking-widest uppercase transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                [ {t('ui:continue', { defaultValue: 'CONTINUE' })} ]
              </button>
            </motion.div>
          ) : (
            <>
              {/* Keyboard hint */}
              <p className='text-[10px] text-ash-gray font-mono uppercase tracking-widest text-center'>
                {t('ui:keyboardHint', { count: event.options.length })}
              </p>

              <motion.div
                className='flex flex-col gap-3'
                initial='hidden'
                animate='visible'
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } }
                }}
              >
                {event.options.map((option, index) => {
                  const isDisabled = option.disabled || false
                  const buttonContent = (
                    <motion.button
                      type='button'
                      disabled={isDisabled}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      key={
                        option.id ||
                        option.nextEventId ||
                        `${option.label}-${index}`
                      }
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full p-3 border font-bold tracking-widest uppercase transition-colors text-left flex justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black
                        ${isDisabled ? 'border-ash-gray/20 text-ash-gray/20 cursor-not-allowed' : index === 0 ? 'border-toxic-green bg-toxic-green/10 hover:bg-toxic-green hover:text-void-black text-toxic-green focus-visible:ring-toxic-green' : 'border-star-white/50 text-star-white/50 hover:border-star-white hover:text-star-white hover:bg-star-white/10 focus-visible:ring-star-white'}
                      `}
                    >
                      <span>
                        <span className='opacity-50 mr-2'>[{index + 1}]</span>
                        {t(option.label, event.context)}
                      </span>

                      <div className='flex flex-col items-end text-right'>
                        {/* Skill check indicator */}
                        {option.skillCheck && (
                          <span className='inline-block mt-1 text-[10px] text-warning-yellow'>
                            [{'\u2694'} {t('ui:skillCheck')}]
                          </span>
                        )}
                      </div>
                    </motion.button>
                  )

                  if (isDisabled) {
                    return (
                      // eslint-disable-next-line @eslint-react/no-array-index-key
                      <span key={`disabled-wrapper-${index}`} tabIndex={0}>
                        {buttonContent}
                      </span>
                    )
                  }
                  return buttonContent
                })}
              </motion.div>
            </>
          )}
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
        effect: PropTypes.object,
        skillCheck: PropTypes.object,
        outcomeText: PropTypes.string
      })
    ).isRequired
  }),
  onOptionSelect: PropTypes.func.isRequired,
  className: PropTypes.string
}
