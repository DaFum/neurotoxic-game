import type { GigStatsLike } from '../../types'
import { finiteNumberOr } from '../../../finiteNumber'
import { BREAKDOWN_LABEL_KEYS } from '../../breakdownLabelKeys'
/**
 * Calculates performance-triggered sponsorship bonuses for clean and high-hype gigs.
 *
 * @param gigStats - Rhythm performance stats used to qualify sponsor bonuses.
 * @returns Total sponsor bonus and income breakdown items.
 */
export const calculateSponsorshipBonuses = (gigStats: GigStatsLike = {}) => {
  const bonuses = []
  let totalBonus = 0

  // Legacy callers omit hit counters. When present, zero counters describe
  // an unattempted gig; maxCombo also captures hits in persisted snapshots.
  const unattempted =
    gigStats?.perfectHits === 0 &&
    finiteNumberOr(gigStats?.hits, 0) === 0 &&
    finiteNumberOr(gigStats?.maxCombo, 0) === 0 &&
    gigStats?.misses === 0
  if (gigStats?.failed !== true && !unattempted) {
    if (gigStats?.misses === 0) {
      const bonus = 200
      bonuses.push({
        labelKey: BREAKDOWN_LABEL_KEYS.TECH_SPONSOR,
        value: bonus,
        detailKey: 'economy:gigIncome.techSponsor.detail'
      })
      totalBonus += bonus
    }
    if ((gigStats.peakHype ?? 0) >= 100) {
      const bonus = 150
      bonuses.push({
        labelKey: BREAKDOWN_LABEL_KEYS.BEER_SPONSOR,
        value: bonus,
        detailKey: 'economy:gigIncome.beerSponsor.detail'
      })
      totalBonus += bonus
    }
  }

  return { totalBonus, incomeItems: bonuses }
}
