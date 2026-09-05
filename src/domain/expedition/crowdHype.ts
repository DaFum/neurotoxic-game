import { finiteNumberOr } from '../../utils/finiteNumber'
export const getExpeditionCrowdHypeProfile = (
  rawHype: unknown
): { comboBonusMultiplier: 1 | 1.1 | 1.18 | 1.25 } => {
  const hype = Math.max(0, Math.min(100, finiteNumberOr(rawHype, 0)))
  return {
    comboBonusMultiplier:
      hype >= 90 ? 1.25 : hype >= 70 ? 1.18 : hype >= 40 ? 1.1 : 1
  }
}
