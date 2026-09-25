import { finiteNumberOr } from './finiteNumber'
import type { GigHUDStats } from '../types/rhythmGame'

/**
 * Represents the derived visual state indicators for the gig HUD.
 *
 * @remarks
 * These flags drive UI animations and alerts based on specific metric thresholds,
 * such as low health or critical overload.
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
 * Derives visual status flags from the raw gig stats.
 *
 * @remarks
 * This function evaluates the current HUD metrics and determines which threshold-based
 * UI conditions are active. Default fallback values are applied to handle missing stats.
 *
 * @param stats - The current performance and status statistics for the active gig.
 * @returns The computed visual state flags used for UI rendering.
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
