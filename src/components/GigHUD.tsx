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
import { OverloadMeter } from './hud/OverloadMeter'
import { CorruptionMeter } from './hud/CorruptionMeter'

interface GigHUDStats {
  /** The player's current accumulated score for the active gig. */
  score: number
  /** The current consecutive sequence of correctly hit notes. */
  combo: number
  /** The remaining crowd energy or health pool of the player. */
  health: number
  /** The current toxic overload accumulation percentage. */
  overload: number
  /** Indicates whether the gig has entered a terminal failure state. */
  isGameOver: boolean
  /** The hit accuracy percentage across all resolved notes in the current gig. */
  accuracy?: number
  /** Indicates whether the environmental toxic modifier is currently active. */
  isToxicMode?: boolean
  /** The decibel corruption level accumulated during gameplay. */
  corruptionLevel?: number
  /** Indicates whether a corruption burst sequence is actively executing. */
  isCorruptionBurstActive?: boolean
}

interface GigHUDProps {
  /** The consolidated gameplay statistics to visualize in the overlay. */
  stats: GigHUDStats
  /** Callback triggered when a rhythm lane receives an interaction down/up event. */
  onLaneInput?: (laneIndex: number, isDown: boolean, now?: number) => void
  /** Mutable reference containing non-reactive projectile entities for the heckler overlay. */
  gameStateRef: { current: { projectiles?: unknown[] } | null }
  /** Callback triggered when the player attempts to toggle the active pause state. */
  onTogglePause?: () => void
}

/**
 * Composes the live gig overlay for input lanes, stats, hazards, and pause/game-over controls.
 *
 * @param props - Component configuration defining stats and interactions.
 * @returns The composed HUD overlay element for active gameplay.
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

      {/* Top-edge meter bar; the global HUD hides its band-status panel during gigs to free this space. */}
      <div className='absolute top-3 right-20 z-(--z-stage-overlay) flex items-start gap-3 pointer-events-none max-sm:right-16 max-sm:flex-col max-sm:items-end max-sm:scale-75 max-sm:origin-top-right'>
        <OverloadMeter overload={overload} />
        <CorruptionMeter
          corruptionLevel={corruptionLevel}
          isCorruptionBurstActive={isCorruptionBurstActive}
        />
      </div>

      <StatsOverlay score={score} combo={combo} accuracy={accuracy} />

      <HealthBar health={health} isToxicMode={isToxicMode} />

      <ControlsHint />

      <GameOverOverlay isGameOver={isGameOver} />
    </div>
  )
})
