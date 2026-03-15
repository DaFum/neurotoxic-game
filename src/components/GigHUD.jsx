import { memo } from 'react'
import PropTypes from 'prop-types'
import { HecklerOverlay } from './HecklerOverlay'
import { LaneInputArea } from './hud/LaneInputArea'
import { HealthBar } from './hud/HealthBar'
import { ControlsHint } from './hud/ControlsHint'
import { PauseButton } from './hud/PauseButton'
import { ToxicModeFlash } from './hud/ToxicModeFlash'
import { GameOverOverlay } from './hud/GameOverOverlay'
import { StatsOverlay } from './hud/StatsOverlay'
import { ToxicHazardTicker } from './hud/ToxicHazardTicker'
import { OverloadWarning } from './hud/OverloadWarning'

export const GigHUD = memo(function GigHUD({
  stats,
  onLaneInput,
  gameStateRef,
  onTogglePause
}) {
  const {
    score,
    combo,
    health,
    overload,
    isGameOver,
    accuracy = 100,
    isToxicMode = false
  } = stats

  return (
    <div className='absolute inset-0 z-30 pointer-events-none'>
      <ToxicModeFlash isToxicMode={isToxicMode} />

      <HecklerOverlay gameStateRef={gameStateRef} />

      <ToxicHazardTicker isToxicMode={isToxicMode} />

      <PauseButton onTogglePause={onTogglePause} isGameOver={isGameOver} />

      <LaneInputArea onLaneInput={onLaneInput} />

      <OverloadWarning overload={overload} isToxicMode={isToxicMode} />

      <StatsOverlay
        score={score}
        combo={combo}
        accuracy={accuracy}
        overload={overload}
      />

      <HealthBar health={health} isToxicMode={isToxicMode} />

      <ControlsHint />

      <GameOverOverlay isGameOver={isGameOver} />
    </div>
  )
})

GigHUD.propTypes = {
  stats: PropTypes.shape({
    score: PropTypes.number.isRequired,
    combo: PropTypes.number.isRequired,
    health: PropTypes.number.isRequired,
    overload: PropTypes.number.isRequired,
    isGameOver: PropTypes.bool.isRequired,
    accuracy: PropTypes.number.isRequired,
    isToxicMode: PropTypes.bool
  }).isRequired,
  onLaneInput: PropTypes.func,
  gameStateRef: PropTypes.shape({
    current: PropTypes.shape({
      projectiles: PropTypes.array
    })
  }).isRequired,
  onTogglePause: PropTypes.func
}
