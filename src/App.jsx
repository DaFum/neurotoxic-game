import { lazy, Suspense } from 'react'
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

const SCENES_WITHOUT_HUD = ['INTRO', 'MENU', 'SETTINGS', 'CREDITS', 'GAMEOVER']

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
  const { currentScene, activeEvent, resolveEvent, settings } = useGameState()
  const gameState = useGameState() // Get full state to pass to ChatterOverlay

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
      case 'PREGIG':
        return <PreGig />
      case 'GIG':
        return <Gig />
      case 'POSTGIG':
        return <PostGig />
      default:
        return <MainMenu />
    }
  }

  return (
    <div className='game-container relative w-full h-full overflow-hidden bg-(--void-black) text-(--toxic-green)'>
      {settings.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}

      {/* Hide HUD in Intro/Menu/Settings/Credits/GameOver */}
      {!SCENES_WITHOUT_HUD.includes(currentScene) && <HUD />}

      <ToastOverlay />

      {/* ChatterOverlay receives state as prop, removing internal context dependency */}
      <ChatterOverlay
        gameState={gameState}
        performance={0} // Default value since global state doesn't track high-freq gig stats
        combo={0}
      />

      <TutorialManager />
      {import.meta.env.DEV && <DebugLogViewer />}

      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal event={activeEvent} onOptionSelect={resolveEvent} />
      )}

      <Suspense fallback={<SceneLoadingFallback />}>{renderScene()}</Suspense>
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
