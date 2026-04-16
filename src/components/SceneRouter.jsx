/*
 * REVIEW
 * #1 Actual updates:
 *    Extracted SceneRouter component and its lazy-loaded scene imports from App.jsx into this dedicated file.
 *    Added strict PropTypes validation using enums for currentScene and minigameType.
 * #2 Next steps and ideas to develop further:
 *    Consider dynamic loading of scene configurations from a data file, or creating nested routers for complex minigames.
 * #3 Found errors + solutions:
 *    None during extraction.
 */

import { lazy } from 'react'
import PropTypes from 'prop-types'
import { MainMenu } from '../scenes/MainMenu.jsx'
import { GAME_PHASES, MINIGAME_TYPES } from '../context/gameConstants.js'

const ClinicScene = lazy(() => import('../scenes/ClinicScene.jsx'))
const Overworld = lazy(() => import('../scenes/Overworld.jsx'))
const Gig = lazy(() => import('../scenes/Gig.jsx'))
const PreGig = lazy(() => import('../scenes/PreGig.jsx'))
const PostGig = lazy(() => import('../scenes/PostGig.jsx'))
const TourbusScene = lazy(() => import('../scenes/TourbusScene.jsx'))
const RoadieRunScene = lazy(() => import('../scenes/RoadieRunScene.jsx'))
const KabelsalatScene = lazy(() => import('../scenes/KabelsalatScene.jsx'))
const AmpCalibrationScene = lazy(
  () => import('../scenes/AmpCalibrationScene.jsx')
)
const Settings = lazy(() => import('../scenes/Settings.jsx'))
const Credits = lazy(() => import('../scenes/Credits.jsx'))
const GameOver = lazy(() => import('../scenes/GameOver.jsx'))
const IntroVideo = lazy(() => import('../scenes/IntroVideo.jsx'))

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

SceneRouter.propTypes = {
  currentScene: PropTypes.oneOf(Object.values(GAME_PHASES)).isRequired,
  minigameType: PropTypes.oneOf(Object.values(MINIGAME_TYPES))
}
