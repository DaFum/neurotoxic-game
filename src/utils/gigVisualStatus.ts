import { finiteNumberOr } from './finiteNumber'
import type { GigHUDStats } from '../types/rhythmGame'

/**
 * Represents the derived visual danger and highlight states for the Gig HUD.
 */
export type GigVisualStatus = {
  healthDanger: boolean
  overloadDanger: boolean
  overloadCritical: boolean
  comboTier: 'none' | 'low' | 'high'
  comboPulsing: boolean
  corruptionDanger: boolean
  lowAccuracy: boolean
}

/**
 * Derives visual status flags from the raw rhythm game statistics.
 *
 * @remarks
 * This function calculates warning thresholds for HUD elements like health, overload,
 * combo, and corruption. It coerces invalid or missing numbers to safe defaults
 * before evaluating thresholds to prevent NaN-induced logic errors during gameplay.
 *
 * @param stats - The current raw performance statistics from the rhythm game.
 * @returns An object containing boolean flags and tier strings representing the current visual hazard state.
 */
export const deriveGigVisualStatus = (stats: GigHUDStats): GigVisualStatus => {
  const health = finiteNumberOr(stats.health, 100)
  const overload = finiteNumberOr(stats.overload, 0)
  const combo = finiteNumberOr(stats.combo, 0)
  const corruptionLevel = finiteNumberOr(stats.corruptionLevel, 0)
  const accuracy = finiteNumberOr(stats.accuracy, 100)

  return {
    healthDanger: health < 20,
    overloadDanger: overload > 80,
    overloadCritical: overload > 90,
    comboTier: combo >= 50 ? 'high' : combo >= 20 ? 'low' : 'none',
    comboPulsing: combo >= 50,
    corruptionDanger: corruptionLevel > 80,
    lowAccuracy: accuracy < 70
  }
}
