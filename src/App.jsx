import { MainMenu } from './scenes/MainMenu'
import { Overworld } from './scenes/Overworld'
import { Gig } from './scenes/Gig'
import { PreGig } from './scenes/PreGig'
import { PostGig } from './scenes/PostGig'
import { Settings } from './scenes/Settings'
import { Credits } from './scenes/Credits'
import { GameOver } from './scenes/GameOver'
import { IntroVideo } from './scenes/IntroVideo'
import { HUD } from './ui/HUD'
import { EventModal } from './ui/EventModal'
import { ToastOverlay } from './ui/ToastOverlay'
import { DebugLogViewer } from './ui/DebugLogViewer'
import { TutorialManager } from './components/TutorialManager'
import { GameStateProvider, useGameState } from './context/GameState'
import { ErrorBoundary } from './ui/CrashHandler'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const SCENES_WITHOUT_HUD = ['INTRO', 'MENU', 'SETTINGS', 'CREDITS', 'GAMEOVER']

/**
 * Main game content wrapper that handles scene switching and global overlays.
 */
function GameContent() {
  const { currentScene, activeEvent, resolveEvent, settings } = useGameState()

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
      <TutorialManager />
      {import.meta.env.DEV && <DebugLogViewer />}

      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal event={activeEvent} onOptionSelect={resolveEvent} />
      )}

      {renderScene()}
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
