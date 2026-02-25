import { memo } from 'react'
import PropTypes from 'prop-types'
import { HecklerOverlay } from './HecklerOverlay'
import { LaneInputArea } from './hud/LaneInputArea'
import { ScoreDisplay } from './hud/ScoreDisplay'
import { ComboDisplay } from './hud/ComboDisplay'
import { OverloadMeter } from './hud/OverloadMeter'
import { HealthBar } from './hud/HealthBar'
import { ControlsHint } from './hud/ControlsHint'
import { PauseButton } from './hud/PauseButton'
import { ToxicModeFlash } from './hud/ToxicModeFlash'
import { GameOverOverlay } from './hud/GameOverOverlay'

export const GigHUD = memo(function GigHUD({ stats, onLaneInput, gameStateRef, onTogglePause }) {
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

      <PauseButton onTogglePause={onTogglePause} isGameOver={isGameOver} />

      <LaneInputArea onLaneInput={onLaneInput} />

      {/* Stats Overlay */}
      <div className='absolute top-32 left-4 z-10 text-(--star-white) font-mono pointer-events-none'>
        <ScoreDisplay score={score} />
        <ComboDisplay combo={combo} accuracy={accuracy} />
        <OverloadMeter overload={overload} />
      </div>

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
