import type { GigStatsLike } from '../../types'
/**
 * Calculates performance-triggered sponsorship bonuses for clean and high-hype gigs.
 *
 * @param gigStats - Rhythm performance stats used to qualify sponsor bonuses.
 * @returns Total sponsor bonus and income breakdown items.
 */
export const calculateSponsorshipBonuses = (gigStats: GigStatsLike = {}) => {
  gigStats = gigStats || {}
  const bonuses = []
  let totalBonus = 0

  if (gigStats) {
    if (gigStats.misses === 0) {
      const bonus = 200
      bonuses.push({
        labelKey: 'economy:gigIncome.techSponsor.label',
        value: bonus,
        detailKey: 'economy:gigIncome.techSponsor.detail'
      })
      totalBonus += bonus
    }
    if ((gigStats.peakHype ?? 0) >= 100) {
      const bonus = 150
      bonuses.push({
        labelKey: 'economy:gigIncome.beerSponsor.label',
        value: bonus,
        detailKey: 'economy:gigIncome.beerSponsor.detail'
      })
      totalBonus += bonus
    }
  }

  return { totalBonus, incomeItems: bonuses }
}
