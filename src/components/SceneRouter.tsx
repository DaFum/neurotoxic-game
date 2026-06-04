import { lazy } from 'react'
import { MainMenu } from '../scenes/MainMenu.tsx'
import { GAME_PHASES, MINIGAME_TYPES } from '../context/gameConstants'
import type { MinigameType } from '../types/game'

const ClinicScene = lazy(() =>
  import('../scenes/ClinicScene.tsx').then(m => ({ default: m.ClinicScene }))
)
const Overworld = lazy(() =>
  import('../scenes/Overworld.tsx').then(m => ({ default: m.Overworld }))
)
const Gig = lazy(() =>
  import('../scenes/Gig.tsx').then(m => ({ default: m.Gig }))
)
const PreGig = lazy(() =>
  import('../scenes/PreGig.tsx').then(m => ({ default: m.PreGig }))
)
const PostGig = lazy(() =>
  import('../scenes/PostGig.tsx').then(m => ({ default: m.PostGig }))
)
const TourbusScene = lazy(() =>
  import('../scenes/TourbusScene.tsx').then(m => ({
    default: m.TourbusScene
  }))
)
const RoadieRunScene = lazy(() =>
  import('../scenes/RoadieRunScene.tsx').then(m => ({
    default: m.RoadieRunScene
  }))
)
const KabelsalatScene = lazy(() =>
  import('../scenes/KabelsalatScene.tsx').then(m => ({
    default: m.KabelsalatScene
  }))
)
const AmpCalibrationScene = lazy(() =>
  import('../scenes/AmpCalibrationScene.tsx').then(m => ({
    default: m.AmpCalibrationScene
  }))
)
const Settings = lazy(() =>
  import('../scenes/Settings.tsx').then(m => ({ default: m.Settings }))
)
const Credits = lazy(() =>
  import('../scenes/Credits.tsx').then(m => ({ default: m.Credits }))
)
const GameOver = lazy(() =>
  import('../scenes/GameOver.tsx').then(m => ({ default: m.GameOver }))
)
const IntroVideo = lazy(() =>
  import('../scenes/IntroVideo.tsx').then(m => ({ default: m.IntroVideo }))
)
const AssetsScene = lazy(() =>
  import('./assets/AssetsScene.tsx').then(m => ({ default: m.AssetsScene }))
)

type ScenePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES]

interface SceneRouterProps {
  currentScene: ScenePhase
  minigameType?: MinigameType | null
}

/**
 * Routes the current scene state to the corresponding scene component.
 *
 * @param props - The component props.
 * - `props.currentScene` - The active scene identifier.
 * - `props.minigameType` - Optional. The type of minigame (if applicable).
 * @returns The active scene component.
 */
export function SceneRouter({ currentScene, minigameType }: SceneRouterProps) {
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
    case GAME_PHASES.ASSETS:
      return <AssetsScene />
    case GAME_PHASES.TRAVEL_MINIGAME:
      return <TourbusScene />
    case GAME_PHASES.PRE_GIG:
      return <PreGig />
    case GAME_PHASES.PRE_GIG_MINIGAME:
      if (minigameType === MINIGAME_TYPES.KABELSALAT) {
        return <KabelsalatScene />
      }
      if (minigameType === MINIGAME_TYPES.AMP_CALIBRATION) {
        return <AmpCalibrationScene />
      }
      return <RoadieRunScene />
    case GAME_PHASES.GIG:
    case GAME_PHASES.PRACTICE:
      return <Gig />
    case GAME_PHASES.POST_GIG:
      return <PostGig />
    default:
      return <MainMenu />
  }
}
