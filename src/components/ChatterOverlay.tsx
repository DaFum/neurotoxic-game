import {
  useEffect,
  useMemo,
  memo,
  useRef,
  useLayoutEffect,
  type RefObject
} from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { GAME_PHASES } from '../context/gameConstants'
import { useGameSelector } from '../context/GameState'
import { useChatterLogic } from '../hooks/useChatterLogic'
import type {
  ChatterMessageData,
  ChatterMessageProps,
  ChatterMessageType
} from '../types/components'

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
  labelColor: 'text-blood-red-bright',
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
 * Defines the style properties used to construct a scene's visual theme.
 */
interface SceneStyle {
  accent: string
  accentGlow: string
  borderColor: string
  labelColor: string
  barColor: string
  speakerColor: string
  icon: string
}

/**
 * Defines the visual theme for the chatter box based on the current scene.
 *
 * @remarks
 * Each entry specifies the border color, accent color, and icon for a particular scene.
 */
const SCENE_STYLES: Record<string, SceneStyle> = {
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
    speakerColor: 'text-blood-red-bright',
    icon: '\uD83E\uDE78'
  }
}

const DEFAULT_STYLE: SceneStyle =
  SCENE_STYLES[GAME_PHASES.MENU] ?? OVERWORLD_STYLE

/**
 * Defines the properties for the header section of a chatter message.
 */
interface ChatterMessageHeaderProps {
  sceneStyle: SceneStyle
  sceneLabel: string
  speaker: string
}

/**
 * Defines the properties for the body content of a chatter message.
 */
interface ChatterMessageBodyProps {
  text: string
  textColorClass: string
}

/**
 * Defines the properties for the lifetime duration bar of a chatter message.
 */
interface ChatterMessageLifetimeBarProps {
  barColorClass: string
}

/**
 * Determines the text color class for a chatter message based on its type and the current scene.
 *
 * @param msgType - The classification of the chatter message
 * @param currentScene - The key representing the active game scene
 * @returns A string containing the corresponding Tailwind text color classes
 */
const resolveMessageTextColor = (
  msgType: ChatterMessageType,
  currentScene: string
): string => {
  if (msgType === 'hate' || currentScene === GAME_PHASES.GAMEOVER) {
    return 'text-star-white chromatic-text'
  }
  return 'text-star-white'
}

/**
 * Renders the header section of a chatter message, displaying the scene label and speaker name.
 *
 * @param props - Component properties containing styling and display text
 * @returns The header container component
 */
const ChatterMessageHeader = memo(
  ({ sceneStyle, sceneLabel, speaker }: ChatterMessageHeaderProps) => (
    <div className='pl-3 pr-2 py-1.5 border-b border-ash-gray/20 flex items-center justify-between gap-2'>
      <div className='flex items-center gap-1.5'>
        <span className='text-xs'>{sceneStyle.icon}</span>
        <p
          className={`text-xs uppercase tracking-widest font-bold ${sceneStyle.labelColor} ${FONT_UI_CLASS}`}
        >
          {sceneLabel}
        </p>
      </div>
      <p
        className={`text-xs font-bold uppercase tracking-widest ${sceneStyle.speakerColor} ${FONT_UI_CLASS}`}
      >
        {speaker}
      </p>
    </div>
  )
)

ChatterMessageHeader.displayName = 'ChatterMessageHeader'

/**
 * Renders the body content of a chatter message.
 *
 * @param props - Component properties containing the message text and its color class
 * @returns The body container component
 */
const ChatterMessageBody = memo(
  ({ text, textColorClass }: ChatterMessageBodyProps) => (
    <div className='pl-3 pr-2 py-2.5'>
      <p className={`text-xs leading-snug ${FONT_UI_CLASS} ${textColorClass}`}>
        {text}
      </p>
    </div>
  )
)

ChatterMessageBody.displayName = 'ChatterMessageBody'

/**
 * Renders an animated progress bar indicating the remaining lifetime of a chatter message.
 *
 * @param props - Component properties specifying the color class for the bar
 * @returns The animated lifetime bar component
 */
const ChatterMessageLifetimeBar = memo(
  ({ barColorClass }: ChatterMessageLifetimeBarProps) => (
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
  )
)

ChatterMessageLifetimeBar.displayName = 'ChatterMessageLifetimeBar'

/**
 * Renders an individual, animated social chatter message.
 *
 * @param props - Component properties containing the message data, removal callback, and translation function
 * @returns The animated chatter message component
 */
const ChatterMessage = memo(({ msg, onRemove, t }: ChatterMessageProps) => {
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
          boxShadow: `4px 4px 0px ${sceneStyle.accent}`
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

const EDGE_MARGIN = 16

type Rect = { left: number; top: number; right: number; bottom: number }
type Anchor = { left: number; top: number }

const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

// Interactive / high-value elements the chatter box must never sit on top of.
// (Static flavour text isn't included — the box would otherwise never find a
// clear spot, since something is always behind it.)
const OBSTACLE_SELECTOR =
  'button,[role="button"],a[href],[role="dialog"],[role="tab"],[role="tablist"]'

const collectObstacleRects = (self: HTMLElement): Rect[] => {
  const rects: Rect[] = []
  for (const el of document.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR)) {
    if (self.contains(el) || el.contains(self)) continue
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
    }
  }
  return rects
}

// Candidate top-left anchors, preferred first: the scene default leads, then
// fallbacks fan out to the opposite edge and corners.
const candidateAnchors = (
  isOverworld: boolean,
  vw: number,
  vh: number,
  w: number,
  h: number
): Anchor[] => {
  const left = EDGE_MARGIN + (isOverworld ? EDGE_MARGIN : 0)
  const center = Math.max(EDGE_MARGIN, (vw - w) / 2)
  const right = Math.max(EDGE_MARGIN, vw - w - EDGE_MARGIN)
  const top = EDGE_MARGIN
  const bottom = Math.max(EDGE_MARGIN, vh - h - (isOverworld ? 112 : 64))
  const bottomTight = Math.max(EDGE_MARGIN, vh - h - EDGE_MARGIN)
  return isOverworld
    ? [
        { left, top: bottom },
        { left, top },
        { left: right, top: bottom },
        { left: right, top },
        { left: center, top: bottomTight }
      ]
    : [
        { left: center, top: bottom },
        { left: center, top },
        { left: right, top: bottom },
        { left: right, top },
        { left, top: bottom },
        { left, top }
      ]
}

/**
 * Positions the chatter box at its scene-default anchor, but re-places it to the
 * first candidate anchor that clears all interactive UI whenever the default
 * would overlap something. Returns a ref for the container and the inline style
 * to apply (undefined = keep the CSS-class default position).
 *
 * @param isOverworld - Whether the current scene uses the overworld anchor set.
 * @param revision - Changes when the visible messages change, to re-evaluate.
 */
const clearPositionOverride = (el: HTMLElement): void => {
  el.style.left = ''
  el.style.top = ''
  el.style.right = ''
  el.style.bottom = ''
  el.style.transform = ''
}

const useNonOverlappingPosition = (
  isOverworld: boolean,
  revision: string
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement>(null)

  // Position is derived from live DOM measurement, so it is applied imperatively
  // to the element (no React state → no extra render, no first-paint flash).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const reposition = () => {
      // Revert to the CSS-class default before measuring/deciding.
      clearPositionOverride(el)
      const box = el.getBoundingClientRect()
      const w = box.width
      const h = box.height
      if (w === 0 || h === 0) return

      const obstacles = collectObstacleRects(el)
      const anchors = candidateAnchors(
        isOverworld,
        window.innerWidth,
        window.innerHeight,
        w,
        h
      )
      const clear = anchors.find(
        a =>
          !obstacles.some(o =>
            rectsIntersect(
              {
                left: a.left,
                top: a.top,
                right: a.left + w,
                bottom: a.top + h
              },
              o
            )
          )
      )
      // Default anchor already clear (or nothing fits) → keep the CSS default.
      if (!clear || clear === anchors[0]) return

      el.style.left = `${Math.round(clear.left)}px`
      el.style.top = `${Math.round(clear.top)}px`
      el.style.right = 'auto'
      el.style.bottom = 'auto'
      el.style.transform = 'none'
    }

    reposition()
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [isOverworld, revision])

  return ref
}

/**
 * Displays an animated social chatter box that remains visible across various scenes.
 *
 * @remarks
 * The visual style adapts per scene by updating border colors, accent bars, and icons.
 *
 * Positioning logic:
 * - OVERWORLD: bottom-left near the bus/event log area.
 * - All other scenes: bottom-center of the window.
 * - Either default is re-placed to the first clear anchor when it would overlap
 *   interactive UI (see `useNonOverlappingPosition`).
 *
 * Desktop uses `--z-chatter` above opaque scene roots and below modal chrome, while mobile lowers it further below touch menus.
 *
 * @returns The persistent chatter overlay container
 */
export const ChatterOverlay = memo(() => {
  const { t } = useTranslation(['chatter', 'ui'])

  const currentScene = useGameSelector(state => state.currentScene)
  const band = useGameSelector(state => state.band)
  const player = useGameSelector(state => state.player)
  const gameMap = useGameSelector(state => state.gameMap)
  const social = useGameSelector(state => state.social)
  const lastGigStats = useGameSelector(state => state.lastGigStats)
  const gigModifiers = useGameSelector(state => state.gigModifiers)

  const chatterState = useMemo(
    () => ({
      currentScene,
      band,
      player,
      gameMap,
      social,
      lastGigStats,
      gigModifiers
    }),
    [currentScene, band, player, gameMap, social, lastGigStats, gigModifiers]
  )

  const { messages, removeMessage } = useChatterLogic(chatterState, t)

  // Scene-aware positioning:
  // OVERWORLD / TRAVEL_MINIGAME = bottom-left (near the bus), everything else = bottom-center
  const isOverworld =
    currentScene === GAME_PHASES.OVERWORLD ||
    currentScene === GAME_PHASES.TRAVEL_MINIGAME
  const positionClassName = isOverworld
    ? 'fixed bottom-28 left-8 pointer-events-none w-[min(22rem,85vw)]'
    : 'fixed bottom-16 left-1/2 -translate-x-1/2 pointer-events-none w-[min(24rem,90vw)]'

  // Re-evaluate placement whenever the visible message set changes.
  const revision = messages.map((m: ChatterMessageData) => m.id).join(',')
  const ref = useNonOverlappingPosition(isOverworld, revision)

  return (
    <div
      ref={ref}
      className={`${positionClassName} z-(--z-chatter) max-sm:z-(--z-chatter-mobile)`}
      role='status'
      aria-live='polite'
    >
      <AnimatePresence mode='popLayout'>
        {messages.map((msg: ChatterMessageData) => (
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
