import { Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
import { GAME_PHASES } from './context/gameConstants'
import { SceneRouter } from './components/SceneRouter.tsx'
import type { GamePhase } from './types/game'

const SCENES_WITHOUT_HUD: Set<GamePhase> = new Set([
  GAME_PHASES.INTRO,
  GAME_PHASES.MENU,
  GAME_PHASES.SETTINGS,
  GAME_PHASES.CREDITS,
  GAME_PHASES.GAMEOVER,
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME,
  GAME_PHASES.CLINIC
])

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
  const { currentScene, activeEvent, resolveEvent, settings } = gameState

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

      {/* Hide global HUD in scenes that provide their own overlays or no HUD UI. */}
      {!SCENES_WITHOUT_HUD.has(currentScene) && <HUD />}

      <ToastOverlay />

      {/* ChatterOverlay receives read-only state slice */}
      <ChatterOverlay gameState={chatterState} />

      <TutorialManager />
      {import.meta.env.DEV && <DebugLogViewer />}

      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal event={activeEvent} onOptionSelect={resolveEvent} />
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
              <SceneRouter
                currentScene={currentScene}
                minigameType={gameState.minigame?.type}
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
