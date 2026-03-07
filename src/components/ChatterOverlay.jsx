import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'
import { GAME_PHASES } from '../context/gameConstants'

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000
const MESSAGE_LIFETIME_MS = 10000

const FONT_UI_CLASS = 'font-(family-name:--font-ui)'

const TOXIC_GREEN_BASE = {
  accent: 'var(--toxic-green)',
  borderColor: 'border-(--toxic-green)',
  labelColor: 'text-(--toxic-green)',
  barColor: 'bg-(--toxic-green)'
}

const WARNING_YELLOW_BASE = {
  accent: 'var(--warning-yellow)',
  borderColor: 'border-(--warning-yellow)',
  labelColor: 'text-(--warning-yellow)',
  barColor: 'bg-(--warning-yellow)'
}

const BLOOD_RED_BASE = {
  accent: 'var(--blood-red)',
  borderColor: 'border-(--blood-red)',
  labelColor: 'text-(--blood-red)',
  barColor: 'bg-(--blood-red)'
}

const OVERWORLD_STYLE = {
  ...TOXIC_GREEN_BASE,
  speakerColor: 'text-(--warning-yellow)',
  icon: '\uD83D\uDE90'
}

/**
 * Per-scene visual theme for the chatter box.
 * Each entry defines border color, accent color, icon, etc.
 */
const SCENE_STYLES = {
  [GAME_PHASES.OVERWORLD]: OVERWORLD_STYLE,
  [GAME_PHASES.PRE_GIG]: {
    ...WARNING_YELLOW_BASE,
    speakerColor: 'text-(--toxic-green)',
    icon: '\uD83C\uDFB8'
  },
  [GAME_PHASES.GIG]: {
    ...BLOOD_RED_BASE,
    speakerColor: 'text-(--star-white)',
    icon: '\uD83D\uDD25'
  },
  [GAME_PHASES.POST_GIG]: {
    ...TOXIC_GREEN_BASE,
    speakerColor: 'text-(--star-white)',
    icon: '\uD83C\uDF7B'
  },
  [GAME_PHASES.MENU]: {
    ...TOXIC_GREEN_BASE,
    speakerColor: 'text-(--warning-yellow)',
    icon: '\uD83D\uDCE1'
  },
  [GAME_PHASES.GAMEOVER]: {
    ...BLOOD_RED_BASE,
    speakerColor: 'text-(--ash-gray)',
    icon: '\uD83D\uDC80'
  },
  [GAME_PHASES.TRAVEL_MINIGAME]: OVERWORLD_STYLE,
  [GAME_PHASES.PRE_GIG_MINIGAME]: {
    ...WARNING_YELLOW_BASE,
    speakerColor: 'text-(--toxic-green)',
    icon: '\uD83D\uDCE6'
  }
}

const DEFAULT_STYLE = SCENE_STYLES[GAME_PHASES.MENU]

const CHATTER_CONTAINER_STYLE = { zIndex: 'var(--z-chatter)' }

/**
 * Displays an animated social chatter box that is always visible on top of all content.
 *
 * Positioning:
 * - OVERWORLD: bottom-left near the bus / event log area
 * - All other scenes: bottom-center of the window
 *
 * z-index: 200 (--z-chatter) — above CRT (80), modal (100), and tutorial (150)
 * so chatter text is ALWAYS readable and never overlapped.
 *
 * Visual style adapts per scene — different border colors, accent bars, and icons.
 *
 * @param {object} props
 * @param {object} props.gameState - Read-only game state slice.
 */
export const ChatterOverlay = memo(({ gameState }) => {
  const { t } = useTranslation(['chatter', 'ui'])
  const stateRef = useRef(gameState)
  const [messages, setMessages] = useState([])

  const currentScene = gameState.currentScene

  const sceneLabel = useMemo(
    () =>
      t(`ui:chatter_labels.${currentScene}`, {
        defaultValue: t('ui:chatter_labels.default_fallback', {
          defaultValue: 'Band Feed'
        })
      }),
    [currentScene, t]
  )

  const sceneStyle = useMemo(
    () => SCENE_STYLES[currentScene] || DEFAULT_STYLE,
    [currentScene]
  )

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  // Single recursive effect loop using refs
  useEffect(() => {
    let timeoutId
    let active = true
    const removalTimeouts = new Set()

    const scheduleNext = () => {
      if (!active) return
      const delay =
        Math.random() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        const result = getRandomChatter(currentState)

        if (result) {
          const { text, speaker: fixedSpeaker, type } = result
          const members = currentState.band?.members ?? []
          const memberNames = members
            .map(member => member.name)
            .filter(memberName => typeof memberName === 'string')

          const speaker = fixedSpeaker
            ? fixedSpeaker
            : memberNames.length > 0
              ? memberNames[Math.floor(Math.random() * memberNames.length)]
              : t('ui:chatter_labels.default_speaker', { defaultValue: 'Band' })

          const newMessage = { id: Date.now(), text, speaker, type }

          setMessages(prev => [
            ...prev.slice(-4), // Keep max 5 (4 old + 1 new)
            newMessage
          ])

          // Auto-remove individual message after lifetime
          // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
          const removalId = setTimeout(() => {
            removalTimeouts.delete(removalId)
            if (active) {
              setMessages(prev => prev.filter(m => m.id !== newMessage.id))
            }
          }, MESSAGE_LIFETIME_MS)
          removalTimeouts.add(removalId)
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
      removalTimeouts.forEach(id => clearTimeout(id))
      removalTimeouts.clear()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Scene-aware positioning:
  // OVERWORLD / TRAVEL_MINIGAME = bottom-left (near the bus), everything else = bottom-center
  const isOverworld =
    currentScene === GAME_PHASES.OVERWORLD || currentScene === GAME_PHASES.TRAVEL_MINIGAME
  const positionClassName = isOverworld
    ? 'fixed bottom-28 left-8 pointer-events-none w-[min(22rem,85vw)]'
    : 'fixed bottom-16 left-1/2 -translate-x-1/2 pointer-events-none w-[min(24rem,90vw)]'

  return (
    <div
      className={positionClassName}
      style={CHATTER_CONTAINER_STYLE}
      role='status'
      aria-live='polite'
    >
      <AnimatePresence mode='popLayout'>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className='mb-2 last:mb-0'
          >
            <div
              className={`relative overflow-hidden border-2 ${sceneStyle.borderColor} bg-(--void-black) backdrop-blur-md`}
              style={{
                boxShadow: `0 0 24px rgb(var(--void-black-rgb) / 90%), 0 0 10px ${sceneStyle.accent}33`
              }}
            >
              {/* Left accent bar */}
              <div
                className={`absolute inset-y-0 left-0 w-1 ${sceneStyle.barColor}`}
              />

              {/* Header: scene label + speaker */}
              <div className='pl-3 pr-2 py-1.5 border-b border-(--ash-gray)/20 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-[10px]'>{sceneStyle.icon}</span>
                  <p
                    className={`text-[10px] uppercase tracking-[0.18em] font-bold ${sceneStyle.labelColor} ${FONT_UI_CLASS}`}
                  >
                    {sceneLabel}
                  </p>
                </div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${sceneStyle.speakerColor} ${FONT_UI_CLASS}`}
                >
                  {msg.speaker}
                </p>
              </div>

              {/* Message body */}
              <div className='pl-3 pr-2 py-2.5'>
                <p
                  className={`text-xs leading-snug ${FONT_UI_CLASS} ${msg.type === 'hate' || currentScene === GAME_PHASES.GAMEOVER ? 'text-(--star-white) chromatic-text' : 'text-(--star-white)'}`}
                >
                  {t(msg.text)}
                </p>
              </div>

              {/* Lifetime countdown bar */}
              <div className='h-[2px] w-full bg-(--ash-gray)/10'>
                <motion.div
                  className={`h-full ${sceneStyle.barColor} opacity-40`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: MESSAGE_LIFETIME_MS / 1000,
                    ease: 'linear'
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

ChatterOverlay.displayName = 'ChatterOverlay'

ChatterOverlay.propTypes = {
  gameState: PropTypes.object.isRequired
}
