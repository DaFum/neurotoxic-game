import { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useGameState } from '../context/GameState'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000
const CHATTER_VISIBLE_MS = 5200

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
 * @param {boolean} [props.staticPosition=false] - Enables local anchoring mode.
 * @returns {JSX.Element} Overlay with transient chatter content.
 */
export const ChatterOverlay = ({ staticPosition = false }) => {
  const state = useGameState()
  const stateRef = useRef(state)
  const [chatter, setChatter] = useState(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const sceneLabel = useMemo(
    () => SCENE_LABELS[state.currentScene] || 'Band Feed',
    [state.currentScene]
  )

  useEffect(() => {
    let delayTimeoutId
    let hideTimeoutId
    let active = true

    const schedule = () => {
      if (!active || document.hidden) return
      const delay =
        Math.random() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS

      delayTimeoutId = setTimeout(() => {
        if (!active || document.hidden) return

        const currentState = stateRef.current
        const result = getRandomChatter(currentState)

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

          setChatter({ text, speaker, id: Date.now() })

          clearTimeout(hideTimeoutId)
          hideTimeoutId = setTimeout(() => {
            if (active) setChatter(null)
          }, CHATTER_VISIBLE_MS)
        }

        schedule()
      }, delay)
    }

    const handleVisibilityChange = () => {
      if (!active) return
      if (!document.hidden) {
        clearTimeout(delayTimeoutId)
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      clearTimeout(delayTimeoutId)
      clearTimeout(hideTimeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const wrapperClassName = staticPosition
    ? 'relative z-20 pointer-events-none w-[min(22rem,88vw)]'
    : 'fixed top-24 right-4 md:right-8 z-20 pointer-events-none w-[min(24rem,90vw)]'

  return (
    <AnimatePresence>
      {chatter && (
        <motion.div
          key={chatter.id}
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={wrapperClassName}
          aria-live='polite'
          role='status'
        >
          <div className='relative overflow-hidden border-2 border-(--toxic-green) bg-(--void-black)/90 backdrop-blur-md shadow-[0_0_0_1px_var(--void-black),0_12px_30px_var(--shadow-overlay-strong)]'>
            <div className='absolute inset-y-0 left-0 w-1.5 bg-(--toxic-green)' />
            <div className='absolute top-0 right-0 h-10 w-10 bg-(--toxic-green)/20 blur-lg' />

            <div className='pl-4 pr-3 py-2 border-b border-(--ash-gray) flex items-center justify-between gap-2'>
              <p className='text-[10px] uppercase tracking-[0.18em] font-bold text-(--toxic-green) font-mono'>
                {sceneLabel}
              </p>
              <span className='inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-(--ash-gray)'>
                <span className='w-1.5 h-1.5 rounded-full bg-(--toxic-green) animate-pulse' />
                Live
              </span>
            </div>

            <div className='pl-4 pr-3 py-3'>
              <p className='text-[11px] font-bold uppercase tracking-[0.14em] text-(--warning-yellow) font-mono mb-1'>
                {chatter.speaker}
              </p>
              <p className='text-sm leading-snug text-(--star-white) font-mono'>
                {chatter.text}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

ChatterOverlay.propTypes = {
  staticPosition: PropTypes.bool
}
