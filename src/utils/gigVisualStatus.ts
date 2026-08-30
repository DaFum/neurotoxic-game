import { finiteNumberOr } from './finiteNumber'
import type { GigHUDStats } from '../types/rhythmGame'

export type GigVisualStatus = {
  healthDanger: boolean
  overloadDanger: boolean
  overloadCritical: boolean
  comboTier: 'none' | 'low' | 'high'
  comboPulsing: boolean
  corruptionDanger: boolean
  lowAccuracy: boolean
}

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
