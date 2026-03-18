import { lazy } from 'react'
import { MainMenu } from '../scenes/MainMenu.jsx'
import { createNamedLazyLoader } from '../utils/lazySceneLoader.js'
import { GAME_PHASES, MINIGAME_TYPES } from '../context/gameConstants.js'

const ClinicScene = lazy(
  createNamedLazyLoader(() => import('../scenes/ClinicScene.jsx'), 'ClinicScene')
)
const Overworld = lazy(
  createNamedLazyLoader(() => import('../scenes/Overworld.jsx'), 'Overworld')
)
const Gig = lazy(createNamedLazyLoader(() => import('../scenes/Gig.jsx'), 'Gig'))
const PreGig = lazy(
  createNamedLazyLoader(() => import('../scenes/PreGig.jsx'), 'PreGig')
)
const PostGig = lazy(
  createNamedLazyLoader(() => import('../scenes/PostGig.jsx'), 'PostGig')
)
const TourbusScene = lazy(
  createNamedLazyLoader(() => import('../scenes/TourbusScene.jsx'), 'TourbusScene')
)
const RoadieRunScene = lazy(
  createNamedLazyLoader(
    () => import('../scenes/RoadieRunScene.jsx'),
    'RoadieRunScene'
  )
)
const KabelsalatScene = lazy(
  createNamedLazyLoader(
    () => import('../scenes/KabelsalatScene.jsx'),
    'KabelsalatScene'
  )
)
const Settings = lazy(
  createNamedLazyLoader(() => import('../scenes/Settings.jsx'), 'Settings')
)
const Credits = lazy(
  createNamedLazyLoader(() => import('../scenes/Credits.jsx'), 'Credits')
)
const GameOver = lazy(
  createNamedLazyLoader(() => import('../scenes/GameOver.jsx'), 'GameOver')
)
const IntroVideo = lazy(
  createNamedLazyLoader(() => import('../scenes/IntroVideo.jsx'), 'IntroVideo')
)

/**
 * Routes the current scene state to the corresponding scene component.
 *
 * @param {Object} props - The component props.
 * @param {string} props.currentScene - The active scene identifier.
 * @param {string} [props.minigameType] - The type of minigame (if applicable).
 * @returns {JSX.Element} The active scene component.
 */
export function SceneRouter({ currentScene, minigameType }) {
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
      return minigameType === MINIGAME_TYPES.KABELSALAT ? (
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
