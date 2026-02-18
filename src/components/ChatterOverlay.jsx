import { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000

const SCENE_LABELS = {
  INTRO: 'Intro Feed',
  MENU: 'Main Feed',
  OVERWORLD: 'Tour Feed',
  PREGIG: 'Pre-Gig Feed',
  GIG: 'Live Feed',
  POSTGIG: 'Aftershow Feed',
  SETTINGS: 'System Feed',
  CREDITS: 'Crew Feed',
  GAMEOVER: 'Last Broadcast'
}

/**
 * Displays an animated social chatter capsule for the active scene.
 *
 * @param {object} props - Component props.
 * @param {object} props.gameState - Global game state.
 * @param {number} [props.performance=0] - Current gig performance score (0-100).
 * @param {number} [props.combo=0] - Current gig combo count.
 * @param {boolean} [props.staticPosition=false] - Enables local anchoring mode.
 * @returns {JSX.Element} Overlay with transient chatter content.
 */
export const ChatterOverlay = ({
  gameState,
  performance = 0,
  combo = 0,
  staticPosition = false
}) => {
  const stateRef = useRef(gameState)
  const [messages, setMessages] = useState([])

  const sceneLabel = useMemo(
    () => SCENE_LABELS[gameState.currentScene] || 'Band Feed',
    [gameState.currentScene]
  )

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  // Track props in ref to access fresh values inside recursive timeout without restarting loop
  const propsRef = useRef({ performance, combo })
  useEffect(() => {
    propsRef.current = { performance, combo }
  }, [performance, combo])

  // Single recursive effect loop using refs
  useEffect(() => {
    let timeoutId
    let active = true

    const scheduleNext = () => {
      if (!active) return
      const delay =
        Math.random() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        const currentProps = propsRef.current
        const result = getRandomChatter(
          currentState,
          currentProps.performance,
          currentProps.combo
        )

        if (result) {
          const { text, speaker: fixedSpeaker } = result
          const members = currentState.band?.members ?? []
          const memberNames = members
            .map(member => member.name)
            .filter(memberName => typeof memberName === 'string')

          const speaker = fixedSpeaker
            ? fixedSpeaker
            : memberNames.length > 0
              ? memberNames[Math.floor(Math.random() * memberNames.length)]
              : 'Band'

          setMessages(prev => [
            ...prev.slice(-4),
            { id: Date.now(), text, speaker }
          ])
        }

        scheduleNext()
      }, delay)
    }

    // Pause scheduling when tab is hidden
    const handleVisibilityChange = () => {
      if (!active) return
      if (document.hidden) {
        clearTimeout(timeoutId)
        return
      }
      clearTimeout(timeoutId)
      scheduleNext()
    }

    scheduleNext()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const wrapperClassName = staticPosition
    ? 'relative z-20 pointer-events-none w-[min(22rem,88vw)]'
    : 'fixed top-24 right-4 md:right-8 z-20 pointer-events-none w-[min(24rem,90vw)]'

  return (
    <div className={wrapperClassName} role='status' aria-live='polite'>
      <AnimatePresence mode='popLayout'>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className='mb-2 last:mb-0'
          >
            <div className='relative overflow-hidden border-2 border-(--toxic-green) bg-(--void-black)/90 backdrop-blur-md shadow-[0_0_0_1px_var(--void-black),0_4px_12px_var(--shadow-overlay)]'>
              <div className='absolute inset-y-0 left-0 w-1 bg-(--toxic-green)' />

              <div className='pl-3 pr-2 py-1.5 border-b border-(--ash-gray)/20 flex items-center justify-between gap-2'>
                <p className='text-[10px] uppercase tracking-[0.18em] font-bold text-(--toxic-green) font-(family-name:--font-ui)'>
                  {sceneLabel}
                </p>
                <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-(--warning-yellow) font-(family-name:--font-ui)'>
                  {msg.speaker}
                </p>
              </div>

              <div className='pl-3 pr-2 py-2'>
                <p className='text-xs leading-snug text-(--star-white) font-(family-name:--font-ui)'>
                  {msg.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

ChatterOverlay.propTypes = {
  gameState: PropTypes.object.isRequired,
  performance: PropTypes.number,
  combo: PropTypes.number,
  staticPosition: PropTypes.bool
}
