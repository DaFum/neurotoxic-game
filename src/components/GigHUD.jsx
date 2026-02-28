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
import { HazardTicker } from '../ui/shared'
import { VoidSkullIcon, UIFrameCorner } from '../ui/shared/Icons'
import { useTranslation } from 'react-i18next'

export const GigHUD = memo(function GigHUD({
  stats,
  onLaneInput,
  gameStateRef,
  onTogglePause
}) {
  const { t } = useTranslation()
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

      {/* Hazard Ticker - shown dynamically based on modifiers (if any) or fixed toxic mode */}
      {isToxicMode && (
        <div className="absolute top-0 w-full z-20">
          <HazardTicker message={t('ui:hazard.toxicOverload', 'TOXIC OVERLOAD DETECTED // SEVERE SYSTEM STRESS // STAY FOCUSED')} />
        </div>
      )}

      <PauseButton onTogglePause={onTogglePause} isGameOver={isGameOver} />

      <LaneInputArea onLaneInput={onLaneInput} />

      {/* Flashing Warning Skull on High Overload */}
      {(overload > 90 || isToxicMode) && (
        <div className="absolute top-1/4 right-8 z-20 opacity-50 pointer-events-none">
          <VoidSkullIcon className="w-32 h-32 text-(--blood-red) animate-pulse" />
        </div>
      )}

      {/* Stats Overlay */}
      <div className='absolute top-32 left-4 z-10 text-(--star-white) font-mono pointer-events-none p-4 relative group'>
        <UIFrameCorner className="absolute top-0 left-0 w-4 h-4 text-(--ash-gray) opacity-50" />
        <UIFrameCorner className="absolute top-0 right-0 w-4 h-4 text-(--ash-gray) rotate-90 opacity-50" />
        <UIFrameCorner className="absolute bottom-0 right-0 w-4 h-4 text-(--ash-gray) rotate-180 opacity-50" />
        <UIFrameCorner className="absolute bottom-0 left-0 w-4 h-4 text-(--ash-gray) -rotate-90 opacity-50" />

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
