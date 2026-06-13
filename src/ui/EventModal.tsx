import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { logger } from '../utils/logger'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertIcon } from './shared/BrutalistUI'
import { VoidSkullIcon } from './shared/Icons'
import { generateEffectText } from '../utils/effectFormatter'
import { formatCurrency } from '../utils/numberUtils'
import { resolveEventChoice, getOptionPreviewMoney } from '../utils/eventEngine'
import { useGameSelector } from '../context/GameState'
import type { EngineGameState } from '../utils/eventEngine'
import type {
  EventModalEvent,
  EventModalOption,
  EventModalPrecomputedResult
} from '../types/components'

type EventOutcome = {
  option: EventModalOption
  _precomputedResult?: EventModalPrecomputedResult
}

interface EventOptionButtonProps {
  option: EventModalOption
  index: number
  optionLabel: string
  eventContext: Record<string, unknown> | undefined
  amount: string
  onSelect: (option: EventModalOption) => void
  t: ReturnType<typeof useTranslation>['t']
}

const EventOptionButton = ({
  option,
  index,
  optionLabel,
  eventContext,
  amount,
  onSelect,
  t
}: EventOptionButtonProps) => {
  const isDisabled = option.disabled || false
  const buttonClass = isDisabled
    ? 'border-ash-gray/40 text-ash-gray/40 cursor-not-allowed'
    : index === 0
      ? 'border-toxic-green bg-toxic-green/10 hover:bg-toxic-green hover:text-void-black text-toxic-green focus-visible:ring-toxic-green'
      : 'border-star-white/50 text-star-white/50 hover:border-star-white hover:text-star-white hover:bg-star-white/10 focus-visible:ring-star-white'

  return (
    <motion.button
      type='button'
      aria-disabled={isDisabled}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
      onClick={() => {
        if (!isDisabled) onSelect(option)
      }}
      className={`w-full p-3 border font-bold tracking-widest uppercase transition-colors text-left flex justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${buttonClass}`}
    >
      <span>
        <span className='opacity-50 mr-2'>[{index + 1}]</span>
        {String(t(optionLabel, { ...eventContext, amount }))}
      </span>

      <div className='flex flex-col items-end text-right'>
        {option.skillCheck && (
          <span className='inline-block mt-1 text-xs text-warning-yellow'>
            [{'⚔'} {t('ui:skillCheck')}]
          </span>
        )}
      </div>
    </motion.button>
  )
}

/**
 * Presents the active event narrative, options, and precomputed outcomes.
 * @param props - Active event, option-selection callback, and optional wrapper class.
 */
export const EventModal = ({
  event,
  onOptionSelect,
  className = ''
}: {
  event: EventModalEvent | null
  onOptionSelect: (
    option: EventModalOption & {
      _precomputedResult?: EventModalPrecomputedResult
    }
  ) => void
  className?: string
}) => {
  const { t, i18n } = useTranslation(['ui', 'events', 'items'])
  const containerRef = useRef<HTMLDivElement | null>(null)

  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const social = useGameSelector(state => state.social) // resolveEventChoice sometimes needs social

  const gameState = useMemo(
    () => ({
      player,
      band,
      activeEvent,
      social
    }),
    [player, band, activeEvent, social]
  ) as unknown as EngineGameState

  // Track preview outcomes locally instead of injecting them from GameState, avoiding render cycle race conditions
  const [outcome, setOutcome] = useState<EventOutcome | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [prevEventId, setPrevEventId] = useState<string | undefined>(event?.id)
  const resolvedRef = useRef(false)
  const [isResolved, setIsResolved] = useState(false)

  // Reset outcome and resolved guard on new events
  if (event?.id !== prevEventId) {
    setPrevEventId(event?.id)
    setOutcome(null)
    setPreviewError(false)
    setIsResolved(false)
    // Reset the synchronous double-submit guard in the same guarded block as
    // isResolved so the ref and the button's disabled state never diverge.
    // (A useEffect reset would lag a render behind, leaving a window where the
    // button is enabled but handleContinue still no-ops.)
    resolvedRef.current = false
  }

  // Keep game state ref stable so handleOptionSelect doesn't refresh constantly, resetting the keyboard listener
  const gameStateRef = useRef(gameState)
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const handleOptionSelect = useCallback((option: EventModalOption) => {
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
          appliedDelta: appliedDelta ?? delta,
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
    if (outcome && !resolvedRef.current) {
      resolvedRef.current = true
      setIsResolved(true)
      onOptionSelect({
        ...outcome.option,
        _precomputedResult: outcome._precomputedResult
      })
    }
  }, [onOptionSelect, outcome])

  // Keyboard shortcut: press 1-4 to select options
  useEffect(() => {
    if (!event || outcome) return
    const eventOptions = Array.isArray(event.options)
      ? (event.options as EventModalOption[])
      : []

    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= eventOptions.length) {
        const option = eventOptions[num - 1]
        if (option && !option.disabled) {
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
    outcome?._precomputedResult?.appliedDelta ??
    outcome?._precomputedResult?.delta
  const memoizedEffectText = useMemo(() => {
    return precomputedDelta
      ? generateEffectText(precomputedDelta, t, i18n.language)
      : ''
  }, [precomputedDelta, t, i18n.language])

  const outcomeMessage = useMemo(() => {
    if (!outcome || !event) return ''
    const eventContext =
      typeof event.context === 'object' && event.context !== null
        ? (event.context as Record<string, unknown>)
        : undefined
    if (previewError)
      return t('ui:event_error', {
        defaultValue: 'An error occurred loading this event.',
        ...eventContext
      })

    const texts = [
      outcome._precomputedResult?.outcomeText &&
        t(outcome._precomputedResult.outcomeText, eventContext),
      outcome._precomputedResult?.description &&
        t(outcome._precomputedResult.description, eventContext)
    ].filter(Boolean)

    return texts.join(' ') || t('ui:event.resolved', eventContext)
  }, [outcome, t, event, previewError])

  if (!event) return null
  const eventOptions = Array.isArray(event.options)
    ? (event.options as EventModalOption[])
    : []
  const eventContext =
    typeof event.context === 'object' && event.context !== null
      ? (event.context as Record<string, unknown>)
      : undefined
  const titleKey = event.title ?? event.titleKey ?? 'ui:event.untitled'
  const descriptionKey =
    event.description ?? event.descriptionKey ?? 'ui:event.noDescription'

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role='dialog'
      aria-modal='true'
      aria-labelledby='event-title'
      className={`fixed inset-0 z-(--z-modal) flex items-center justify-center p-4 ${className}`}
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-void-black/80 backdrop-blur-sm'></div>
      {/* Scanline FX on background */}
      <div
        className='absolute inset-0 pointer-events-none opacity-20'
        style={{
          backgroundImage:
            'linear-gradient(transparent 50%, var(--color-void-black-50) 50%)',
          backgroundSize: '100% 4px'
        }}
      ></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className='relative w-full max-w-4xl border-4 border-toxic-green p-3 sm:p-6 bg-void-black shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)] motion-safe:animate-[glitch-anim_0.2s_ease-in-out]'
      >
        {/* Hardware details */}
        <div className='absolute top-0 left-0 w-full h-1 bg-toxic-green'></div>
        <div className='absolute top-0 left-2 px-2 h-4 bg-toxic-green text-void-black text-xs font-bold text-center leading-4 uppercase'>
          {t('ui:event.severity.critical')}
        </div>

        <div className='flex flex-col gap-6 max-h-[calc(100svh-4rem)] overflow-y-auto custom-scrollbar'>
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
                {t(titleKey, {
                  defaultValue: event.title ?? t('ui:event.untitled'),
                  ...eventContext
                })}
              </h2>
              <p className='mt-2 text-sm opacity-80 leading-relaxed text-star-white font-mono'>
                {t(descriptionKey, {
                  defaultValue:
                    event.description ?? t('ui:event.noDescription'),
                  ...eventContext
                })}
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
                disabled={isResolved}
                onClick={handleContinue}
                className='w-full p-3 border border-toxic-green bg-toxic-green/20 hover:bg-toxic-green hover:text-void-black text-toxic-green font-bold tracking-widest uppercase transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-toxic-green/20 disabled:hover:text-toxic-green'
              >
                [ {t('ui:continue', { defaultValue: 'CONTINUE' })} ]
              </button>
            </motion.div>
          ) : (
            <>
              {/* Keyboard hint */}
              <p className='text-xs text-ash-gray font-mono uppercase tracking-widest text-center'>
                {t('ui:keyboardHint', { count: eventOptions.length })}
              </p>

              <motion.div
                className='flex flex-col gap-3'
                initial='hidden'
                animate='visible'
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } }
                }}
              >
                {eventOptions.map((option, index) => {
                  const optionLabel =
                    option.label ??
                    option.textKey ??
                    option.text ??
                    'ui:event.option'
                  const key =
                    option.id ?? option.nextEventId ?? `${optionLabel}-${index}`
                  // Localized currency for the optional `{{amount}}` placeholder
                  // in money-bearing option labels. Sourced deterministically
                  // from the option's effect (null money → 0) so the formatted
                  // amount matches the mechanical effect and localizes per locale.
                  const previewMoney = getOptionPreviewMoney(option, gameState)
                  const amount = formatCurrency(
                    previewMoney ?? 0,
                    i18n.language,
                    'always'
                  )
                  return (
                    <EventOptionButton
                      key={key}
                      option={option}
                      index={index}
                      optionLabel={optionLabel}
                      eventContext={eventContext}
                      amount={amount}
                      onSelect={handleOptionSelect}
                      t={t}
                    />
                  )
                })}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
