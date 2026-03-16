// TODO: Implement this
import { lazy, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MainMenu } from './scenes/MainMenu'
import { HUD } from './ui/HUD'
import { EventModal } from './ui/EventModal'
import { ToastOverlay } from './ui/ToastOverlay'
import { DebugLogViewer } from './ui/DebugLogViewer'
import { TutorialManager } from './components/TutorialManager'
import { ChatterOverlay } from './components/ChatterOverlay'
import { GameStateProvider, useGameState } from './context/GameState'
import { ErrorBoundary } from './ui/CrashHandler'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { createNamedLazyLoader } from './utils/lazySceneLoader'
import { GAME_PHASES, MINIGAME_TYPES } from './context/gameConstants'

const SCENES_WITHOUT_HUD = [
  GAME_PHASES.INTRO,
  GAME_PHASES.MENU,
  GAME_PHASES.SETTINGS,
  GAME_PHASES.CREDITS,
  GAME_PHASES.GAMEOVER,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME,
  GAME_PHASES.CLINIC
]

const ClinicScene = lazy(
  createNamedLazyLoader(() => import('./scenes/ClinicScene'), 'ClinicScene')
)
const Overworld = lazy(
  createNamedLazyLoader(() => import('./scenes/Overworld'), 'Overworld')
)
const Gig = lazy(createNamedLazyLoader(() => import('./scenes/Gig'), 'Gig'))
const PreGig = lazy(
  createNamedLazyLoader(() => import('./scenes/PreGig'), 'PreGig')
)
const PostGig = lazy(
  createNamedLazyLoader(() => import('./scenes/PostGig'), 'PostGig')
)
const TourbusScene = lazy(
  createNamedLazyLoader(() => import('./scenes/TourbusScene'), 'TourbusScene')
)
const RoadieRunScene = lazy(
  createNamedLazyLoader(
    () => import('./scenes/RoadieRunScene'),
    'RoadieRunScene'
  )
)
const KabelsalatScene = lazy(
  createNamedLazyLoader(
    () => import('./scenes/KabelsalatScene'),
    'KabelsalatScene'
  )
)
const Settings = lazy(
  createNamedLazyLoader(() => import('./scenes/Settings'), 'Settings')
)
const Credits = lazy(
  createNamedLazyLoader(() => import('./scenes/Credits'), 'Credits')
)
const GameOver = lazy(
  createNamedLazyLoader(() => import('./scenes/GameOver'), 'GameOver')
)
const IntroVideo = lazy(
  createNamedLazyLoader(() => import('./scenes/IntroVideo'), 'IntroVideo')
)

const SceneLoadingFallback = () => {
  const { t } = useTranslation()
  return (
    <div className='absolute inset-0 z-30 flex items-center justify-center pointer-events-none'>
      <div className='border-2 border-toxic-green bg-void-black/90 px-6 py-3 font-mono text-toxic-green tracking-widest uppercase'>
        {t('ui:scene.loading', { defaultValue: 'Loading Scene...' })}
      </div>
    </div>
  )
}

/**
 * Wählt basierend auf dem aktuellen Spielzustand die passende Szene aus und rendert diese zusammen mit globalen Overlays und Hilfekomponenten (HUD, Toasts, ChatterOverlay, TutorialManager, EventModal) sowie Telemetrie-Komponenten.
 *
 * Rendert außerdem Lade-, Fehler- und Entwicklungs-Tools (SceneLoadingFallback, ErrorBoundary, DebugLogViewer) und sorgt für Übergangsanimationen zwischen Szenen.
 *
 * @returns {JSX.Element} Das gerenderte React-Element, das die aktive Szene und alle globalen Overlays/Hilfekomponenten enthält.
 */
function GameContent() {
  const gameState = useGameState()
  const { currentScene, activeEvent, resolveEvent, setActiveEvent, settings } =
    gameState

  /**
   * Renders the component corresponding to the current scene state.
   * @returns {JSX.Element} The active scene component.
   */
  const renderScene = () => {
    switch (currentScene) {
      case GAME_PHASES.INTRO:
        return <IntroVideo />
      case GAME_PHASES.MENU:
        return <MainMenu />
      case GAME_PHASES.SETTINGS:
        return <Settings />
      case GAME_PHASES.CREDITS:
        return <Credits />
      case GAME_PHASES.GAMEOVER:
        return <GameOver />
      case GAME_PHASES.OVERWORLD:
        return <Overworld />
      case GAME_PHASES.CLINIC:
        return <ClinicScene />
      case GAME_PHASES.TRAVEL_MINIGAME:
        return <TourbusScene />
      case GAME_PHASES.PRE_GIG:
        return <PreGig />
      case GAME_PHASES.PRE_GIG_MINIGAME:
        return gameState.minigame?.type === MINIGAME_TYPES.KABELSALAT ? (
          <KabelsalatScene />
        ) : (
          <RoadieRunScene />
        )
      case GAME_PHASES.GIG:
      case GAME_PHASES.PRACTICE:
        return <Gig />
      case GAME_PHASES.POST_GIG:
        return <PostGig />
      default:
        return <MainMenu />
    }
  }

  // Construct a safe, read-only slice of state for ChatterOverlay
  // This avoids passing dispatch functions which violates the component's contract
  const chatterState = useMemo(
    () => ({
      currentScene,
      band: gameState.band,
      player: gameState.player,
      gameMap: gameState.gameMap,
      social: gameState.social,
      lastGigStats: gameState.lastGigStats
    }),
    [
      currentScene,
      gameState.band,
      gameState.player,
      gameState.gameMap,
      gameState.social,
      gameState.lastGigStats
    ]
  )

  return (
    <div className='game-container relative w-full h-full overflow-hidden bg-void-black text-toxic-green'>
      {settings.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-(--z-crt) mix-blend-overlay opacity-50' />
      )}

      {/* Hide HUD in Intro/Menu/Settings/Credits/GameOver */}
      {!SCENES_WITHOUT_HUD.includes(currentScene) && <HUD />}

      <ToastOverlay />

      {/* ChatterOverlay receives read-only state slice */}
      <ChatterOverlay gameState={chatterState} />

      <TutorialManager />
      {import.meta.env.DEV && <DebugLogViewer />}

      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          onOptionSelect={resolveEvent}
          onClose={() => setActiveEvent(null)}
        />
      )}

      <ErrorBoundary>
        <Suspense fallback={<SceneLoadingFallback />}>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentScene}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className='w-full h-full'
            >
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

/**
 * Root Application Component.
 * Wraps the game in the GameStateProvider.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <GameStateProvider>
        <GameContent />
      </GameStateProvider>
    </ErrorBoundary>
  )
}
