/*
 * REVIEW
 * #1 Actual updates:
 *    Extracted SceneRouter component and its lazy-loaded scene imports from App.tsx into this dedicated file.
 *    Added strict TypeScript prop typing using enums for currentScene and minigameType.
 * #2 Next steps and ideas to develop further:
 *    Consider dynamic loading of scene configurations from a data file, or creating nested routers for complex minigames.
 * #3 Found errors + solutions:
 *    None during extraction.
 */

import { lazy } from 'react'
import { MainMenu } from '../scenes/MainMenu.tsx'
import { GAME_PHASES, MINIGAME_TYPES } from '../context/gameConstants'

const ClinicScene = lazy(() => import('../scenes/ClinicScene.tsx'))
const Overworld = lazy(() => import('../scenes/Overworld.tsx'))
const Gig = lazy(() => import('../scenes/Gig.tsx'))
const PreGig = lazy(() => import('../scenes/PreGig.tsx'))
const PostGig = lazy(() => import('../scenes/PostGig.tsx'))
const TourbusScene = lazy(() =>
  import('../scenes/TourbusScene.tsx').catch(error => {
    console.error('[TourbusScene lazy import failed]', error)
    throw error
  })
)
const RoadieRunScene = lazy(() => import('../scenes/RoadieRunScene.tsx'))
const KabelsalatScene = lazy(() => import('../scenes/KabelsalatScene.tsx'))
const AmpCalibrationScene = lazy(
  () => import('../scenes/AmpCalibrationScene.tsx')
)
const Settings = lazy(() => import('../scenes/Settings.tsx'))
const Credits = lazy(() => import('../scenes/Credits.tsx'))
const GameOver = lazy(() => import('../scenes/GameOver.tsx'))
const IntroVideo = lazy(() => import('../scenes/IntroVideo.tsx'))

type ScenePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES]
type MinigameType = (typeof MINIGAME_TYPES)[keyof typeof MINIGAME_TYPES]

interface SceneRouterProps {
  currentScene: ScenePhase
  minigameType?: MinigameType | null
}

/**
 * Routes the current scene state to the corresponding scene component.
 *
 * @param {Object} props - The component props.
 * @param {string} props.currentScene - The active scene identifier.
 * @param {string} [props.minigameType] - The type of minigame (if applicable).
 * @returns {JSX.Element} The active scene component.
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
      if (minigameType === MINIGAME_TYPES.ROADIE) {
        return <RoadieRunScene />
      }
      return <Gig />
    case GAME_PHASES.GIG:
    case GAME_PHASES.PRACTICE:
      return <Gig />
    case GAME_PHASES.POST_GIG:
      return <PostGig />
    default:
      return <MainMenu />
  }
}
