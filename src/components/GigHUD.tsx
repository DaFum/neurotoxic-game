import { memo } from 'react'
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

interface GigHUDStats {
  score: number
  combo: number
  health: number
  overload: number
  isGameOver: boolean
  accuracy?: number
  isToxicMode?: boolean
  corruptionLevel?: number
  isCorruptionBurstActive?: boolean
}

interface GigHUDProps {
  stats: GigHUDStats
  onLaneInput?: (laneIndex: number, isDown: boolean, now?: number) => void
  gameStateRef: { current: { projectiles?: unknown[] } | null }
  onTogglePause?: () => void
}

/**
 * Composes the live gig overlay for input lanes, stats, hazards, and pause/game-over controls.
 * @param props - Current gig stats, input callbacks, projectile state ref, and pause callback.
 */
export const GigHUD = memo(function GigHUD({
  stats,
  onLaneInput,
  gameStateRef,
  onTogglePause
}: GigHUDProps) {
  const {
    score,
    combo,
    health,
    overload,
    isGameOver,
    accuracy = 100,
    isToxicMode = false,
    corruptionLevel = 0,
    isCorruptionBurstActive = false
  } = stats

  return (
    <div className='absolute inset-0 z-(--z-stage-overlay) pointer-events-none'>
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
        corruptionLevel={corruptionLevel}
        isCorruptionBurstActive={isCorruptionBurstActive}
      />

      <HealthBar health={health} isToxicMode={isToxicMode} />

      <ControlsHint />

      <GameOverOverlay isGameOver={isGameOver} />
    </div>
  )
})
