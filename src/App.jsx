import { lazy, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import { GAME_PHASES } from './context/gameConstants'

const SCENES_WITHOUT_HUD = ['INTRO', 'MENU', 'SETTINGS', 'CREDITS', 'GAMEOVER', GAME_PHASES.TRAVEL_MINIGAME, GAME_PHASES.PRE_GIG_MINIGAME]

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
  createNamedLazyLoader(() => import('./scenes/RoadieRunScene'), 'RoadieRunScene')
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

const SceneLoadingFallback = () => (
  <div className='absolute inset-0 z-30 flex items-center justify-center pointer-events-none'>
    <div className='border-2 border-(--toxic-green) bg-(--void-black)/90 px-6 py-3 font-mono text-(--toxic-green) tracking-widest uppercase'>
      Loading Scene...
    </div>
  </div>
)

/**
 * Main game content wrapper that handles scene switching and global overlays.
 */
function GameContent() {
  const gameState = useGameState()
  const { currentScene, activeEvent, resolveEvent, settings } = gameState

  /**
   * Renders the component corresponding to the current scene state.
   * @returns {JSX.Element} The active scene component.
   */
  const renderScene = () => {
    switch (currentScene) {
      case 'INTRO':
        return <IntroVideo />
      case 'MENU':
        return <MainMenu />
      case 'SETTINGS':
        return <Settings />
      case 'CREDITS':
        return <Credits />
      case 'GAMEOVER':
        return <GameOver />
      case 'OVERWORLD':
        return <Overworld />
      case GAME_PHASES.TRAVEL_MINIGAME:
        return <TourbusScene />
      case 'PREGIG':
        return <PreGig />
      case GAME_PHASES.PRE_GIG_MINIGAME:
        return <RoadieRunScene />
      case 'GIG':
      case 'PRACTICE':
        return <Gig />
      case 'POSTGIG':
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
    <div className='game-container relative w-full h-full overflow-hidden bg-(--void-black) text-(--toxic-green)'>
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
        <EventModal event={activeEvent} onOptionSelect={resolveEvent} />
      )}

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
