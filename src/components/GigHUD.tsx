import { memo } from 'react'
import { deriveGigVisualStatus } from '../utils/gigVisualStatus'
import { HecklerOverlay } from './HecklerOverlay'
import { LaneInputArea } from '../ui/hud/LaneInputArea'
import { HealthBar } from '../ui/hud/HealthBar'
import { ControlsHint } from '../ui/hud/ControlsHint'
import { GigControlsCluster } from '../ui/hud/GigControlsCluster'
import { ToxicModeFlash } from '../ui/hud/ToxicModeFlash'
import { GameOverOverlay } from '../ui/hud/GameOverOverlay'
import { StatsOverlay } from '../ui/hud/StatsOverlay'
import { ToxicHazardTicker } from '../ui/hud/ToxicHazardTicker'
import { OverloadWarning } from '../ui/hud/OverloadWarning'
import { OverloadMeter } from '../ui/hud/OverloadMeter'
import { CorruptionMeter } from '../ui/hud/CorruptionMeter'
import { GigPedalControls } from '../ui/hud/GigPedalControls'
import type { GigHUDStats } from '../types/rhythmGame'

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

  const visualStatus = deriveGigVisualStatus(stats)

  return (
    <div className='absolute inset-0 z-(--z-stage-overlay) pointer-events-none'>
      <ToxicModeFlash isToxicMode={isToxicMode} />

      <HecklerOverlay gameStateRef={gameStateRef} />

      <ToxicHazardTicker isToxicMode={isToxicMode} />

      <GigControlsCluster
        onTogglePause={onTogglePause}
        isGameOver={isGameOver}
      />

      <LaneInputArea onLaneInput={onLaneInput} />

      <OverloadWarning
        isCritical={visualStatus.overloadCritical}
        isToxicMode={isToxicMode}
      />

      {/* Top-edge meter bar. */}
      <div
        data-chatter-avoid=''
        className='absolute top-3 right-20 z-(--z-stage-overlay) flex items-start gap-3 pointer-events-none max-sm:top-18 max-sm:right-3 max-sm:flex-col max-sm:items-end max-sm:scale-75 max-sm:origin-top-right'
      >
        <OverloadMeter
          overload={overload}
          isDanger={visualStatus.overloadDanger}
        />
        <CorruptionMeter
          corruptionLevel={corruptionLevel}
          isCorruptionBurstActive={isCorruptionBurstActive}
          isDanger={visualStatus.corruptionDanger}
        />
      </div>

      <GigPedalControls className='absolute top-24 right-3 z-(--z-stage-overlay) flex flex-col items-end gap-2 pointer-events-none text-xs font-mono max-sm:top-28' />

      <StatsOverlay score={score} combo={combo} accuracy={accuracy} />

      <HealthBar
        health={health}
        isToxicMode={isToxicMode}
        isDanger={visualStatus.healthDanger}
      />

      <ControlsHint isToxicMode={isToxicMode} />

      <GameOverOverlay isGameOver={isGameOver} />
    </div>
  )
})
