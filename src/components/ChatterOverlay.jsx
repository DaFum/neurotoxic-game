// TODO: Review this file
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { getRandomChatter } from '../data/chatter'
import { motion, AnimatePresence } from 'framer-motion'
import { GAME_PHASES } from '../context/gameConstants'
import { secureRandom } from '../utils/crypto.js'

let secureRandomFallbackWarned = false

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000
const MESSAGE_LIFETIME_MS = 10000

const FONT_UI_CLASS = 'font-ui'

const TOXIC_GREEN_BASE = {
  accent: 'var(--color-toxic-green)',
  accentGlow: 'var(--color-toxic-green-20)',
  borderColor: 'border-toxic-green',
  labelColor: 'text-toxic-green',
  barColor: 'bg-toxic-green'
}

const WARNING_YELLOW_BASE = {
  accent: 'var(--color-warning-yellow)',
  accentGlow: 'var(--color-warning-yellow-20)',
  borderColor: 'border-warning-yellow',
  labelColor: 'text-warning-yellow',
  barColor: 'bg-warning-yellow'
}

const BLOOD_RED_BASE = {
  accent: 'var(--color-blood-red)',
  accentGlow: 'var(--color-blood-red-20)',
  borderColor: 'border-blood-red',
  labelColor: 'text-blood-red',
  barColor: 'bg-blood-red'
}

const OVERWORLD_STYLE = {
  ...TOXIC_GREEN_BASE,
  speakerColor: 'text-warning-yellow',
  icon: '\uD83D\uDE90'
}

const PRE_GIG_BASE_STYLE = {
  ...WARNING_YELLOW_BASE,
  speakerColor: 'text-toxic-green'
}

/**
 * Per-scene visual theme for the chatter box.
 * Each entry defines border color, accent color, icon, etc.
 */
const SCENE_STYLES = {
  [GAME_PHASES.OVERWORLD]: OVERWORLD_STYLE,
  [GAME_PHASES.PRE_GIG]: {
    ...PRE_GIG_BASE_STYLE,
    icon: '\uD83C\uDFB8'
  },
  [GAME_PHASES.GIG]: {
    ...BLOOD_RED_BASE,
    speakerColor: 'text-star-white',
    icon: '\uD83D\uDD25'
  },
  [GAME_PHASES.POST_GIG]: {
    ...TOXIC_GREEN_BASE,
    speakerColor: 'text-star-white',
    icon: '\uD83C\uDF7B'
  },
  [GAME_PHASES.MENU]: {
    ...TOXIC_GREEN_BASE,
    speakerColor: 'text-warning-yellow',
    icon: '\uD83D\uDCE1'
  },
  [GAME_PHASES.GAMEOVER]: {
    ...BLOOD_RED_BASE,
    speakerColor: 'text-ash-gray',
    icon: '\uD83D\uDC80'
  },
  [GAME_PHASES.TRAVEL_MINIGAME]: OVERWORLD_STYLE,
  [GAME_PHASES.PRE_GIG_MINIGAME]: {
    ...PRE_GIG_BASE_STYLE,
    icon: '\uD83D\uDCE6'
  },
  [GAME_PHASES.CLINIC]: {
    ...TOXIC_GREEN_BASE,
    speakerColor: 'text-blood-red',
    icon: '\uD83E\uDE78'
  }
}

const DEFAULT_STYLE = SCENE_STYLES[GAME_PHASES.MENU]

const CHATTER_CONTAINER_STYLE = { zIndex: 'var(--z-chatter)' }

const resolveSpeaker = (fixedSpeaker, bandMembers, t) => {
  if (fixedSpeaker) return fixedSpeaker
  const memberNames = []
  if (bandMembers) {
    for (let i = 0; i < bandMembers.length; i++) {
      const name = bandMembers[i].name
      if (typeof name === 'string') {
        memberNames.push(name)
      }
    }
  }
  if (memberNames.length > 0) {
    let roll
    try {
      roll = secureRandom()
    } catch (error) {
      console.warn(
        'Crypto API not available, falling back to Math.random',
        error
      )
      roll = Math.random()
    }
    return memberNames[Math.floor(roll * memberNames.length)]
  }
  return t('ui:chatter_labels.default_speaker', { defaultValue: 'Band' })
}

const resolveMessageTextColor = (msgType, currentScene) => {
  if (msgType === 'hate' || currentScene === GAME_PHASES.GAMEOVER) {
    return 'text-star-white chromatic-text'
  }
  return 'text-star-white'
}

const ChatterMessageHeader = memo(({ sceneStyle, sceneLabel, speaker }) => (
  <div className='pl-3 pr-2 py-1.5 border-b border-ash-gray/20 flex items-center justify-between gap-2'>
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
      {speaker}
    </p>
  </div>
))

ChatterMessageHeader.displayName = 'ChatterMessageHeader'
ChatterMessageHeader.propTypes = {
  sceneStyle: PropTypes.object.isRequired,
  sceneLabel: PropTypes.string.isRequired,
  speaker: PropTypes.string.isRequired
}

const ChatterMessageBody = memo(({ text, textColorClass }) => (
  <div className='pl-3 pr-2 py-2.5'>
    <p className={`text-xs leading-snug ${FONT_UI_CLASS} ${textColorClass}`}>
      {text}
    </p>
  </div>
))

ChatterMessageBody.displayName = 'ChatterMessageBody'
ChatterMessageBody.propTypes = {
  text: PropTypes.string.isRequired,
  textColorClass: PropTypes.string.isRequired
}

const ChatterMessageLifetimeBar = memo(({ barColorClass }) => (
  <div className='h-[2px] w-full bg-ash-gray/10'>
    <motion.div
      className={`h-full ${barColorClass} opacity-40`}
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{
        duration: MESSAGE_LIFETIME_MS / 1000,
        ease: 'linear'
      }}
    />
  </div>
))

ChatterMessageLifetimeBar.displayName = 'ChatterMessageLifetimeBar'
ChatterMessageLifetimeBar.propTypes = {
  barColorClass: PropTypes.string.isRequired
}

const ChatterMessage = memo(({ msg, onRemove, t }) => {
  const messageScene = msg.scene
  const sceneStyle = useMemo(
    () => SCENE_STYLES[messageScene] || DEFAULT_STYLE,
    [messageScene]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(msg.id)
    }, MESSAGE_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [msg.id, onRemove])

  const sceneLabel = useMemo(
    () =>
      t(`ui:chatter_labels.${messageScene}`, {
        defaultValue: t('ui:chatter_labels.default_fallback', {
          defaultValue: 'Band Feed'
        })
      }),
    [messageScene, t]
  )

  const textColorClass = useMemo(
    () => resolveMessageTextColor(msg.type, messageScene),
    [msg.type, messageScene]
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='mb-2 last:mb-0'
    >
      <div
        className={`relative overflow-hidden border-2 ${sceneStyle.borderColor} bg-void-black backdrop-blur-md`}
        style={{
          boxShadow: `0 0 24px rgb(var(--color-void-black-rgb) / 90%), 0 0 10px ${sceneStyle.accentGlow}`
        }}
      >
        {/* Left accent bar */}
        <div
          className={`absolute inset-y-0 left-0 w-1 ${sceneStyle.barColor}`}
        />

        <ChatterMessageHeader
          sceneStyle={sceneStyle}
          sceneLabel={sceneLabel}
          speaker={msg.speaker}
        />

        <ChatterMessageBody
          text={t(msg.text)}
          textColorClass={textColorClass}
        />

        <ChatterMessageLifetimeBar barColorClass={sceneStyle.barColor} />
      </div>
    </motion.div>
  )
})

ChatterMessage.displayName = 'ChatterMessage'

ChatterMessage.propTypes = {
  msg: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

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

  const removeMessage = useCallback(id => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  // Single recursive effect loop using refs
  useEffect(() => {
    let timeoutId
    let active = true

    const scheduleNext = () => {
      if (!active) return
      let delay
      try {
        delay = secureRandom() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS
      } catch (error) {
        console.warn(
          'Crypto API not available, falling back to Math.random',
          error
        )
        delay = Math.random() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS
      }

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        const result = getRandomChatter(currentState)

        if (result) {
          const { text, speaker: fixedSpeaker, type } = result
          const members = currentState.band?.members
          const speaker = resolveSpeaker(fixedSpeaker, members, t)

          const generators = [
            () => (globalThis.crypto || window?.crypto)?.randomUUID(),
            () => secureRandom().toString(36).substring(2)
          ]
          let id
          for (const gen of generators) {
            try {
              id = gen()
              if (id) break
            } catch {
              // Try the next generator
            }
          }

          if (!id) {
            // Fallback to Math.random() if secureRandom is unavailable
            let roll
            try {
              roll = secureRandom()
            } catch (error) {
              if (!secureRandomFallbackWarned) {
                secureRandomFallbackWarned = true
                console.warn(
                  'secureRandom() failed, falling back to Math.random().',
                  error
                )
              }
              roll = Math.random()
            }
            id = `fallback-${Date.now().toString(36)}-${roll.toString(36).substring(2)}`
          }

          const newMessage = {
            id: String(id),
            text,
            speaker,
            type,
            scene: currentState.currentScene
          }

          setMessages(prev => [
            ...prev.slice(-4), // Keep max 5 (4 old + 1 new)
            newMessage
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
  }, [t])

  // Scene-aware positioning:
  // OVERWORLD / TRAVEL_MINIGAME = bottom-left (near the bus), everything else = bottom-center
  const isOverworld =
    currentScene === GAME_PHASES.OVERWORLD ||
    currentScene === GAME_PHASES.TRAVEL_MINIGAME
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
          <ChatterMessage
            key={msg.id}
            msg={msg}
            onRemove={removeMessage}
            t={t}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})

ChatterOverlay.displayName = 'ChatterOverlay'

ChatterOverlay.propTypes = {
  gameState: PropTypes.object.isRequired
}
