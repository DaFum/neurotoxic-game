import { Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { HUD } from './ui/HUD'
import { EventModal } from './ui/EventModal'
import { ToastOverlay } from './ui/ToastOverlay'
import { DebugLogViewer } from './ui/DebugLogViewer'
import { TutorialManager } from './components/TutorialManager'
import { ChatterOverlay } from './components/ChatterOverlay'
import ReloadPrompt from './components/ReloadPrompt'
import {
  GameStateProvider,
  useGameSelector,
  useGameActions
} from './context/GameState'
import { ErrorBoundary } from './ui/CrashHandler'
import { NetworkStatusProvider } from './hooks/useNetworkStatus'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { GAME_PHASES } from './context/gameConstants'
import { SceneRouter } from './components/SceneRouter.tsx'
import { AssetNotifications } from './components/assets/AssetNotifications'
import type { GamePhase } from './types/game'

const SCENES_WITHOUT_HUD: Set<GamePhase> = new Set([
  GAME_PHASES.INTRO,
  GAME_PHASES.MENU,
  GAME_PHASES.CREDITS,
  GAME_PHASES.GAMEOVER,
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME,
  GAME_PHASES.CLINIC,
  GAME_PHASES.ASSETS
])

/**
 * Resolves whether Vercel telemetry should be enabled based on environment variables.
 *
 * @remarks
 * Checks Vite injected environment, process environment variables, and the Node environment
 * to safely determine telemetry status across build types and execution contexts.
 *
 * @returns A boolean indicating whether telemetry is globally active.
 */
const resolveVercelTelemetryEnabled = () => {
  const viteFlag = import.meta.env?.VITE_ENABLE_VERCEL_TELEMETRY
  if (typeof viteFlag === 'string') {
    return viteFlag.toLowerCase() === 'true'
  }

  const processFlag =
    typeof process !== 'undefined'
      ? process?.env?.VITE_ENABLE_VERCEL_TELEMETRY
      : undefined
  if (typeof processFlag === 'string') {
    return processFlag.toLowerCase() === 'true'
  }

  const nodeEnv =
    typeof process !== 'undefined' ? process?.env?.NODE_ENV : undefined
  if (nodeEnv === 'test') {
    return true
  }

  return import.meta.env?.PROD ?? false
}
const VERCEL_TELEMETRY_ENABLED = resolveVercelTelemetryEnabled()

/**
 * Provides a highly visible, styled fallback UI during asynchronous scene module loading.
 *
 * @returns A React functional component rendering a toxic-green loading text element.
 */
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
 * Renders global overlays around the scene selected by `SceneRouter`.
 *
 * @remarks
 * `GameContent` owns HUD, toast, chatter, tutorial, event modal, error-boundary,
 * loading, transition, debug, and telemetry surfaces. Scene selection itself is
 * delegated to `SceneRouter`.
 *
 * @returns The active scene wrapped with global overlays and diagnostics.
 */
function GameContent() {
  const currentScene = useGameSelector(state => state.currentScene)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const settings = useGameSelector(state => state.settings)
  const minigameType = useGameSelector(state => state.minigame?.type)

  const { resolveEvent } = useGameActions()

  return (
    <div className='game-container relative w-full h-full overflow-hidden bg-void-black text-toxic-green'>
      {settings.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-(--z-crt) mix-blend-overlay opacity-50' />
      )}

      {/* Hide global HUD in scenes that provide their own overlays or no HUD UI. */}
      {!SCENES_WITHOUT_HUD.has(currentScene) && <HUD />}

      <ToastOverlay />
      <ReloadPrompt />

      <ChatterOverlay />

      <TutorialManager />
      {import.meta.env.DEV && <DebugLogViewer />}

      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal event={activeEvent} onOptionSelect={resolveEvent} />
      )}

      {/* Global asset risk/foreclosure modals: advanceDay can raise these from
          any scene, so they are owned here rather than inside AssetsScene. */}
      <AssetNotifications />

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
              <SceneRouter
                currentScene={currentScene}
                minigameType={minigameType}
              />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>
      {VERCEL_TELEMETRY_ENABLED && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </div>
  )
}

/**
 * Root application component.
 *
 * @remarks
 * Wraps the main game content tree in required context providers such as the ErrorBoundary,
 * NetworkStatusProvider, and GameStateProvider. Also injects global non-interactive elements like the noise overlay.
 *
 * @returns The fully wrapped and initialized game application.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <div className='noise-overlay pointer-events-none mix-blend-overlay'></div>
      <NetworkStatusProvider>
        <GameStateProvider>
          <GameContent />
        </GameStateProvider>
      </NetworkStatusProvider>
    </ErrorBoundary>
  )
}
