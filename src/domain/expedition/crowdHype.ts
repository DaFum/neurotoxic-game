import { clampPercent } from '../../utils/gameState/clamps'
export const getExpeditionCrowdHypeProfile = (
  rawHype: unknown
): { comboBonusMultiplier: 1 | 1.1 | 1.18 | 1.25 } => {
  const hype = clampPercent(rawHype)
  return {
    comboBonusMultiplier:
      hype >= 90 ? 1.25 : hype >= 70 ? 1.18 : hype >= 40 ? 1.1 : 1
  }
}
